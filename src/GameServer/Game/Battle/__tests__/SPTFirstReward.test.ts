import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import '../../../../DataBase/loaders/DataLoader';
import { DatabaseManager } from '../../../../DataBase/DatabaseManager';
import { DatabaseHelper } from '../../../../DataBase/DatabaseHelper';
import { PlayerData } from '../../../../DataBase/models/PlayerData';
import { createDefaultPlayerInfo } from '../../../../shared/models/PlayerModel';
import { PlayerRepository } from '../../../../DataBase/repositories/Player/PlayerRepository';
import { DataCache } from '../../../../DataBase/cache/DataCache';
import { ChallengeProgressDataAccessor } from '../../../../DataBase/accessors/ChallengeProgressDataAccessor';
import { Migration012FixAllTables } from '../../../../DataBase/migrations/scripts/012_fix_all_tables';
import { Migration018CreateChallengeProgressTable } from '../../../../DataBase/migrations/scripts/018_create_challenge_progress_table';
import { Config } from '../../../../shared/config/ServerConfig';
import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigTypes } from '../../../../shared/config/ConfigDefinitions';
import { IBattleInfo } from '../../../../shared/models/BattleModel';
import { IPetInfo } from '../../../../shared/models/PetModel';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { PetManager } from '../../Pet/PetManager';
import { PetCalculator } from '../../Pet/PetCalculator';
import { ChallengeProgressManager } from '../../Challenge/ChallengeProgressManager';
import { GameEventBus } from '../../Event/GameEventBus';
import { PetEventType } from '../../Event/EventTypes';
import { BossAbilityConfig } from '../BossAbility/BossAbilityConfig';
import { BattleRewardService } from '../services/BattleRewardService';

