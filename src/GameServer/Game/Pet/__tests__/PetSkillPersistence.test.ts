import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import '../../../../DataBase/loaders/DataLoader';
import { DatabaseHelper } from '../../../../DataBase/DatabaseHelper';
import { DatabaseManager } from '../../../../DataBase/DatabaseManager';
import { DataCache } from '../../../../DataBase/cache/DataCache';
import { Migration012FixAllTables } from '../../../../DataBase/migrations/scripts/012_fix_all_tables';
import { PlayerData } from '../../../../DataBase/models/PlayerData';
import { ItemData } from '../../../../DataBase/models/ItemData';
import { createDefaultPlayerInfo } from '../../../../shared/models/PlayerModel';
import { Config } from '../../../../shared/config/ServerConfig';
import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../../../shared/config/ConfigDefinitions';
import { ItemManager } from '../../Item/ItemManager';
import { BaseProto } from '../../../../shared/proto/base/BaseProto';
import { ClientProtocol } from '../../../../shared/protocol/ClientProtocol';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { GameEventBus } from '../../Event/GameEventBus';
import { PetManager } from '../PetManager';
import { IPetInfo } from '../../../../shared/models/PetModel';
import { SkillSortHandler } from '../../../Server/Packet/Recv/Pet/SkillSortHandler';
import { HeadInfo } from '../../../../shared/protocol/HeadInfo';
import { IClientSession } from '../../../Server/Packet/IHandler';

