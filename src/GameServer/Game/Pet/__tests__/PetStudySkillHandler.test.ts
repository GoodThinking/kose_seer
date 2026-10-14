import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import '../../../../DataBase/loaders/DataLoader';
import { DatabaseHelper } from '../../../../DataBase/DatabaseHelper';
import { DatabaseManager } from '../../../../DataBase/DatabaseManager';
import { DataCache } from '../../../../DataBase/cache/DataCache';
import { Migration012FixAllTables } from '../../../../DataBase/migrations/scripts/012_fix_all_tables';
import { Config } from '../../../../shared/config/ServerConfig';
import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../../../shared/config/ConfigDefinitions';
import { BaseProto } from '../../../../shared/proto/base/BaseProto';
import { ClientProtocol } from '../../../../shared/protocol/ClientProtocol';
import { PacketBuilder } from '../../../../shared/protocol/PacketBuilder';
import { HeadInfo } from '../../../../shared/protocol/HeadInfo';
import { Handlers } from '../../../../shared/decorators/Opcode';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { GameEventBus } from '../../Event/GameEventBus';
import { PetManager } from '../PetManager';
import { IPetInfo } from '../../../../shared/models/PetModel';
import { GameConfig } from '../../../../shared/config/game/GameConfig';
import '../../../Server/Packet/Recv/Pet/PetStudySkillHandler';

