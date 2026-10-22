'use strict';
// Boss locks (一锁一钥): every lock in compat/server-patches/boss-locks/locks.json is on its boss, the 属性护盾 stops
// every kind of damage from other skill types, and a real challenge fights the locked boss. Isolated runtime only.
// Usage: node scripts/test-boss-locks.cjs <runtime app dir with dist/config/node_modules> <repo root>
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const app = path.resolve(process.argv[2]);
const {locks} = JSON.parse(fs.readFileSync(path.join(path.resolve(process.argv[3]), 'compat/server-patches/boss-locks/locks.json'), 'utf8'));
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
const {SkillEffectRuntime} = load('GameServer/Game/Battle/SkillEffectRuntime');
const {BossAbilityConfig} = load('GameServer/Game/Battle/BossAbility/BossAbilityConfig');
const {GameEventBus} = load('GameServer/Game/Event/GameEventBus');
const {createDefaultPetInfo} = load('shared/models/PetModel');
const {createDefaultPlayerInfo} = load('shared/models/PlayerModel');
const {PetCalculator} = load('GameServer/Game/Pet/PetCalculator');

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-boss-locks-'));
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
  await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL,pet_all_num INTEGER NOT NULL,pet_max_lev INTEGER NOT NULL)');
  const petSQL = new (load('DataBase/migrations/scripts/012_fix_all_tables').Migration012FixAllTables)().upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'));
  await db.Execute(petSQL);
  for (const sql of new (load('DataBase/migrations/scripts/006_create_items').Migration006CreateItems)().upSQLite()) await db.Execute(sql);
  const uid = 417095, now = Math.floor(Date.now() / 1000);
  await db.Execute('INSERT INTO players VALUES (?, 10000, 7, 123, 1, 100)', [uid]);
  player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid: uid, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'BossLocks'), {coins: 10000, mapID: 102})),
    EventBus: new GameEventBus(), SendPacket: async () => {}});
  player._session = {Socket: {destroyed: false}, Player: player};
  player.ChallengeProgressManager = {HasDefeatedSPTBoss: () => false, GetPuniLevel: () => 0};
  player.PetManager = new PetManager(player);
  player.ItemManager = new ItemManager(player);
  player.MapSpawnManager = new MapSpawnManager(player);
  player.BattleManager = new BattleManager(player);
  await player.PetManager.Initialize();
  await player.ItemManager.Initialize();
  const pet = Object.assign(createDefaultPetInfo(uid, 309), {level: 100, catchTime: now - 100, isInBag: true, isDefault: true, skillArray: [10006]});
  PetCalculator.UpdatePetStats(pet);
  player.PetManager.PetData.PetList = [pet];
  await helper.SavePetData(player.PetManager.PetData, true);
  const results = [];

  for (const lock of locks) {
    const [mapId, param2] = lock.boss.split('/').map(Number);
    const config = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, param2);
    assert.equal(config.petName, lock.petName, lock.boss);
    assert.deepEqual([config.level, config.customHP, config.hint, config.mechanics.onlyTypes, config.mechanics.statusImmune],
      [lock.level, lock.customHP, lock.hint, lock.onlyTypes, true], lock.boss + ' config');
  }
  results.push(`All ${locks.length} locks are on their bosses with the calibrated level, HP and hint`);

  // 真实挑战：训练师之门草门，只受火、飞行
  await player.BattleManager.HandleChallengeBoss(102, 201);
  const battle = player.BattleManager.GetCurrentBattle();
  const boss = battle.enemy;
  assert.deepEqual([boss.id, boss.level, boss.maxHp, boss.bossMechanics.onlyTypes], [983, 92, 3000, [3, 4]], 'locked grass gate');
  const me = battle.player;
  const skill = type => ({id: 1, type, category: 2});
  const hit = (type, kind, info) => BossSpecialRules.ModifyDamageToBoss(battle, me, boss, skill(type), 500, kind, info);
  assert.equal(hit(2, 'attack'), 0, 'water attack');
  assert.equal(hit(8, 'fixed', {mode: 'percent'}), 0, 'normal percent damage');
  assert.equal(hit(8, 'fixed', {mode: 'hp_difference'}), 0, 'same-life-death');
  assert.equal(hit(9, 'ohko'), 0, 'ice one-hit kill');
  assert.ok(hit(3, 'attack') > 0 && hit(4, 'attack') > 0, 'fire and flying get through');
  results.push('Other types deal nothing: attacks, percent and fixed damage, one-hit kills');

  const hp = boss.hp;
  SkillEffectRuntime.Lose(battle, me, boss, 300, {id: 1, type: 8}, 'dot');
  assert.equal(boss.hp, hp, 'normal damage over time');
  SkillEffectRuntime.Lose(battle, me, boss, 300, {id: 1, type: 3}, 'dot');
  assert.equal(boss.hp, hp - 300, 'fire damage over time');
  assert.ok([1, 2, 3, 4, 5, 6].every(s => BossSpecialRules.IsStatusImmune(boss, s)), 'no status, no seeding');
  results.push('Damage over time follows the shield and the boss takes no status');

  // 真实回合：用水之波动（水系，无附加效果）打草门，草门体力不减
  player.BattleManager.CleanupBattle();
  await player.BattleManager.HandleChallengeBoss(102, 201);
  const fight = player.BattleManager.GetCurrentBattle();
  const start = fight.enemy.hp;
  fight.player.skills = [10070];
  fight.player.skillPP = [20];
  new (load('GameServer/Game/Battle/services/BattleTurnService').BattleTurnService)().ExecuteTurn(fight, 10070);
  assert.ok(fight.turn >= 1 && fight.enemy.hp >= start, 'a real water attack turn does not hurt the gate');
  player.BattleManager.CleanupBattle();

  // 玩家自己的塔奇多克不带锁
  const {BattleInitService} = load('GameServer/Game/Battle/services/BattleInitService');
  const mine = new BattleInitService(player).BuildBattlePet(983, '塔奇多克', 70, 300, 300, 100, 100, 100, 100, 100, 1, [10006], now, 0);
  assert.equal(mine.bossMechanics, undefined, 'player pets carry no boss lock');
  results.push('A real turn with a water move leaves the gate untouched; player pets carry no lock');

  console.log(JSON.stringify({passed: results.length, results, database: 'temporary-only'}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (player) { player.BattleManager.CleanupBattle(); player.Data.cleanup(); helper.RemoveCache(player.Uid); }
  await db.Shutdown();
  fs.rmSync(temporary, {recursive: true, force: true});
  process.exit(process.exitCode || 0);
});
