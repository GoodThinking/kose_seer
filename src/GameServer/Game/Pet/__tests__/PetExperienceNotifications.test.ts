import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import '../../../../DataBase/loaders/DataLoader';
import { DatabaseHelper } from '../../../../DataBase/DatabaseHelper';
import { DatabaseManager } from '../../../../DataBase/DatabaseManager';
import { DataCache } from '../../../../DataBase/cache/DataCache';
import { Migration012FixAllTables } from '../../../../DataBase/migrations/scripts/012_fix_all_tables';
import { Migration022CreateRewardBoosts } from '../../../../DataBase/migrations/scripts/022_create_reward_boosts';
import { Config } from '../../../../shared/config/ServerConfig';
import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../../../shared/config/ConfigDefinitions';
import { BaseProto } from '../../../../shared/proto/base/BaseProto';
import { ClientProtocol } from '../../../../shared/protocol/ClientProtocol';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { GameEventBus } from '../../Event/GameEventBus';
import { PetManager } from '../PetManager';
import { SptSystem } from '../SptSystem';
import { PetCalculator } from '../PetCalculator';
import { IPetInfo } from '../../../../shared/models/PetModel';
import { BattleRewardService } from '../../Battle/services/BattleRewardService';

describe('experience notifications and persisted skills', () => {
  const db = DatabaseManager.Instance;
  const helper = DatabaseHelper.Instance;
  const identity = 1700040000;
  let directory: string;
  let oldDatabase: typeof Config.Config.database;
  let uid = 590000;
  let player: PlayerInstance;
  let manager: PetManager;
  let protocol: ClientProtocol;
  let sent: Array<{cmd: number; body: Buffer; stored: IPetInfo[]}>;
  const settle = () => new Promise(resolve => setTimeout(resolve, 150));
  async function stored(): Promise<IPetInfo[]> {
    const rows = await db.Query<{pet_list: string}>('SELECT pet_list FROM player_pets WHERE owner_id = ?', [uid]);
    return JSON.parse(rows[0].pet_list);
  }
  function words(buffer: Buffer): number[] {
    expect(buffer.length % 4).toBe(0);
    return Array.from({length: buffer.length / 4}, (_, i) => buffer.readUInt32BE(i * 4));
  }
  async function give(id: number, level: number): Promise<IPetInfo> {
    expect(await manager.GivePet(id, level, identity)).toBe(true);
    await settle();
    return manager.PetData.GetPetByCatchTime(identity)!;
  }
  async function reload(): Promise<void> {
    await settle();
    helper.RemoveCache(uid);
    await db.Shutdown();
    await db.Initialize();
    manager = new PetManager(player);
    await manager.Initialize();
  }
  async function frozenGain(exp: number): Promise<boolean> {
    jest.useFakeTimers({doNotFake: ['nextTick', 'setImmediate']});
    try { return await manager.HandleAddPetExpByCatchTime(identity, exp); }
    finally { await jest.runOnlyPendingTimersAsync(); jest.useRealTimers(); }
  }
  beforeAll(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pet-experience-'));
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
    await db.Execute(new Migration022CreateRewardBoosts().upSQLite()[0]);
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
    player.SendPacket = jest.fn(async (packet: BaseProto) => {
      sent.push({cmd: packet.getCmdId(), body: packet.serialize(protocol), stored: await stored()});
    });
    manager = new PetManager(player);
    await manager.Initialize();
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

  test.each<ClientProtocol>(['xin-20261013', 'kose'])('%s level 6→7 fills an open slot and persists before skill notification', async mode => {
    protocol = mode;
    const pet = await give(7, 6);
    expect(pet.skillArray).toEqual([10006, 20004]);
    expect(SptSystem.GetNewMovesOnLevelUp(7, 7).map(m => m.id)).toEqual([10007]);
    expect(await frozenGain(PetCalculator.CalculateExpForLevel(7, 7))).toBe(true);
    expect(sent.map(p => p.cmd)).toEqual([2508, 2507]);
    const prop = words(sent[0].body);
    expect(prop).toHaveLength(20);
    expect(prop.slice(0, 8)).toEqual(mode === 'xin-20261013'
      ? [0, 1, identity, 7, 7, 1173, 1173, 1941]
      : [0, 1, identity, 7, 7, 0, 0, PetCalculator.CalculateExpForLevel(8, 7)]);
    expect(prop.slice(8)).toEqual([pet.maxHp, pet.atk, pet.def, pet.spAtk, pet.spDef, pet.speed,
      pet.evHp, pet.evAtk, pet.evDef, pet.evSpAtk, pet.evSpDef, pet.evSpeed]);
    expect(sent[0].stored[0]).toMatchObject({level: 7, exp: 0, catchTime: identity});
    expect(words(sent[1].body)).toEqual([1, identity, 1, 0, 10007]);
    expect(sent[1].stored[0].skillArray).toEqual([10006, 20004, 10007]);
    await reload();
    expect(manager.PetData.GetPetByCatchTime(identity)!.skillArray).toEqual([10006, 20004, 10007]);
  });

  test.each<ClientProtocol>(['xin-20261013', 'kose'])('%s full slots advertise a learnable skill without replacing equipped skills', async mode => {
    protocol = mode;
    const pet = await give(8, 15);
    const equipped = [...pet.skillArray];
    expect(equipped).toHaveLength(4);
    expect(SptSystem.GetNewMovesOnLevelUp(8, 16).map(m => m.id)).toEqual([10029]);
    expect(await frozenGain(PetCalculator.CalculateExpForLevel(16, 8))).toBe(true);
    expect(sent.map(p => p.cmd)).toEqual([2508, 2507]);
    expect(words(sent[1].body)).toEqual([1, identity, 0, 1, 10029]);
    expect(sent[1].stored[0].skillArray).toEqual(equipped);
    await reload();
    expect(manager.PetData.GetPetByCatchTime(identity)!.skillArray).toEqual(equipped);
    await manager.HandleGetPetSkill(identity);
    const available = words(sent[sent.length - 1].body);
    expect(available[0]).toBe(available.length - 1);
    expect(available.slice(1)).toContain(10029);
    expect(available.slice(1).some(id => equipped.includes(id))).toBe(false);
  });

  test('automatic evolution reports new species with old identity and its actual level skill', async () => {
    await give(7, 13);
    expect(await frozenGain(PetCalculator.CalculateExpForLevel(14, 7))).toBe(true);
    expect(words(sent[0].body).slice(2, 5)).toEqual([identity, 8, 14]);
    expect(words(sent[1].body)).toEqual([1, identity, 0, 1, 10028]);
    await reload();
    expect(manager.PetData.GetPetByCatchTime(identity)).toMatchObject({petId: 8, level: 14});
  });

  test('sub-level experience returns false but persists and notifies; missing pet remains false and silent', async () => {
    await give(7, 6);
    expect(await frozenGain(1)).toBe(false);
    expect(sent.map(p => p.cmd)).toEqual([2508]);
    expect(sent[0].stored[0]).toMatchObject({level: 6, exp: 1});
    expect(await manager.HandleAddPetExpByCatchTime(identity + 1, 1)).toBe(false);
    expect(sent).toHaveLength(1);
  });

  test('victory service persists Pipi attack EV before notification and survives reopening', async () => {
    const pet = await give(4, 5);
    player.PetManager = manager;
    player.AddCurrency = jest.fn().mockResolvedValue(true);
    const reward = await new BattleRewardService(player).ProcessVictoryReward(uid, {
      enemy: {id: 10, level: 1}, player: {catchTime: identity, level: 5},
    } as any);
    expect(reward.expGained).toBeGreaterThan(0);
    expect(pet.evAtk).toBe(1);
    expect(sent[0].stored[0]).toMatchObject({evAtk: 1, exp: reward.expGained});
    expect(words(sent[0].body).slice(-6)).toEqual([0, 1, 0, 0, 0, 0]);
    await reload();
    expect(manager.GetPetByCatchTime(identity)).toMatchObject({evAtk: 1, exp: reward.expGained});
  });

  test('EV recalculates stats without healing and direct experience does not grant EV', async () => {
    const pet = await give(4, 100);
    pet.evAtk = 3; pet.hp = 1; PetCalculator.UpdatePetStats(pet);
    await helper.SavePetData(manager.PetData, true);
    const attack = pet.atk;
    await manager.HandleAddPetExpByCatchTime(identity, 0, 10);
    expect(pet).toMatchObject({evAtk: 4, atk: attack + 1, hp: 1, level: 100});
    await manager.HandleAddPetExpByCatchTime(identity, 1);
    expect(pet.evAtk).toBe(4);
  });

  test('EV and evolution share the same persisted candidate', async () => {
    await give(7, 13);
    await manager.HandleAddPetExpByCatchTime(identity, PetCalculator.CalculateExpForLevel(14, 7), 100008);
    expect(sent[0].stored[0]).toMatchObject({petId: 8, level: 14, evAtk: 2, evDef: 2, catchTime: identity});
    await reload();
    expect(manager.GetPetByCatchTime(identity)).toMatchObject({petId: 8, evAtk: 2, evDef: 2});
  });

  test('failed strict save leaves both experience and EV unchanged, with no success packet', async () => {
    const pet = await give(4, 5);
    const before = JSON.stringify(pet);
    const spy = jest.spyOn(helper, 'SavePetData').mockRejectedValueOnce(new Error('injected EV save failure'));
    try {
      await expect(manager.HandleAddPetExpByCatchTime(identity, 4, 10)).rejects.toThrow('injected EV save failure');
      expect(JSON.stringify(pet)).toBe(before);
      expect(sent).toHaveLength(0);
    } finally { spy.mockRestore(); }
    await reload();
    expect(manager.GetPetByCatchTime(identity)).toMatchObject({exp: 0, evAtk: 0});
  });

  test('concurrent victories serialize without lost EV updates', async () => {
    await give(4, 5);
    await Promise.all([manager.HandleAddPetExpByCatchTime(identity, 4, 10),
      manager.HandleAddPetExpByCatchTime(identity, 4, 10)]);
    await reload();
    expect(manager.GetPetByCatchTime(identity)).toMatchObject({exp: 8, evAtk: 2});
  });

  test('an already equipped level skill is not appended or advertised twice', async () => {
    const pet = await give(7, 6);
    pet.skillArray.push(10007);
    await helper.SavePetData(manager.PetData);
    await settle();
    expect(await frozenGain(PetCalculator.CalculateExpForLevel(7, 7))).toBe(true);
    expect(sent.map(p => p.cmd)).toEqual([2508]);
    expect(pet.skillArray).toEqual([10006, 20004, 10007]);
  });
});
