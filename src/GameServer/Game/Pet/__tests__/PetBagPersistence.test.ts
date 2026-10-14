import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import '../../../../DataBase/loaders/DataLoader';
import { DatabaseHelper } from '../../../../DataBase/DatabaseHelper';
import { DatabaseManager } from '../../../../DataBase/DatabaseManager';
import { Migration012FixAllTables } from '../../../../DataBase/migrations/scripts/012_fix_all_tables';
import { Config } from '../../../../shared/config/ServerConfig';
import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../../../shared/config/ConfigDefinitions';
import { createDefaultPetInfo, IPetInfo } from '../../../../shared/models/PetModel';
import { HeadInfo } from '../../../../shared/protocol/HeadInfo';
import { BaseProto } from '../../../../shared/proto/base/BaseProto';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { GameEventBus } from '../../Event/GameEventBus';
import { PetManager } from '../PetManager';
import { PetReleaseHandler } from '../../../Server/Packet/Recv/Pet/PetReleaseHandler';
import { PetDefaultHandler } from '../../../Server/Packet/Recv/Pet/PetDefaultHandler';
import { IClientSession } from '../../../Server/Packet/IHandler';

describe('bag/default persistence through real handlers and SQLite', () => {
  const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
  const uid = 680002, firstTime = 1700080100, secondTime = firstTime + 1;
  let directory: string, oldDatabase: typeof Config.Config.database;
  let player: PlayerInstance, manager: PetManager, packets: Array<{cmd: number; result: number; stored: IPetInfo[]}>;
  const settle = () => new Promise(resolve => setTimeout(resolve, 150));
  const pet = (time: number, bag: boolean, first = false): IPetInfo =>
    Object.assign(createDefaultPetInfo(uid, 7), {catchTime: time, isInBag: bag, isDefault: first});
  const stored = async (): Promise<IPetInfo[]> =>
    JSON.parse((await db.Query<{pet_list: string}>('SELECT pet_list FROM player_pets WHERE owner_id = ?', [uid]))[0].pet_list);
  async function seed(pets: IPetInfo[]): Promise<void> {
    manager.PetData.PetList = pets;
    await helper.SavePetData(manager.PetData, true);
    await settle();
    packets.length = 0;
  }
  async function request(cmd: number, ...args: number[]): Promise<void> {
    const body = Buffer.alloc(args.length * 4);
    args.forEach((value, index) => body.writeUInt32BE(value, index * 4));
    const handler = cmd === 2304 ? new PetReleaseHandler() : new PetDefaultHandler();
    await handler.Handle({Player: player} as IClientSession, new HeadInfo(), body);
  }
  async function reload(): Promise<void> {
    await settle();
    helper.RemoveCache(uid);
    manager = new PetManager(player);
    await manager.Initialize();
    player.PetManager = manager;
  }
  beforeAll(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pet-bag-persistence-'));
    oldDatabase = Config.Config.database;
    Config.Config.database = {type: 'sqlite', path: path.join(directory, 'pets.sqlite')};
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG])
      ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
    await ConfigRegistry.Instance.Initialize();
    await db.Initialize();
    await db.Execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY)');
    await db.Execute('INSERT INTO players VALUES (?)', [uid]);
    await db.Execute(new Migration012FixAllTables().upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'))!);
    player = Object.create(PlayerInstance.prototype);
    Object.defineProperty(player, 'Uid', {value: uid});
    Object.defineProperty(player, 'ClientProtocol', {value: 'kose'});
    player.EventBus = new GameEventBus();
    manager = new PetManager(player);
    player.PetManager = manager;
    await manager.Initialize();
  });
  beforeEach(() => {
    packets = [];
    player.SendPacket = jest.fn(async (packet: BaseProto) => {
      packets.push({cmd: packet.getCmdId(), result: packet.getResult(), stored: await stored()});
    });
  });
  afterEach(async () => {
    await db.Execute('DROP TRIGGER IF EXISTS reject_bag_save');
    await settle();
  });
  afterAll(async () => {
    helper.RemoveCache(uid);
    await db.Shutdown();
    Config.Config.database = oldDatabase;
    player.EventBus.Destroy();
    fs.rmSync(directory, {recursive: true, force: true});
  });

  test.each([[2304, 0], [2304, 1], [2308, 0]])('%i flag %i write abort returns 5000 and keeps cache/reload unchanged', async (cmd, flag) => {
    await seed([pet(firstTime, true, true), pet(secondTime, cmd === 2308)]);
    const before = await stored();
    const live = manager.PetData.PetList;
    await db.Execute("CREATE TRIGGER reject_bag_save BEFORE UPDATE OF pet_list ON player_pets BEGIN SELECT RAISE(ABORT, 'forced bag write failure'); END");
    await request(cmd, cmd === 2304 && flag === 0 ? firstTime : secondTime, ...(cmd === 2304 ? [flag] : []));
    expect(packets).toHaveLength(1);
    expect(packets[0]).toMatchObject({cmd, result: 5000, stored: before});
    expect(manager.PetData.PetList).toBe(live);
    expect(JSON.parse(JSON.stringify(manager.PetData.PetList))).toEqual(before);
    await settle();
    expect(await stored()).toEqual(before);
    await reload();
    expect(JSON.parse(JSON.stringify(manager.PetData.PetList))).toEqual(before);
  });

  test('takeout → default → store preserves default/order before response and after reload', async () => {
    await seed([pet(secondTime, false), pet(firstTime, true, true)]);
    await request(2304, secondTime, 1);
    expect(packets.at(-1)!.result).toBe(0);
    expect(packets.at(-1)!.stored.find(p => p.catchTime === secondTime)!.isInBag).toBe(true);
    await request(2308, secondTime);
    expect(packets.at(-1)!.stored[0]).toMatchObject({catchTime: secondTime, isDefault: true});
    expect(packets.at(-1)!.stored.filter(p => p.isDefault)).toHaveLength(1);
    await request(2304, secondTime, 0);
    expect(packets.at(-1)!.stored.find(p => p.catchTime === secondTime)).toMatchObject({isInBag: false, isDefault: false});
    expect(packets.at(-1)!.stored.find(p => p.catchTime === firstTime)!.isDefault).toBe(true);
    const expected = await stored();
    await reload();
    expect(JSON.parse(JSON.stringify(manager.PetData.PetList))).toEqual(expected);
  });

  test('empty bag, full bag, in-bag confirmation, invalid default keep established semantics', async () => {
    await seed([pet(firstTime, false)]);
    await request(2304, firstTime, 1);
    expect(packets.at(-1)!.stored[0]).toMatchObject({isInBag: true, isDefault: true, isRoomShow: false});
    await seed([...Array.from({length: 6}, (_, i) => pet(firstTime + i, true, i === 0)), pet(firstTime + 10, false)]);
    const before = await stored();
    await request(2304, firstTime + 10, 1);
    expect(packets.at(-1)!.result).toBe(5001);
    await request(2304, firstTime, 1);
    expect(packets.at(-1)!.result).toBe(0);
    await request(2308, firstTime + 10);
    expect(packets.at(-1)!.result).toBe(5001);
    expect(await stored()).toEqual(before);
  });

  test('failed success notification after commit does not send a retryable business error', async () => {
    await seed([pet(firstTime, true, true), pet(secondTime, false)]);
    const send = jest.fn(async (_packet: BaseProto) => { throw new Error('transport disconnected'); });
    player.SendPacket = send;
    await request(2304, secondTime, 1);
    expect(send).toHaveBeenCalledTimes(1);
    expect((await stored()).find(p => p.catchTime === secondTime)!.isInBag).toBe(true);
  });
});
