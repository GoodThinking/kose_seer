'use strict';
// 暗黑武斗场一锁一钥：dark-portal.json 的每把锁都在对应 BOSS 上，六种新锁在真实回合里按规则生效，
// 暗黑门挑战打到的是带锁的 BOSS，玩家自己的同种精灵不带锁。只用隔离的运行时和临时 SQLite。
// Usage: node scripts/test-boss-locks-dark.cjs <runtime app dir with dist/config/node_modules> <repo root>
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const app = path.resolve(process.argv[2]);
const {locks} = JSON.parse(fs.readFileSync(path.join(path.resolve(process.argv[3]), 'compat/server-patches/boss-locks/dark-portal.json'), 'utf8'));
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

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-boss-locks-dark-'));
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
    if (lock.skills) assert.deepEqual(config.skills, lock.skills, lock.boss + ' skills');
  }
  assert.deepEqual(BossAbilityConfig.Instance.GetBossConfigByMapAndParam(102, 201).mechanics.onlyTypes, [3, 4], 'training gates untouched');
  results.push(`All ${locks.length} locks are on their bosses with level, HP, rules and hint`);

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
  const 撞击 = 10001, 水之波动 = 10070, 冻结 = 20150, 火焰漩涡 = 10034, 瞪眼 = 20004, 净化 = 20159, 天罚 = 10983, 龙王波 = 10622, 刀叶 = 10067, 能量冲击 = 10052;

  // 异常破绽：贝鲁基德不冻伤时被击倒会回满，冻伤时才倒；烧伤上不去
  let r = fight('110/1006', 306, [水之波动, 水之波动, 水之波动], {customHP: 150});
  assert.ok(r.boss.hp > 0 && r.log.some(t => t.hp === 150), 'revives to full without freeze');
  r = fight('110/1006', 306, [水之波动, 水之波动], {customHP: 150}, boss => { boss.statusDurations[5] = 2; });
  assert.equal(r.boss.hp, 0, 'falls while frozen');
  const fresh = fight('110/1006', 306, []).boss;
  assert.ok(BossSpecialRules.IsStatusImmune(fresh, 2) && !BossSpecialRules.IsStatusImmune(fresh, 5), 'only freeze lands');
  assert.ok(BossSpecialRules.IsStatusImmune(r.boss, 5), 'an active key status cannot be refreshed');
  r = fight('110/1006', 309, [火焰漩涡, 火焰漩涡, 火焰漩涡]);
  assert.ok(r.log.every(t => !(t.status[2] > 0)), 'burn does not land');
  // 命中率 50% 的惊吓必定命中艾斯德克，害怕（原本一回合）到下一回合仍在
  const 惊吓 = 20225;
  for (let i = 0; i < 5; i++) {
    r = fight('110/1055', 760, [惊吓]);
    assert.ok(r.log[0].status[6] >= 1, 'fear always lands and lasts into the next turn');
  }
  // 麻痹两回合后结束，下一回合抵抗，再下一回合才能再麻痹
  const 静电 = 20120;
  r = fight('110/1025', 1296, [静电, 静电, 静电, 静电, 静电]);
  assert.deepEqual(r.log.map(t => t.status[0] > 0), [true, true, false, false, true], 'paralysis cycle with a resisted turn');
  results.push('异常破绽: revives unless frozen, falls while frozen, other statuses do not land, key status moves always hit, last two turns, cannot be refreshed and are resisted for a turn after');

  // 坚甲：西萨拉斯防御或特防降低前不掉血；迪普利德要两项都降
  r = fight('110/1018', 9, [水之波动, 瞪眼, 水之波动]);
  assert.deepEqual(r.log.map(t => t.damage > 0), [false, false, true], 'armor breaks after one defence drop');
  r = fight('110/1056', 9, [瞪眼, 水之波动]);
  assert.equal(r.log[1].damage, 0, 'both defences must drop');
  results.push('坚甲: no damage until a defence stage is below 0 (both for 狂狮迪卡)');

  // 多层护甲：单段攻击永远打不穿（每回合恢复一层），连续攻击能打穿
  r = fight('110/1013', 760, [撞击, 撞击, 撞击, 天罚, 天罚]);
  assert.deepEqual(r.log.slice(0, 3).map(t => [t.damage, t.layers]), [[0, 3], [0, 3], [0, 3]], 'single hits are absorbed');
  assert.ok(r.log.slice(3).every(t => t.damage > 0), 'multi-hit attacks get through');
  results.push('多层护甲: single hits never get through, multi-hit attacks do');

  // 强化压制：开场强化、受击加攻、消强清零、不吃降能力、免疫秒杀
  r = fight('110/1019', 9, [水之波动, 瞪眼, 净化]);
  const boosted = locks.find(l => l.boss === '110/1019').mechanics;
  assert.deepEqual(r.log[0].levels, boosted.startStages.map((v, i) => boosted.boostOnHit.stats.includes(i) ? v + 1 : v), 'boost on hit');
  assert.equal(r.log[1].levels[1], 2, 'no stat drops');
  assert.deepEqual(r.log[2].levels, [0, 0, 0, 0, 0, 0], 'boosts cleared');
  assert.equal(BossSpecialRules.ModifyDamageToBoss({enemy: r.boss}, {}, r.boss, {type: 8}, 9999, 'ohko'), 0, 'ohko immune');
  results.push('强化压制: starts boosted, gains attack on hit, ignores stat drops and one-hit kills, 消强 clears it');

  // 疾风之躯：只吃必中技能
  r = fight('110/1012', 216, [水之波动, 龙王波]);
  assert.deepEqual(r.log.map(t => t.damage > 0), [false, true], 'only sure-hit moves land');
  results.push('疾风之躯: only sure-hit moves land');

  // 顺序破防：布林克克先草后电
  r = fight('110/1032', 1290, [能量冲击, 刀叶, 刀叶, 能量冲击]);
  assert.deepEqual(r.log.map(t => t.damage > 0), [false, true, false, true], 'grass then electric');
  results.push('顺序破防: grass then electric, wrong order deals nothing');

  // 真实挑战：暗黑门第二门打到带锁的贝鲁基德；玩家自己的同种精灵不带锁
  await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL,pet_all_num INTEGER NOT NULL,pet_max_lev INTEGER NOT NULL)');
  const petSQL = new (load('DataBase/migrations/scripts/012_fix_all_tables').Migration012FixAllTables)().upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'));
  await db.Execute(petSQL);
  for (const sql of new (load('DataBase/migrations/scripts/006_create_items').Migration006CreateItems)().upSQLite()) await db.Execute(sql);
  const uid = 417096, now = Math.floor(Date.now() / 1000);
  await db.Execute('INSERT INTO players VALUES (?, 10000, 7, 123, 1, 100)', [uid]);
  player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid: uid, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'DarkLocks'), {coins: 10000, mapID: 110, superNono: 1})),
    EventBus: new GameEventBus(), SendPacket: async () => {}});
  player._session = {Socket: {destroyed: false}, Player: player};
  player.ChallengeProgressManager = {HasDefeatedSPTBoss: () => false, GetPuniLevel: () => 0};
  player.PetManager = new PetManager(player);
  player.ItemManager = new ItemManager(player);
  player.MapSpawnManager = new MapSpawnManager(player);
  player.BattleManager = new BattleManager(player);
  await player.PetManager.Initialize();
  await player.ItemManager.Initialize();
  const pet = Object.assign(createDefaultPetInfo(uid, 306), {level: 100, catchTime: now - 100, isInBag: true, isDefault: true, skillArray: [10070]});
  PetCalculator.UpdatePetStats(pet);
  player.PetManager.PetData.PetList = [pet];
  await helper.SavePetData(player.PetManager.PetData, true);
  await player.BattleManager.HandleDarkPortalFight(6);
  const battle = player.BattleManager.GetCurrentBattle();
  const lock = locks.find(l => l.boss === '110/1006');
  assert.deepEqual([battle.enemy.petId, battle.enemy.level, battle.enemy.maxHp, battle.enemy.bossMechanics.reviveUnlessStatus], [174, lock.level, lock.customHP, [5]], 'dark portal fight');
  player.BattleManager.CleanupBattle();
  const mine = new BattleInitService(player).BuildBattlePet(174, '贝鲁基德', 70, 300, 300, 100, 100, 100, 100, 100, 3, [10006], now, 0);
  assert.equal(mine.bossMechanics, undefined, 'player pets carry no boss lock');
  results.push('A real dark portal fight meets the locked boss; player pets carry no lock');

  console.log(JSON.stringify({passed: results.length, results, database: 'temporary-only'}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (player) { player.BattleManager.CleanupBattle(); player.Data.cleanup(); helper.RemoveCache(player.Uid); }
  await db.Shutdown();
  fs.rmSync(temporary, {recursive: true, force: true});
  process.exit(process.exitCode || 0);
});