describe('skill replacement and sorting normal persistence', () => {
  const db = DatabaseManager.Instance;
  const helper = DatabaseHelper.Instance;
  const identity = 1700050000;
  let directory: string;
  let oldDatabase: typeof Config.Config.database;
  let uid = 690000;
  let player: PlayerInstance;
  let manager: PetManager;
  let protocol: ClientProtocol;
  let original: number[];
  let sent: Array<{cmd: number; result: number; body: Buffer; stored: IPetInfo[]}>;
  const settle = () => new Promise(resolve => setTimeout(resolve, 150));
  async function stored(): Promise<IPetInfo[]> {
    const rows = await db.Query<{pet_list: string}>('SELECT pet_list FROM player_pets WHERE owner_id = ?', [uid]);
    return JSON.parse(rows[0].pet_list);
  }
  async function frozen(action: () => Promise<void>): Promise<void> {
    jest.useFakeTimers({doNotFake: ['nextTick', 'setImmediate']});
    try { await action(); }
    finally { await jest.runOnlyPendingTimersAsync(); jest.useRealTimers(); }
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
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pet-skills-persistence-'));
    oldDatabase = Config.Config.database;
    Config.Config.database = {type: 'sqlite', path: path.join(directory, 'pets.sqlite')};
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG]) {
      ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
    }
    ConfigRegistry.Instance.Register(ConfigKeys.NATURES_CONFIG, ConfigPaths[ConfigKeys.NATURES_CONFIG], ConfigType.JSON);
    await ConfigRegistry.Instance.Initialize();
    await db.Initialize();
    await db.Execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY, coins INTEGER NOT NULL DEFAULT 1000, gold INTEGER NOT NULL DEFAULT 0, allocatable_exp INTEGER NOT NULL DEFAULT 0)');
    await db.Execute(new Migration012FixAllTables().upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'))!);
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
    player.Data = new PlayerData({...createDefaultPlayerInfo(uid, 'SkillTest'), coins: 1000});
    player.ItemManager = new ItemManager(player);
    player.ItemManager.ItemData = new ItemData(uid);
    player.EventBus = new GameEventBus();
    player.SendPacket = jest.fn(async (packet: BaseProto) => {
      sent.push({cmd: packet.getCmdId(), result: packet.getResult(), body: packet.serialize(protocol), stored: await stored()});
    });
    manager = new PetManager(player);
    await manager.Initialize();
    expect(await manager.GivePet(8, 15, identity)).toBe(true);
    expect(await manager.GivePet(7, 1, identity + 1)).toBe(true);
    await settle();
    original = [...manager.PetData.GetPetByCatchTime(identity)!.skillArray];
    expect(original).toHaveLength(4);
    expect(original).toContain(10028);
    expect(original).not.toContain(10006);
  });
  afterEach(async () => {
    jest.useRealTimers();
    await settle();
    player.EventBus.Destroy();
    player.Data.cleanup?.();
    helper.RemoveCache(uid);
  });
  afterAll(async () => {
    await db.Shutdown();
    Config.Config.database = oldDatabase;
    fs.rmSync(directory, {recursive: true, force: true});
  });

  test.each([2307, 2312, 2328])('command %i restores skills on SQLite failure without a delayed failed write', async cmd => {
    const before = await stored();
    const expected = cmd === 2328 ? [...original].reverse() : original.map(id => id === 10028 ? 10006 : id);
    const action = () => cmd === 2307 ? manager.HandleStudySkill(identity, 10006, 10028)
      : cmd === 2312 ? manager.HandleSkillSwitch(identity, 1, 1, 10028, 10006)
      : manager.HandleSkillSort(identity, expected[0], expected[1], expected[2], expected[3]);
    await db.Execute("CREATE TRIGGER fail_skill BEFORE UPDATE ON player_pets BEGIN SELECT RAISE(FAIL, 'skill-save-blocked'); END");
    await frozen(async () => {
      try {
        await action();
        expect(sent).toHaveLength(1);
        expect(sent[0]).toMatchObject({cmd, result: 5000, body: Buffer.alloc(0)});
        expect(manager.PetData.GetPetByCatchTime(identity)!.skillArray).toEqual(original);
        expect(await stored()).toEqual(before);
      } finally { await db.Execute('DROP TRIGGER fail_skill'); }
    });
    await settle();
    expect(await stored()).toEqual(before);
    await reload();
    expect(manager.PetData.GetPetByCatchTime(identity)!.skillArray).toEqual(original);
    expect(manager.PetData.GetPetByCatchTime(identity + 1)!.skillArray).toEqual([10006]);
    sent = [];
    await frozen(action);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({cmd, result: 0});
    expect(sent[0].stored[0].skillArray).toEqual(expected);
    await reload();
    expect(manager.PetData.GetPetByCatchTime(identity)!.skillArray).toEqual(expected);
  });

  test.each([2307, 2312])('failed sort cannot roll back concurrent successful command %i', async cmd => {
    const expected = original.map(id => id === 10028 ? 10006 : id);
    const reversed = [...original].reverse();
    await db.Execute(`CREATE TRIGGER fail_sort BEFORE UPDATE ON player_pets
      WHEN json_extract(NEW.pet_list, '$[0].skillArray[0]') = ${reversed[0]}
      BEGIN SELECT RAISE(FAIL, 'sort-save-blocked'); END`);
    const execute = db.Driver.execute.bind(db.Driver);
    let release!: () => void;
    let reached!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const failed = new Promise<void>(resolve => { reached = resolve; });
    // Keep the real SQLite rejection, delay only its delivery to expose the overlap.
    const spy = jest.spyOn(db.Driver, 'execute').mockImplementation(async (sql, params) => {
      try { return await execute(sql, params); }
      catch (error) {
        if ((error as Error).message === 'sort-save-blocked') { reached(); await gate; }
        throw error;
      }
    });
    await frozen(async () => {
      try {
        const first = manager.HandleSkillSort(identity, reversed[0], reversed[1], reversed[2], reversed[3]);
        await failed;
        const second = cmd === 2307 ? manager.HandleStudySkill(identity, 10006, 10028)
          : manager.HandleSkillSwitch(identity, 1, 1, 10028, 10006);
        await new Promise<void>(resolve => setImmediate(resolve));
        release();
        await Promise.all([first, second]);
        expect(sent.find(packet => packet.cmd === 2328)?.result).toBe(5000);
        expect(sent.find(packet => packet.cmd === cmd)?.result).toBe(0);
        expect(manager.PetData.GetPetByCatchTime(identity)!.skillArray).toEqual(expected);
        expect((await stored())[0].skillArray).toEqual(expected);
      } finally {
        release();
        spy.mockRestore();
        await db.Execute('DROP TRIGGER fail_sort');
      }
    });
    await reload();
    expect(manager.PetData.GetPetByCatchTime(identity)!.skillArray).toEqual(expected);
  });

  test.each<ClientProtocol>(['xin-20261013', 'kose'])('%s replacement is saved before acknowledgement and survives reopening', async mode => {
    protocol = mode;
    const expected = original.map(id => id === 10028 ? 10006 : id);
    await frozen(() => manager.HandleSkillSwitch(identity, 1, 1, 10028, 10006));
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({cmd: 2312, result: 0});
    expect(sent[0].body).toEqual(Buffer.from([0, 0, 0, 0, 0, 0, 0, 8]));
    expect(sent[0].stored[0].skillArray).toEqual(expected);
    await reload();
    expect(manager.PetData.GetPetByCatchTime(identity)!.skillArray).toEqual(expected);
    expect(manager.PetData.GetPetByCatchTime(identity + 1)!.skillArray).toEqual([10006]);
  });

  test.each<ClientProtocol>(['xin-20261013', 'kose'])('%s four-skill permutation is saved before acknowledgement and survives reopening', async mode => {
    protocol = mode;
    const expected = [...original].reverse();
    await frozen(() => manager.HandleSkillSort(identity, expected[0], expected[1], expected[2], expected[3]));
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({cmd: 2328, result: 0, body: Buffer.alloc(0)});
    expect(sent[0].stored[0].skillArray).toEqual(expected);
    await reload();
    expect(manager.PetData.GetPetByCatchTime(identity)!.skillArray).toEqual(expected);
    expect(manager.PetData.GetPetByCatchTime(identity + 1)!.skillArray).toEqual([10006]);
  });

  test('replacement refuses unknown, premature, duplicate, absent-old and wrong-identity requests without writes', async () => {
    const before = await stored();
    const requests = [
      [identity, 10028, 999999], [identity, 10028, 10029],
      [identity, 10028, original[0]], [identity, 999999, 10006],
      [identity + 99, 10028, 10006], [identity + 1, 10028, 10007],
    ];
    for (const [time, oldId, newId] of requests) {
      await manager.HandleSkillSwitch(time, 1, 1, oldId, newId);
      expect(sent[sent.length - 1]).toMatchObject({cmd: 2312, result: 5001});
      expect(await stored()).toEqual(before);
    }
    await reload();
    expect(await stored()).toEqual(before);
  });

  test('sorting refuses duplicated, unequipped, missing and wrong-identity skills without writes', async () => {
    const before = await stored();
    const requests = [
      [identity, original[0], original[0], original[2], original[3]],
      [identity, 10006, original[1], original[2], original[3]],
      [identity, original[0], original[1], original[2], 0],
      [identity + 99, ...original], [identity + 1, ...original],
    ];
    for (const [time, a, b, c, d] of requests) {
      await manager.HandleSkillSort(time, a, b, c, d);
      expect(sent[sent.length - 1]).toMatchObject({cmd: 2328, result: 5001});
      expect(await stored()).toEqual(before);
    }
    await reload();
    expect(await stored()).toEqual(before);
  });

  test.each([[3, 2], [7, 3], [9, 4]])('old Reseer variable request at level %i reorders all %i equipped skills', async (level, count) => {
    protocol = 'kose';
    const target = identity + 2;
    expect(await manager.GivePet(7, level, target)).toBe(true);
    await settle();
    const pet = manager.PetData.GetPetByCatchTime(target)!;
    expect(pet.skillArray).toHaveLength(count);
    const expected = [...pet.skillArray].reverse();
    // Matched PetSkillSortPanel writes only catchTime and actual skills, not zero padding.
    const body = Buffer.alloc(4 + count * 4);
    [target, ...expected].forEach((value, i) => body.writeUInt32BE(value, i * 4));
    Object.defineProperty(player, 'Data', {value: {userID: uid}});
    Object.defineProperty(player, 'PetManager', {get: () => manager});
    await frozen(() => new SkillSortHandler().Handle({Player: player} as IClientSession, new HeadInfo(), body));
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({cmd: 2328, result: 0, body: Buffer.alloc(0)});
    expect(sent[0].stored.find(p => p.catchTime === target)!.skillArray).toEqual(expected);
    await reload();
    expect(manager.PetData.GetPetByCatchTime(target)!.skillArray).toEqual(expected);
    expect(manager.PetData.GetPetByCatchTime(identity)!.skillArray).toEqual(original);
  });

  test('old-profile short permutations still cannot drop, duplicate or add skills; XIN remains unchanged', async () => {
    protocol = 'kose';
    const target = identity + 2;
    expect(await manager.GivePet(7, 3, target)).toBe(true);
    await settle();
    const before = await stored();
    for (const skills of [[10006, 0, 0, 0], [10006, 10006, 0, 0], [10006, 20004, 10007, 0], [10006, 10007, 0, 0], [0, 0, 0, 0]]) {
      await manager.HandleSkillSort(target, skills[0], skills[1], skills[2], skills[3]);
      expect(sent[sent.length - 1].result).toBe(5001);
      expect(await stored()).toEqual(before);
    }
    protocol = 'xin-20261013';
    await manager.HandleSkillSort(target, 20004, 10006, 0, 0);
    expect(sent[sent.length - 1].result).toBe(5001);
    expect(await stored()).toEqual(before);
  });
});
