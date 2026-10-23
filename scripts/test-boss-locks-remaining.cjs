'use strict';
// 一锁一钥第三批：remaining.json 的每把锁都在对应 BOSS 上，布莱克保留一对一，塔西亚、盖亚、悠悠不加锁，
// 几种锁在真实回合里生效，真实挑战打到带锁的 BOSS。只用隔离的运行时和临时 SQLite。
// Usage: node scripts/test-boss-locks-remaining.cjs <runtime app dir with dist/config/node_modules> <repo root>
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const app = path.resolve(process.argv[2]);
const {locks} = JSON.parse(fs.readFileSync(path.join(path.resolve(process.argv[3]), 'compat/server-patches/boss-locks/remaining.json'), 'utf8'));
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const {Logger, LogLevel} = load('shared/utils/Logger');
Logger.SetMinLevel(LogLevel.Error);
const {Config} = load('shared/config/ServerConfig');
const {ConfigLoader} = load('shared/config/ConfigLoader');
const {ConfigRegistry} = load('shared/config/ConfigRegistry');
const {ConfigKeys, ConfigPaths, ConfigType} = load('shared/config/ConfigDefinitions');
const {SkillEffectsConfig} = load('shared/config/game/SkillEffectsConfig');
const {GameConfig} = load('shared/config/game/GameConfig');
const {DatabaseManager} = load('DataBase/DatabaseManager');
const {DatabaseHelper} = load('DataBase/DatabaseHelper');
const {PlayerData} = load('DataBase/models/PlayerData');
const {PlayerInstance} = load('GameServer/Game/Player/PlayerInstance');
const {PetManager} = load('GameServer/Game/Pet/PetManager');
const {ItemManager} = load('GameServer/Game/Item/ItemManager');
const {MapSpawnManager} = load('GameServer/Game/Map/MapSpawnManager');
const {BattleManager} = load('GameServer/Game/Battle/BattleManager');
const {BossSpecialRules} = load('GameServer/Game/Battle/BossSpecialRules');
const {BossAbilityConfig} = load('GameServer/Game/Battle/BossAbility/BossAbilityConfig');
const {BattleInitService} = load('GameServer/Game/Battle/services/BattleInitService');
const {BattleTurnService} = load('GameServer/Game/Battle/services/BattleTurnService');
const {GameEventBus} = load('GameServer/Game/Event/GameEventBus');
const {createDefaultPetInfo} = load('shared/models/PetModel');
const {createDefaultPlayerInfo} = load('shared/models/PlayerModel');
const {PetCalculator} = load('GameServer/Game/Pet/PetCalculator');
const {BattleType} = load('shared/models/BattleModel');

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-boss-locks-rest-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
let player;
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'locks.sqlite')};
  Config.Game.clientProtocol = 'xin-20261013';
  for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG, ConfigKeys.ITEM_CONFIG]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
  for (const key of [ConfigKeys.NATURES_CONFIG, ConfigKeys.MAP_OGRES, ConfigKeys.BOSS_ABILITIES, ConfigKeys.PET_ABILITIES, ConfigKeys.ELEMENTS_CONFIG, ConfigKeys.SKILL_EFFECTS_V2]) if (key) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.JSON);
  await ConfigRegistry.Instance.Initialize();
  await SkillEffectsConfig.Instance.Load();
  BossAbilityConfig.Instance.Load();
  const results = [];

  for (const lock of locks) {
    const [mapId, param2] = lock.boss.split('/').map(Number);
    const config = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, param2);
    assert.equal(config.petName, lock.petName, lock.boss);
    assert.deepEqual([config.level, config.customHP, config.hint, config.mechanics], [lock.level, lock.customHP, lock.hint, lock.mechanics], lock.boss + ' config');
    if (lock.abilities) assert.deepEqual(config.abilities, lock.abilities, lock.boss + ' abilities');
  }
  // 不加锁：没有任何钥匙规则（说明文字由 notes.json 另补）
  const unlocked = config => !['onlyTypes', 'reviveUnlessStatus', 'armorBreak', 'layers', 'boostOnHit', 'onlyMustHit', 'typeSequence'].some(key => key in (config.mechanics || {}));
  const 塔西亚 = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(348, 1);
  assert.ok(unlocked(塔西亚) && 塔西亚.mechanics.onPhysicalHitStatus?.status === 6, '塔西亚 stays as it was');
  const 布莱克 = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(9507, 0).mechanics;
  assert.ok(布莱克.singlePet && 布莱克.onlyTypes.join() === '5,12', '布莱克 keeps one-on-one');
  for (const key of ['419/0', '15/0', '54/0', '105/1', '105/0'])
    assert.ok(unlocked(BossAbilityConfig.Instance.GetBossConfigByMapAndParam(...key.split('/').map(Number))), '盖亚 and 悠悠 stay unlocked: ' + key);
  results.push(`All ${locks.length} locks are on their bosses; 布莱克 keeps one-on-one; 塔西亚, 盖亚 and 悠悠 stay as they were`);

  // 回合实验：100 级精灵（体力放大 5 倍免得先倒下）对 BOSS，按给定技能顺序出手，可临时改 BOSS 血量
  const init = new BattleInitService({Uid: 1}), turns = new BattleTurnService();
  const fight = (key, petId, plan, patch = {}, prepare = () => {}) => {
    const [map, param2] = key.split('/').map(Number);
    const config = {...BossAbilityConfig.Instance.GetBossConfigByMapAndParam(map, param2), ...patch, skills: [10001]};
    const cfg = GameConfig.GetPetById(petId), s = init.CalculateEnemyStats(cfg, 100);
    const me = init.BuildBattlePet(petId, cfg.DefName, 100, s.hp * 5, s.maxHp * 5, s.attack, s.defence, s.spAtk, s.spDef, s.speed, cfg.Type || 0, [...new Set(plan)], 1700000000, 0);
    const boss = init.BuildBossBattlePet(config, GameConfig.GetPetById(config.petId));
    const battle = {userId: 1, player: me, enemy: boss, turn: 0, isOver: false, startTime: 0, roundCount: 0, lastHitWasCritical: false, battleType: BattleType.BOSS, bossMapId: map, bossParam2: param2};
    prepare(boss);
    const log = [];
    for (const sid of plan) {
      me.skillPP = me.skills.map(() => 99);
      const before = boss.hp;
      turns.ExecuteTurn(battle, sid);
      log.push({sid, damage: before - boss.hp, hp: boss.hp, levels: [...boss.battleLevels], status: [...(boss.statusDurations || [])], layers: boss.bossState.layers, phase: boss.bossState.sequencePhase});
      if (boss.hp <= 0) break;
    }
    return {boss, log};
  };
  const 水之波动 = 10070, 瞪眼 = 20004, 龙王波 = 10622, 火焰喷射 = 10083, TH爆破 = 10609;

  // 属性护盾：德拉萨（冰龙）只吃战斗、龙
  let r = fight('486/0', 124, [水之波动, 龙王波]);
  assert.deepEqual(r.log.map(t => t.damage > 0), [false, true], 'only fighting and dragon hurt 德拉萨');
  // 顺序破防：冰洛伏特先火后机械
  r = fight('331/0', 309, [TH爆破, 火焰喷射, 火焰喷射, TH爆破]);
  assert.deepEqual(r.log.map(t => t.damage > 0), [false, true, false, true], 'fire then machine');
  // 坚甲两项：巴斯特只降防御不够
  r = fight('401/1', 9, [瞪眼, 水之波动]);
  assert.equal(r.log[1].damage, 0, 'both defences must drop');
  // 前期轻锁：提亚斯只吃必中
  r = fight('27/0', 216, [水之波动, 龙王波]);
  assert.deepEqual(r.log.map(t => t.damage > 0), [false, true], 'only sure-hit moves hurt 提亚斯');
  results.push('Real turns: 德拉萨 type shield, 冰洛伏特 order, 巴斯特 needs both defences down, 提亚斯 only takes sure-hit moves');

  // 真实挑战：在怀特星德拉萨的地图挑战，打到带锁的德拉萨
  await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL,pet_all_num INTEGER NOT NULL,pet_max_lev INTEGER NOT NULL)');
  const petSQL = new (load('DataBase/migrations/scripts/012_fix_all_tables').Migration012FixAllTables)().upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'));
  await db.Execute(petSQL);
  for (const sql of new (load('DataBase/migrations/scripts/006_create_items').Migration006CreateItems)().upSQLite()) await db.Execute(sql);
  const uid = 417097, now = Math.floor(Date.now() / 1000);
  await db.Execute('INSERT INTO players VALUES (?, 10000, 7, 123, 1, 100)', [uid]);
  player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid: uid, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'RestLocks'), {coins: 10000, mapID: 486})),
    EventBus: new GameEventBus(), SendPacket: async () => {}});
  player._session = {Socket: {destroyed: false}, Player: player};
  player.ChallengeProgressManager = {HasDefeatedSPTBoss: () => false, GetPuniLevel: () => 0};
  player.PetManager = new PetManager(player);
  player.ItemManager = new ItemManager(player);
  player.MapSpawnManager = new MapSpawnManager(player);
  player.BattleManager = new BattleManager(player);
  await player.PetManager.Initialize();
  await player.ItemManager.Initialize();
  const pet = Object.assign(createDefaultPetInfo(uid, 124), {level: 100, catchTime: now - 100, isInBag: true, isDefault: true, skillArray: [10070]});
  PetCalculator.UpdatePetStats(pet);
  player.PetManager.PetData.PetList = [pet];
  await helper.SavePetData(player.PetManager.PetData, true);
  await player.BattleManager.HandleChallengeBoss(486, 0);
  const battle = player.BattleManager.GetCurrentBattle();
  const lock = locks.find(l => l.boss === '486/0');
  assert.deepEqual([battle.enemy.petId, battle.enemy.level, battle.enemy.maxHp, battle.enemy.bossMechanics.onlyTypes], [715, lock.level, lock.customHP, [11, 15]], 'locked 德拉萨');
  player.BattleManager.CleanupBattle();
  results.push('A real challenge meets the locked 德拉萨');

  console.log(JSON.stringify({passed: results.length, results, database: 'temporary-only'}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (player) { player.BattleManager.CleanupBattle(); player.Data.cleanup(); helper.RemoveCache(player.Uid); }
  await db.Shutdown();
  fs.rmSync(temporary, {recursive: true, force: true});
  process.exit(process.exitCode || 0);
});
