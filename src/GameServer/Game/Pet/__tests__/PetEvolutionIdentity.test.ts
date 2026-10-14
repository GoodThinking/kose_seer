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
import { PlayerInstance } from '../../Player/PlayerInstance';
import { GameEventBus } from '../../Event/GameEventBus';
import { PetManager } from '../PetManager';
import { SptSystem } from '../SptSystem';

describe('manual evolution identity and persistence in real SQLite', () => {
  const db = DatabaseManager.Instance;
  const helper = DatabaseHelper.Instance;
  const now = 1700030000;
  let directory: string;
  let oldDatabase: typeof Config.Config.database;
  let uid = 490000;
  let player: PlayerInstance;
  let manager: PetManager;
  let protocol: ClientProtocol;
  let sent: Array<{cmd: number; result: number; body: Buffer}>;
  const settle = () => new Promise(resolve => setTimeout(resolve, 150));
  async function stored(): Promise<any[]> {
    const rows = await db.Query<{pet_list: string}>(
      'SELECT pet_list FROM player_pets WHERE owner_id = ?', [uid]);
    return JSON.parse(rows[0].pet_list);
  }
  async function reload(): Promise<void> {
    await settle();
    helper.RemoveCache(uid);
    await db.Shutdown();
    await db.Initialize();
    manager = new PetManager(player);
    await manager.Initialize();
  }
  async function give(catchTime: number): Promise<void> {
    expect(await manager.GivePet(7, SptSystem.GetEvolvingLevel(7), catchTime)).toBe(true);
    await settle();
  }
  function record(packet: BaseProto): void {
    sent.push({cmd: packet.getCmdId(), result: packet.getResult(), body: packet.serialize(protocol)});
  }

  beforeAll(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pet-evolution-identity-'));
    oldDatabase = Config.Config.database;
    Config.Config.database = {type: 'sqlite', path: path.join(directory, 'pets.sqlite')};
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG]) {
      ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
    }
    ConfigRegistry.Instance.Register(ConfigKeys.NATURES_CONFIG, ConfigPaths[ConfigKeys.NATURES_CONFIG], ConfigType.JSON);
    await ConfigRegistry.Instance.Initialize();
    await db.Initialize();
    await db.Execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY)');
    const ddl = new Migration012FixAllTables().upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'));
    await db.Execute(ddl!);
  });
  beforeEach(async () => {
    uid++;
    protocol = 'xin-20261013';
    sent = [];
    await db.Execute('INSERT INTO players (user_id) VALUES (?)', [uid]);
    DataCache.Instance.Set('player', uid, {petAllNum: 0, petMaxLev: 0});
    player = Object.create(PlayerInstance.prototype);
    Object.defineProperty(player, 'Uid', {value: uid});
    Object.defineProperty(player, 'ClientProtocol', {get: () => protocol});
    player.EventBus = new GameEventBus();
    player.SendPacket = jest.fn(async (packet: BaseProto) => { record(packet); });
    manager = new PetManager(player);
    await manager.Initialize();
    jest.spyOn(Date, 'now').mockReturnValue(now * 1000);
  });
  afterEach(async () => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    await settle();
    player.EventBus.Destroy();
    helper.RemoveCache(uid);
  });
  afterAll(async () => {
    await db.Shutdown();
    Config.Config.database = oldDatabase;
    fs.rmSync(directory, {recursive: true, force: true});
  });

  test('XIN two simultaneous evolutions retain separate identities and client lookup keys', async () => {
    await give(now - 2);
    await give(now - 1);
    await Promise.all([
      manager.HandlePetEvolution(now - 2, 1), manager.HandlePetEvolution(now - 1, 1),
    ]);
    const props = sent.filter(p => p.cmd === 2508);
    expect(props).toHaveLength(2);
    expect(props.map(p => p.body.readUInt32BE(8)).sort()).toEqual([now - 2, now - 1]);
    expect(props.every(p => p.body.readUInt32BE(12) === 8)).toBe(true);
    expect(sent.filter(p => p.cmd === 2314).map(p => p.body)).toEqual([Buffer.alloc(4), Buffer.alloc(4)]);
    await reload();
    expect(manager.PetData.PetList.map(p => [p.petId, p.catchTime])).toEqual([[8, now - 2], [8, now - 1]]);
    // Existing GivePet refusal remains in force, even after evolution.
    expect(await manager.GivePet(7, 1, now - 2)).toBe(false);
  });

  test.each<ClientProtocol>(['xin-20261013', 'kose'])('%s existing current-second identity cannot be duplicated', async mode => {
    protocol = mode;
    await give(now - 1);
    await give(now);
    const before = await stored();
    await manager.HandlePetEvolution(now - 1, 1);
    if (mode === 'kose') {
      expect(sent.map(p => [p.cmd, p.result])).toEqual([[2314, 5001]]);
      expect(await stored()).toEqual(before);
    } else {
      expect(sent.find(p => p.cmd === 2508)!.body.readUInt32BE(8)).toBe(now - 1);
    }
    await reload();
    expect(manager.PetData.PetList.map(p => p.catchTime)).toEqual([now - 1, now]);
    expect(manager.PetData.GetPetByCatchTime(now)!.petId).toBe(7);
  });

  test('KOSE same-second second evolution refuses; a later explicit request can succeed', async () => {
    protocol = 'kose';
    await give(now - 2);
    await give(now - 1);
    await Promise.all([manager.HandlePetEvolution(now - 2, 1), manager.HandlePetEvolution(now - 1, 1)]);
    expect(sent.filter(p => p.cmd === 2314).map(p => p.result).sort()).toEqual([0, 5001]);
    expect(manager.PetData.PetList.map(p => [p.petId, p.catchTime])).toEqual([[8, now], [7, now - 1]]);
    jest.spyOn(Date, 'now').mockReturnValue((now + 1) * 1000);
    await manager.HandlePetEvolution(now - 1, 1);
    await reload();
    expect(manager.PetData.PetList.map(p => [p.petId, p.catchTime])).toEqual([[8, now], [8, now + 1]]);
  });

  test.each<ClientProtocol>(['xin-20261013', 'kose'])('%s normal SQLite save is visible before success response', async mode => {
    protocol = mode;
    await give(now - 1);
    let atAck: any[] | undefined;
    player.SendPacket = jest.fn(async (packet: BaseProto) => {
      if (packet.getCmdId() === 2314 && packet.getResult() === 0) atAck = await stored();
      record(packet);
    });
    jest.useFakeTimers({doNotFake: ['nextTick', 'setImmediate']});
    jest.setSystemTime(now * 1000);
    try {
      await manager.HandlePetEvolution(now - 1, 1);
      expect(atAck?.map(p => [p.petId, p.catchTime])).toEqual([[8, mode === 'kose' ? now : now - 1]]);
    } finally {
      await jest.runOnlyPendingTimersAsync();
      jest.useRealTimers();
    }
    await reload();
    expect(manager.PetData.PetList.map(p => [p.petId, p.catchTime])).toEqual(atAck!.map(p => [p.petId, p.catchTime]));
  });
});