describe('2307 real handler, packets and SQLite', () => {
  const db = DatabaseManager.Instance;
  const helper = DatabaseHelper.Instance;
  const identity = 1700060000;
  let directory: string;
  let oldDatabase: typeof Config.Config.database;
  let uid = 790000;
  let player: PlayerInstance;
  let manager: PetManager;
  let protocol: ClientProtocol;
  let frames: Buffer[];
  let snapshots: IPetInfo[][];
  const settle = () => new Promise(resolve => setTimeout(resolve, 150));
  async function stored(): Promise<IPetInfo[]> {
    const rows = await db.Query<{pet_list: string}>('SELECT pet_list FROM player_pets WHERE owner_id = ?', [uid]);
    return JSON.parse(rows[0].pet_list);
  }
  function request(time = identity, drop = 10028, study = 10006, flag1 = 1, flag2 = 1): Buffer {
    const body = Buffer.alloc(20);
    [time, flag1, flag2, drop, study].forEach((value, i) => body.writeUInt32BE(value, i * 4));
    return body;
  }
  async function send(body: Buffer): Promise<number> {
    const Handler = Handlers.Get(2307);
    expect(Handler).toBeDefined();
    const count = frames.length;
    await new Handler!().Handle({Player: player}, new HeadInfo(), body);
    expect(frames).toHaveLength(count + 1);
    const frame = frames[frames.length - 1];
    expect(frame.length).toBe(17);
    expect(frame.readUInt32BE(0)).toBe(17);
    expect(frame.readUInt32BE(5)).toBe(2307);
    expect(frame.readUInt32BE(9)).toBe(uid);
    return frame.readInt32BE(13);
  }
  async function reload(): Promise<void> {
    await settle();
    helper.RemoveCache(uid);
    await db.Shutdown();
    await db.Initialize();
    manager = new PetManager(player);
    await manager.Initialize();
  }
  beforeAll(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pet-study-2307-'));
    oldDatabase = Config.Config.database;
    Config.Config.database = {type: 'sqlite', path: path.join(directory, 'pets.sqlite')};
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG]) {
      ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
    }
    ConfigRegistry.Instance.Register(ConfigKeys.NATURES_CONFIG, ConfigPaths[ConfigKeys.NATURES_CONFIG], ConfigType.JSON);
    await ConfigRegistry.Instance.Initialize();
    await db.Initialize();
    await db.Execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY)');
    await db.Execute(new Migration012FixAllTables().upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'))!);
  });
  beforeEach(async () => {
    uid++;
    protocol = 'xin-20261013';
    frames = [];
    snapshots = [];
    await db.Execute('INSERT INTO players (user_id) VALUES (?)', [uid]);
    DataCache.Instance.Set('player', uid, {petAllNum: 0, petMaxLev: 0});
    player = Object.create(PlayerInstance.prototype);
    Object.defineProperty(player, 'Uid', {value: uid});
    Object.defineProperty(player, 'ClientProtocol', {get: () => protocol});
    Object.defineProperty(player, 'PetManager', {get: () => manager});
    Object.assign(player, {
      _session: {Socket: {write: (frame: Buffer) => frames.push(Buffer.from(frame))}},
      _packetBuilder: new PacketBuilder(),
    });
    player.EventBus = new GameEventBus();
    player.SendPacket = async (packet: BaseProto) => {
      snapshots.push(await stored());
      await PlayerInstance.prototype.SendPacket.call(player, packet);
    };
    manager = new PetManager(player);
    await manager.Initialize();
    expect(await manager.GivePet(8, 15, identity)).toBe(true);
    expect(await manager.GivePet(7, 1, identity + 1)).toBe(true);
    await settle();
  });
  afterEach(async () => {
    jest.useRealTimers();
    await settle();
    player.EventBus.Destroy();
    helper.RemoveCache(uid);
  });
  afterAll(async () => {
    await db.Shutdown();
    Config.Config.database = oldDatabase;
    fs.rmSync(directory, {recursive: true, force: true});
  });

  test.each<ClientProtocol>(['xin-20261013', 'kose'])('%s legal replacement saves before the only success frame and survives reopening', async mode => {
    protocol = mode;
    const before = await stored();
    const expected = before[0].skillArray.map(id => id === 10028 ? 10006 : id);
    jest.useFakeTimers({doNotFake: ['nextTick', 'setImmediate']});
    try {
      expect(await send(request())).toBe(0);
      expect(snapshots[0][0].skillArray).toEqual(expected);
    } finally { await jest.runOnlyPendingTimersAsync(); jest.useRealTimers(); }
    expect(frames).toHaveLength(1);
    await reload();
    expect(manager.PetData.GetPetByCatchTime(identity)!.skillArray).toEqual(expected);
    expect((await stored())[1]).toEqual(before[1]);
  });

  test.each([
    ['unknown skill', identity, 10028, 999999, 5001],
    ['other species skill', identity, 10028, 10004, 5001],
    ['insufficient level', identity, 10028, 10029, 5001],
    ['already equipped', identity, 10028, 10007, 5002],
    ['missing old skill', identity, 999999, 10006, 5001],
    ['unknown identity', identity + 99, 10028, 10006, 5001],
    ['different pet identity', identity + 1, 10028, 10006, 5001],
  ] as const)('%s rejects without changing memory or SQL', async (_name, time, drop, study, result) => {
    expect(GameConfig.GetSkillById(10004)).toBeTruthy();
    expect(GameConfig.GetSkillById(999999)).toBeFalsy();
    const before = await stored();
    expect(await send(request(time, drop, study))).toBe(result);
    expect(JSON.parse(manager.PetData.ToRow().pet_list)).toEqual(before);
    expect(await stored()).toEqual(before);
    await reload();
    expect(await stored()).toEqual(before);
  });

  test('only the evidenced 20-byte 1/1 request profile reaches the domain method', async () => {
    const before = await stored();
    const domain = jest.spyOn(manager, 'HandleStudySkill');
    const valid = request();
    for (const body of [Buffer.alloc(0), valid.subarray(0, 19), Buffer.concat([valid, Buffer.alloc(4)]),
      request(identity, 10028, 10006, 0, 1), request(identity, 10028, 10006, 1, 2)]) {
      expect(await send(body)).toBe(5001);
    }
    expect(domain).not.toHaveBeenCalled();
    domain.mockRestore();
    expect(await stored()).toEqual(before);
    expect(JSON.parse(manager.PetData.ToRow().pet_list)).toEqual(before);
  });
});
