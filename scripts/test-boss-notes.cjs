'use strict';
// BOSS 说明：每只 BOSS 都有机制说明（挑战提示和 SPT 终端都显示），notes.json 里六只新手 BOSS 的入门机制在真实回合里生效，
// 真实挑战打到带机制的蘑菇怪和两条命的里奥斯。只用隔离的运行时和临时 SQLite。
// Usage: node scripts/test-boss-notes.cjs <runtime app dir with dist/config/node_modules> <repo root>
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const app = path.resolve(process.argv[2]);
const notes = JSON.parse(fs.readFileSync(path.join(path.resolve(process.argv[3]), 'compat/server-patches/boss-locks/notes.json'), 'utf8'));
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

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-boss-notes-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
const random = Math.random;
let player;
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'notes.sqlite')};
  Config.Game.clientProtocol = 'xin-20261013';
  for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG, ConfigKeys.ITEM_CONFIG]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
  for (const key of [ConfigKeys.NATURES_CONFIG, ConfigKeys.MAP_OGRES, ConfigKeys.BOSS_ABILITIES, ConfigKeys.PET_ABILITIES, ConfigKeys.ELEMENTS_CONFIG, ConfigKeys.SKILL_EFFECTS_V2]) if (key) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.JSON);
  await ConfigRegistry.Instance.Initialize();
  await SkillEffectsConfig.Instance.Load();
  BossAbilityConfig.Instance.Load();
  const results = [];
  const config = key => BossAbilityConfig.Instance.GetBossConfigByMapAndParam(...key.split('/').map(Number));

  // 每只 BOSS 都有说明，挑战确认框放得下（不超过 72 字）
  const all = JSON.parse(fs.readFileSync(path.join(app, 'config/data/json/boss_abilities.json'), 'utf8')).bossConfigs;
  assert.deepEqual(all.filter(b => !b.hint || b.hint.length > 72).map(b => `${b.mapId}/${b.param2}`), [], 'every boss has a short hint');
  for (const note of [...notes.mechanics, ...notes.describe]) {
    const boss = config(note.boss);
    assert.deepEqual([boss.petName, boss.hint], [note.petName, note.hint], note.boss);
    for (const [key, value] of Object.entries(note.mechanics || {})) assert.deepEqual(boss.mechanics[key], value, `${note.boss} ${key}`);
    if (note.customHP) assert.equal(boss.customHP, note.customHP, note.boss + ' HP');
  }
  assert.deepEqual(config('12/0').abilities, [2010], '蘑菇怪 keeps unlimited PP');
  results.push(`All ${all.length} bosses have a hint of at most 72 characters; ${notes.mechanics.length} newbie mechanics and ${notes.describe.length} descriptions are in place`);

  // 回合实验：100 级精灵（体力放大 5 倍免得先倒下）对 BOSS，按给定技能顺序出手
  const init = new BattleInitService({Uid: 1}), turns = new BattleTurnService();
  const start = (key, petId, moves) => {
    const [map, param2] = key.split('/').map(Number);
    const cfg = GameConfig.GetPetById(petId), s = init.CalculateEnemyStats(cfg, 100);
    const me = init.BuildBattlePet(petId, cfg.DefName, 100, s.hp * 5, s.maxHp * 5, s.attack, s.defence, s.spAtk, s.spDef, s.speed, cfg.Type || 0, moves, 1700000000, 0);
    const bossConfig = {...config(key), skills: [10001]};
    const boss = init.BuildBossBattlePet(bossConfig, GameConfig.GetPetById(bossConfig.petId));
    return {me, boss, battle: {userId: 1, player: me, enemy: boss, turn: 0, isOver: false, startTime: 0, roundCount: 0, lastHitWasCritical: false, battleType: BattleType.BOSS, bossMapId: map, bossParam2: param2}};
  };
  const turn = (fight, sid) => { fight.me.skillPP = fight.me.skills.map(() => 99); turns.ExecuteTurn(fight.battle, sid); };
  const 拍打 = 10004, 水之波动 = 10070;

  // 依依：15% 闪避（掷骰 0.1 闪开，0.2 照常判定）
  let f = start('12/1', 7, [拍打]);
  Math.random = () => 0.1;
  assert.equal(BossSpecialRules.CheckBossHit(f.boss, {id: 拍打}), false, '依依 dodges on a low roll');
  Math.random = () => 0.2;
  assert.equal(BossSpecialRules.CheckBossHit(f.boss, {id: 拍打}), undefined, '依依 is hit on a high roll');
  Math.random = random;
  // 蘑菇怪：物理攻击它，出手的精灵 30% 中毒两回合（掷骰 0 必中毒，0.5 不中）
  const sturdy = fight => { fight.boss.hp = fight.boss.maxHp = 100000; return fight; };
  f = sturdy(start('12/0', 7, [拍打]));
  Math.random = () => 0.5;
  turn(f, 拍打);
  assert.ok(f.boss.hp < f.boss.maxHp && !(f.me.status > 0), 'a high roll does not poison');
  f = sturdy(start('12/0', 7, [拍打]));
  Math.random = () => 0;
  turn(f, 拍打);
  Math.random = random;
  assert.equal(f.me.status, 1, 'a physical hit on 蘑菇怪 poisons the attacker');
  f = sturdy(start('12/0', 7, [水之波动]));
  Math.random = () => 0;
  turn(f, 水之波动);
  Math.random = random;
  assert.ok(!(f.me.status > 0), 'special attacks do not trigger the spores');
  // 小莹蜂速度 +2，达比拉防御、特防 +1
  assert.deepEqual([...start('26/0', 7, [拍打]).boss.battleLevels], [0, 0, 0, 0, 2, 0], '小莹蜂 starts faster');
  assert.deepEqual([...start('53/0', 7, [拍打]).boss.battleLevels], [0, 1, 0, 1, 0, 0], '达比拉 starts with a hard shell');
  // 钢牙鲨：体力低于三成后必定暴击
  f = start('22/0', 7, [拍打]);
  f.boss.hp = Math.ceil(f.boss.maxHp * 0.3);
  assert.equal(BossSpecialRules.IsForcedCrit(f.boss), false, 'no forced crit at 30% HP');
  f.boss.hp--;
  assert.equal(BossSpecialRules.IsForcedCrit(f.boss), true, 'forced crit below 30% HP');
  // 里奥斯：170 体力、两条命，第一次被击倒满血复活，第二次倒下
  f = start('17/0', 7, [水之波动]);
  assert.deepEqual([f.boss.maxHp, f.boss.bossState.livesLeft], [170, 1], '里奥斯 has 170 HP and an extra life');
  f.boss.hp = 1;
  turn(f, 水之波动);
  assert.deepEqual([f.boss.hp, f.boss.bossState.livesLeft], [170, 0], '里奥斯 revives once at full HP');
  f.boss.hp = 1;
  turn(f, 水之波动);
  assert.equal(f.boss.hp, 0, '里奥斯 falls for good the second time');
  results.push('Real turns: 依依 dodges, 蘑菇怪 poisons physical attackers, 小莹蜂 and 达比拉 start boosted, 钢牙鲨 crits below 30% HP, 里奥斯 revives once');

  // 真实挑战：克洛斯星林间的蘑菇怪、火山星深处的里奥斯
  await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL,pet_all_num INTEGER NOT NULL,pet_max_lev INTEGER NOT NULL)');
  const petSQL = new (load('DataBase/migrations/scripts/012_fix_all_tables').Migration012FixAllTables)().upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'));
  await db.Execute(petSQL);
  for (const sql of new (load('DataBase/migrations/scripts/006_create_items').Migration006CreateItems)().upSQLite()) await db.Execute(sql);
  const uid = 417098, now = Math.floor(Date.now() / 1000);
  await db.Execute('INSERT INTO players VALUES (?, 10000, 7, 123, 1, 100)', [uid]);
  player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid: uid, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'BossNotes'), {coins: 10000, mapID: 12})),
    EventBus: new GameEventBus(), SendPacket: async () => {}});
  player._session = {Socket: {destroyed: false}, Player: player};
  player.ChallengeProgressManager = {HasDefeatedSPTBoss: () => false, GetPuniLevel: () => 0};
  player.PetManager = new PetManager(player);
  player.ItemManager = new ItemManager(player);
  player.MapSpawnManager = new MapSpawnManager(player);
  player.BattleManager = new BattleManager(player);
  await player.PetManager.Initialize();
  await player.ItemManager.Initialize();
  const pet = Object.assign(createDefaultPetInfo(uid, 7), {level: 12, catchTime: now - 100, isInBag: true, isDefault: true, skillArray: [拍打]});
  PetCalculator.UpdatePetStats(pet);
  player.PetManager.PetData.PetList = [pet];
  await helper.SavePetData(player.PetManager.PetData, true);
  await player.BattleManager.HandleChallengeBoss(12, 0);
  let battle = player.BattleManager.GetCurrentBattle();
  assert.deepEqual([battle.enemy.petId, battle.enemy.maxHp, battle.enemy.bossMechanics.onPhysicalHitStatus], [47, 100, {status: 1, chance: 30, turns: 2}], '蘑菇怪 with spores');
  player.BattleManager.CleanupBattle();
  player.Data.mapID = 17;
  await player.BattleManager.HandleChallengeBoss(17, 0);
  battle = player.BattleManager.GetCurrentBattle();
  assert.deepEqual([battle.enemy.petId, battle.enemy.maxHp, battle.enemy.bossState.livesLeft], [42, 170, 1], '里奥斯 with two lives');
  player.BattleManager.CleanupBattle();
  results.push('Real challenges meet 蘑菇怪 with spores and 里奥斯 with two lives');

  console.log(JSON.stringify({passed: results.length, results, database: 'temporary-only'}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  Math.random = random;
  if (player) { player.BattleManager.CleanupBattle(); player.Data.cleanup(); helper.RemoveCache(player.Uid); }
  await db.Shutdown();
  fs.rmSync(temporary, {recursive: true, force: true});
  process.exit(process.exitCode || 0);
});