describe('SPT first-win pet rejection with real PetManager and SQLite', () => {
  const db = DatabaseManager.Instance;
  const helper = DatabaseHelper.Instance;
  let directory: string;
  let oldDatabase: typeof Config.Config.database;
  let uid = 290000;
  let player: PlayerInstance;
  let service: BattleRewardService;
  let giveItem: jest.Mock;
  let now: number;
  const waitSave = () => new Promise(resolve => setTimeout(resolve, 150));
  // Only the SPT reward stage is under test, not the battle engine/ordinary victory rewards.
  const battle = {bossMapId: 12, bossParam2: 0, enemy: {id: 47, level: 10}} as IBattleInfo;
  const reward = () => service['ProcessSPTFirstDefeatReward'](battle, 12);
  async function pets(): Promise<IPetInfo[]> {
    const rows = await db.Query<{pet_list: string}>('SELECT pet_list FROM player_pets WHERE owner_id = ?', [uid]);
    return JSON.parse(rows[0].pet_list);
  }
  async function won(): Promise<boolean> {
    const rows = await db.Query<{boss_achievement: Buffer}>('SELECT boss_achievement FROM player_challenge_progress WHERE user_id = ?', [uid]);
    return rows[0].boss_achievement[0] === 1;
  }

  beforeAll(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-spt-reward-'));
    oldDatabase = Config.Config.database;
    Config.Config.database = {type: 'sqlite', path: path.join(directory, 'spt.sqlite')};
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG, ConfigKeys.NATURES_CONFIG, ConfigKeys.BOSS_ABILITIES]) {
      ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigTypes[key]);
    }
    await ConfigRegistry.Instance.Initialize();
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SPT_CONFIG, ConfigKeys.BOSS_ABILITIES]) {
      expect(ConfigRegistry.Instance.IsLoaded(key)).toBe(true);
    }
    expect(BossAbilityConfig.Instance.GetBossConfigByMapAndParam(12, 0)?.spt).toMatchObject({sptId: 1, rewardPetId: 46});
    await db.Initialize();
    await db.Execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY, coins INTEGER NOT NULL DEFAULT 100)');
    const petDDL = new Migration012FixAllTables().upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'));
    await db.Execute(petDDL!);
    const challengeDDL = new Migration018CreateChallengeProgressTable().upSQLite().find(sql => sql.includes('CREATE TABLE IF NOT EXISTS player_challenge_progress'));
    await db.Execute(challengeDDL!);
  });
  beforeEach(async () => {
    uid++;
    now = 1700010000000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    await db.Execute('INSERT INTO players (user_id) VALUES (?)', [uid]);
    player = Object.create(PlayerInstance.prototype);
    Object.defineProperty(player, 'Uid', {value: uid});
    Object.assign(player, {Data: new PlayerData({...createDefaultPlayerInfo(uid, 'SPTTest'), coins: 100}), _playerRepo: new PlayerRepository()});
    player.EventBus = new GameEventBus();
    giveItem = jest.fn(async () => true);
    Object.defineProperty(player, 'ItemManager', {value: {GiveItem: giveItem}});
    DataCache.Instance.Set('player', uid, {petAllNum: 0, petMaxLev: 0});
    player.PetManager = new PetManager(player);
    await player.PetManager.Initialize();
    player.ChallengeProgressManager = new ChallengeProgressManager(player);
    await player.ChallengeProgressManager.Initialize();
    service = new BattleRewardService(player);
  });
  afterEach(async () => {
    await waitSave();
    player.Data.cleanup();
    player.EventBus.Destroy();
    helper.RemoveCache(uid);
    ChallengeProgressDataAccessor.Instance.RemoveCache(uid);
    jest.restoreAllMocks();
  });
  afterAll(async () => {
    await db.Shutdown();
    Config.Config.database = oldDatabase;
    fs.rmSync(directory, {recursive: true, force: true});
  });

  test('Mushroom boss collision retains qualification; explicit next-second challenge succeeds once and reloads', async () => {
    expect(await player.PetManager.GivePet(7, 1, now / 1000)).toBe(true);
    await expect(reward()).rejects.toThrow('SPT pet reward was rejected');
    expect(player.ChallengeProgressManager.HasDefeatedSPTBoss(1)).toBe(false);
    await waitSave();
    expect(await won()).toBe(false);
    expect(await pets()).toHaveLength(1);
    expect(giveItem).not.toHaveBeenCalled();
    now += 1000;
    await reward();
    expect(player.ChallengeProgressManager.HasDefeatedSPTBoss(1)).toBe(true);
    expect((await pets()).map(p => [p.petId, p.catchTime])).toEqual([[7, 1700010000], [46, 1700010001]]);
    await waitSave();
    expect(await won()).toBe(true);
    helper.RemoveCache(uid);
    ChallengeProgressDataAccessor.Instance.RemoveCache(uid);
    await db.Shutdown();
    await db.Initialize();
    player.PetManager = new PetManager(player);
    await player.PetManager.Initialize();
    player.ChallengeProgressManager = new ChallengeProgressManager(player);
    await player.ChallengeProgressManager.Initialize();
    now += 1000;
    await reward();
    expect(await pets()).toHaveLength(2);
    expect(giveItem).not.toHaveBeenCalled();
  });

  test('in-flight same-SPT call across different seconds cannot grant twice', async () => {
    let entered!: () => void;
    let release!: () => void;
    const enteredPromise = new Promise<void>(resolve => { entered = resolve; });
    const gate = new Promise<void>(resolve => { release = resolve; });
    player.EventBus.Once(PetEventType.PET_OBTAINED, async () => { entered(); await gate; });
    const first = reward();
    await enteredPromise; // Real GivePet has saved but has not yet returned.
    try {
      now += 1000; // A second grant would have a different, valid identity.
      await reward();
      expect(await pets()).toHaveLength(1);
      expect(player.ChallengeProgressManager.HasDefeatedSPTBoss(1)).toBe(false);
    } finally { release(); await first; }
    expect(player.ChallengeProgressManager.HasDefeatedSPTBoss(1)).toBe(true);
    expect((await pets())[0].petId).toBe(46);
  });

  test('pet rejection gates SPT items; thrown grant releases the in-flight guard', async () => {
    // Current Mushroom config has no item: augment only this test's returned copy to exercise item gating.
    const boss = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(12, 0)!;
    jest.spyOn(BossAbilityConfig.Instance, 'GetBossConfigByMapAndParam').mockReturnValue({
      ...boss, spt: {...boss.spt!, rewardItemId: 999001},
    });
    expect(await player.PetManager.GivePet(7, 1, now / 1000)).toBe(true);
    await expect(reward()).rejects.toThrow('SPT pet reward was rejected');
    expect(giveItem).not.toHaveBeenCalled();
    expect(player.ChallengeProgressManager.HasDefeatedSPTBoss(1)).toBe(false);
    const failure = jest.spyOn(player.PetManager, 'GivePet').mockRejectedValueOnce(new Error('injected grant exception'));
    now += 1000;
    await expect(reward()).rejects.toThrow('injected grant exception');
    expect(player.ChallengeProgressManager.HasDefeatedSPTBoss(1)).toBe(false);
    expect(giveItem).not.toHaveBeenCalled();
    failure.mockRestore();
    await reward();
    expect(player.ChallengeProgressManager.HasDefeatedSPTBoss(1)).toBe(true);
    expect(giveItem).toHaveBeenCalledTimes(1);
    now += 1000;
    await reward();
    expect(await pets()).toHaveLength(2);
    expect(giveItem).toHaveBeenCalledTimes(1);
  });

  test('public settlement reports a real identity rejection as partial/spt, preserving committed ordinary rewards', async () => {
    const identity = now / 1000;
    expect(await player.PetManager.GivePet(7, 1, identity)).toBe(true);
    const fullBattle = {...battle, player: {catchTime: identity, level: 1}} as IBattleInfo;
    const result = await service.ProcessVictoryReward(uid, fullBattle);
    expect(result.status).toBe('partial');
    expect(result.failedStage).toBe('spt');
    expect(result.expGained).toBeGreaterThan(0);
    expect(result.coinsGained).toBe(50);
    expect(result.rewardItems).toEqual([{itemId: 1, itemCnt: 50}]);
    expect(await pets()).toHaveLength(1);
    const committedPet = (await pets())[0];
    let spentOnLevels = 0;
    for (let level = 2; level <= committedPet.level; level++) {
      spentOnLevels += PetCalculator.CalculateExpForLevel(level, 7);
    }
    expect(committedPet.exp + spentOnLevels).toBe(result.expGained);
    expect(result.newLevel).toBe(committedPet.level);
    expect((await db.Query<{coins: number}>('SELECT coins FROM players WHERE user_id=?', [uid]))[0].coins).toBe(150);
    await waitSave();
    expect(await won()).toBe(false);
    expect(giveItem).not.toHaveBeenCalled();
    helper.RemoveCache(uid);
    ChallengeProgressDataAccessor.Instance.RemoveCache(uid);
    await db.Shutdown();
    await db.Initialize();
    player.PetManager = new PetManager(player);
    await player.PetManager.Initialize();
    player.ChallengeProgressManager = new ChallengeProgressManager(player);
    await player.ChallengeProgressManager.Initialize();
    expect(player.PetManager.GetPetByCatchTime(identity)).toMatchObject({exp: committedPet.exp, level: committedPet.level});
    expect(player.ChallengeProgressManager.HasDefeatedSPTBoss(1)).toBe(false);
    // Only an explicit new challenge stage; never replay the whole ordinary reward settlement.
    now += 1000;
    await reward();
    expect(await pets()).toHaveLength(2);
    expect((await db.Query<{coins: number}>('SELECT coins FROM players WHERE user_id=?', [uid]))[0].coins).toBe(150);
  });

  test('public settlement remains complete when a valid first-win pet is actually granted', async () => {
    const identity = now / 1000 - 1;
    expect(await player.PetManager.GivePet(7, 1, identity)).toBe(true);
    const result = await service.ProcessVictoryReward(uid, {...battle, player: {catchTime: identity, level: 1}} as IBattleInfo);
    expect(result.status).toBe('complete');
    expect(result.failedStage).toBeUndefined();
    expect((await pets()).map(p => p.petId)).toEqual([7, 46]);
    await waitSave();
    expect(await won()).toBe(true);
  });

  test('public settlement remains complete for an already-awarded SPT without granting another pet', async () => {
    const identity = now / 1000 - 1;
    expect(await player.PetManager.GivePet(7, 1, identity)).toBe(true);
    await reward();
    now += 1000;
    const result = await service.ProcessVictoryReward(uid, {...battle, player: {catchTime: identity, level: 1}} as IBattleInfo);
    expect(result.status).toBe('complete');
    expect(result.failedStage).toBeUndefined();
    expect((await pets()).map(p => p.petId)).toEqual([7, 46]);
  });
});
