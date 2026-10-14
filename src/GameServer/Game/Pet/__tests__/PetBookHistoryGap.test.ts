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
import { PlayerInstance } from '../../Player/PlayerInstance';
import { GameEventBus } from '../../Event/GameEventBus';
import { PetManager } from '../PetManager';
import { SptSystem } from '../SptSystem';

// Characterization of the existing storage gap, NOT a working 2309 implementation.
// Uses real pet operations and SQLite; only player statistics/network transport are stubbed.
describe('2309 prerequisite: current pets are not an acquisition history', () => {
  const db = DatabaseManager.Instance;
  const helper = DatabaseHelper.Instance;
  let directory: string;
  let oldDatabase: typeof Config.Config.database;
  let uid = 390000;
  let player: PlayerInstance;
  let manager: PetManager;
  const settle = () => new Promise(resolve => setTimeout(resolve, 150));

  async function reload(): Promise<void> {
    await helper.SavePetData(manager.PetData);
    await settle();
    helper.RemoveCache(uid);
    await db.Shutdown();
    await db.Initialize();
    manager = new PetManager(player);
    await manager.Initialize();
  }

  beforeAll(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pet-book-history-gap-'));
    oldDatabase = Config.Config.database;
    Config.Config.database = {type: 'sqlite', path: path.join(directory, 'pets.sqlite')};
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG]) {
      ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
    }
    ConfigRegistry.Instance.Register(ConfigKeys.NATURES_CONFIG, ConfigPaths[ConfigKeys.NATURES_CONFIG], ConfigType.JSON);
    await ConfigRegistry.Instance.Initialize();
    await db.Initialize();
    await db.Execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY)');
    const ddl = new Migration012FixAllTables().upSQLite().find(sql =>
      sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'));
    expect(ddl).toBeDefined();
    await db.Execute(ddl!);
  });

  beforeEach(async () => {
    uid++;
    await db.Execute('INSERT INTO players (user_id) VALUES (?)', [uid]);
    DataCache.Instance.Set('player', uid, {petAllNum: 0, petMaxLev: 0});
    player = Object.create(PlayerInstance.prototype);
    Object.defineProperty(player, 'Uid', {value: uid});
    player.EventBus = new GameEventBus();
    player.SendPacket = jest.fn().mockResolvedValue(undefined);
    manager = new PetManager(player);
    await manager.Initialize();
  });

  afterEach(async () => {
    await settle();
    player.EventBus.Destroy();
    helper.RemoveCache(uid);
  });

  afterAll(async () => {
    await db.Shutdown();
    Config.Config.database = oldDatabase;
    fs.rmSync(directory, {recursive: true, force: true});
  });

  test('bag and storage ownership survive reload but do not prove never-acquired species', async () => {
    expect(await manager.GivePet(7, 1, 1700020001)).toBe(true);
    expect(await manager.GivePet(10, 1, 1700020002)).toBe(true);
    manager.PetData.GetPetByCatchTime(1700020002)!.isInBag = false;
    await reload();
    expect(manager.PetData.GetPetsInBag().map(p => p.petId)).toEqual([7]);
    expect(manager.PetData.GetPetsInStorage().map(p => p.petId)).toEqual([10]);
    expect(manager.PetData.GetPet(13)).toBeNull();
  });

  test('acquired then removed and never acquired have identical persisted pet data', async () => {
    const before = manager.PetData.ToRow();
    expect(await manager.GivePet(7, 1, 1700020010)).toBe(true);
    expect(await manager.PetData.RemovePetByCatchTime(1700020010)).toBe(true);
    await reload();
    expect(manager.PetData.ToRow()).toEqual(before);
    const rows = await db.Query<{pet_list: string}>(
      'SELECT pet_list FROM player_pets WHERE owner_id = ?', [uid]);
    expect(rows).toEqual([{pet_list: '[]'}]);
  });

  test('real evolution overwrites the acquired species and reload cannot recover it', async () => {
    const level = SptSystem.GetEvolvingLevel(7);
    expect(SptSystem.GetEvolvesTo(7)).toBe(8);
    expect(level).toBeGreaterThan(1);
    expect(await manager.GivePet(7, level, 1700020020)).toBe(true);
    await manager.HandlePetEvolution(1700020020, 0);
    expect(manager.PetData.PetList.map(p => p.petId)).toEqual([8]);
    await reload();
    expect(manager.PetData.GetPet(7)).toBeNull();
    expect(manager.PetData.PetList.map(p => p.petId)).toEqual([8]);
    expect(Object.keys(manager.PetData.ToRow()).sort()).toEqual(['owner_id', 'pet_list']);
  });
});
