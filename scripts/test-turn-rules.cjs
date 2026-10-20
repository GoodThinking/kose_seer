'use strict';
// Giving up the move (item, switch, failed capture) still runs a whole turn with the foe moving first; switching in after
// a faint is free. Turn checks run on battle objects; switch checks drive BattleManager on a temporary SQLite database
// (never a live account).
// Usage: node scripts/test-turn-rules.cjs <runtime app dir with dist/config/node_modules>
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const app = path.resolve(process.argv[2]);
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const {Logger, LogLevel} = load('shared/utils/Logger');
Logger.SetMinLevel(LogLevel.Error);
const {Config} = load('shared/config/ServerConfig');
const {ConfigLoader} = load('shared/config/ConfigLoader');
const {ConfigRegistry} = load('shared/config/ConfigRegistry');
const {ConfigKeys, ConfigPaths, ConfigType} = load('shared/config/ConfigDefinitions');
const {GameConfig} = load('shared/config/game/GameConfig');
const {SkillEffectsConfig} = load('shared/config/game/SkillEffectsConfig');
const {DatabaseManager} = load('DataBase/DatabaseManager');
const {DatabaseHelper} = load('DataBase/DatabaseHelper');
const {PlayerData} = load('DataBase/models/PlayerData');
const {PlayerInstance} = load('GameServer/Game/Player/PlayerInstance');
const {PetManager} = load('GameServer/Game/Pet/PetManager');
const {ItemManager} = load('GameServer/Game/Item/ItemManager');
const {MapSpawnManager} = load('GameServer/Game/Map/MapSpawnManager');
const {BattleManager} = load('GameServer/Game/Battle/BattleManager');
const {GameEventBus} = load('GameServer/Game/Event/GameEventBus');
const {createDefaultPetInfo} = load('shared/models/PetModel');
const {createDefaultPlayerInfo} = load('shared/models/PlayerModel');
const {PetCalculator} = load('GameServer/Game/Pet/PetCalculator');
const {BossAbilityConfig} = load('GameServer/Game/Battle/BossAbility/BossAbilityConfig');
const {BattleInitService} = load('GameServer/Game/Battle/services/BattleInitService');
const {BattleTurnService} = load('GameServer/Game/Battle/services/BattleTurnService');
const {BattleTurnExecutor} = load('GameServer/Game/Battle/BattleTurnExecutor');
const {BattleEffectIntegration} = load('GameServer/Game/Battle/BattleEffectIntegration');
const Puni = load('GameServer/Game/Battle/PuniSealBattle');
const {BattleType} = load('shared/models/BattleModel');

const init = new BattleInitService({Uid: 1});
const service = new BattleTurnService();
const results = [];
const ok = name => results.push(name);
// 抓 (physical 40), 鸣叫 (status, no damage), 催眠粉 (sleep, 50% accuracy); pets 皮皮 vs 伊优
const SCRATCH = 10006, GROWL = 20002, HYPNOSIS = 20019, PLAYER = 10, FOE = 4;
const POISON = 1, SLEEP = 8;

function pet(petId, skills, stats = {}) {
  const cfg = GameConfig.GetPetById(petId);
  const p = init.BuildBattlePet(petId, cfg.DefName, 100, 1000, 1000, 300, 300, 300, 300, 300, cfg.Type || 0, skills, 1700000000 + petId, 0);
  return Object.assign(p, {hp: 1000, maxHp: 1000}, stats);
}
async function battle(playerSkills, foeSkills, {player = {}, enemy} = {}) {
  const b = {userId: 1, player: pet(PLAYER, playerSkills, {speed: 999, ...player}), enemy: enemy || pet(FOE, foeSkills, {speed: 10}),
    turn: 0, isOver: false, startTime: 0, roundCount: 0, lastHitWasCritical: false, battleType: enemy ? BattleType.BOSS : BattleType.PVE};
  await init.TriggerPassiveAbilities(b.player, b.enemy);
  BattleEffectIntegration.OnBattleStart(b);
  b.skills = new Map();
  for (const id of [...playerSkills, ...(enemy ? enemy.skills : foeSkills)]) service.LoadSkillConfig(id, b.skills);
  return b;
}
async function bossBattle(mapId, param2, playerSkills, player = {}) {
  const cfg = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, param2);
  const b = await battle(playerSkills, [], {player, enemy: init.BuildBossBattlePet(cfg, GameConfig.GetPetById(cfg.petId))});
  Object.assign(b, {bossMapId: mapId, bossParam2: param2});
  Puni.InitPuniSeal(b);
  return b;
}
function withRandom(value, fn) {
  const random = Math.random;
  Math.random = () => value;
  try { return fn(); } finally { Math.random = random; }
}
/** One normal turn (both sides pick a move). */
function turn(b, mine, foeSkill, random = 0.5) {
  b.turn++;
  const before = b.enemy.hp;
  withRandom(random, () => BattleTurnExecutor.ExecuteTurn(b, mine, foeSkill, b.skills));
  return {dealt: before - b.enemy.hp};
}
const afflict = (p, status, turns = 3) => { p.statusTurns = turns; p.status = status; };

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-turn-rules-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
let player;
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'turns.sqlite')};
  Config.Game.clientProtocol = 'xin-20261013';
  for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG, ConfigKeys.ITEM_CONFIG]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
  for (const key of [ConfigKeys.NATURES_CONFIG, ConfigKeys.MAP_OGRES, ConfigKeys.BOSS_ABILITIES, ConfigKeys.PET_ABILITIES, ConfigKeys.ELEMENTS_CONFIG, ConfigKeys.SKILL_EFFECTS_V2]) if (key) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.JSON);
  await ConfigRegistry.Instance.Initialize();
  await SkillEffectsConfig.Instance.Load();
  BossAbilityConfig.Instance.Load();

  // ==================== 放弃出手的回合 ====================

  // 回合照常开始和结束：回合数+1，双方中毒在回合结束扣血
  {
    const b = await battle([SCRATCH], [GROWL]);
    afflict(b.enemy, POISON);
    afflict(b.player, POISON);
    const attack = service.ExecuteEnemyTurn(b);
    assert.equal(b.turn, 1, 'the idle turn counts');
    assert.deepEqual([attack.userId, attack.skillId], [0, GROWL], 'the foe moves');
    assert.equal(b.enemy.hp, 875, 'foe poison ticks at the end of the idle turn');
    assert.equal(b.player.hp, 875, 'player poison ticks too');
  }
  ok('An idle turn runs turn start and turn end');

  // 敌方获得先手权，即使玩家更快
  {
    const b = await battle([SCRATCH], [GROWL]);
    b.turn++;
    const r = BattleTurnExecutor.ExecuteTurn(b, 0, GROWL, b.skills, {playerIdle: true});
    assert.equal(r.firstAttack.userId, 0, 'the foe moves first');
    assert.equal(r.secondAttack.skillId, 0, 'the player does nothing');
  }
  ok('The foe moves first when the player gives up the move');

  // 控制类异常照常过回合：睡2回合时吃药，下一回合仍睡，再下一回合醒
  {
    const b = await battle([SCRATCH], [GROWL]);
    afflict(b.player, SLEEP, 2);
    service.ExecuteEnemyTurn(b);
    assert.equal(b.player.statusDurations[SLEEP], 1, 'the idle turn counts against the sleep');
    assert.equal(turn(b, SCRATCH, GROWL).dealt, 0, 'still asleep');
    assert.ok(turn(b, SCRATCH, GROWL).dealt > 0, 'awake');
  }
  // 吃药回合被催眠：当回合算第一回合，再睡两回合
  {
    const b = await battle([SCRATCH], [HYPNOSIS]);
    withRandom(0.3, () => service.ExecuteEnemyTurn(b));
    assert.equal(b.player.status, SLEEP, '催眠粉 lands on the idle turn');
    assert.equal(turn(b, SCRATCH, HYPNOSIS).dealt, 0, 'asleep on turn 2');
    assert.equal(turn(b, SCRATCH, HYPNOSIS).dealt, 0, 'asleep on turn 3');
    assert.ok(turn(b, SCRATCH, HYPNOSIS).dealt > 0, 'three turns in total');
  }
  ok('Control statuses count idle turns');

  // 镇魂歌：一直吃药也会在第三回合结束时生效
  {
    const b = await bossBattle(110, 1012, [SCRATCH], {hp: 99999, maxHp: 99999});
    assert.equal(service.ExecuteEnemyTurn(b).skillId, 20215, '巴弗洛 opens with 镇魂歌');
    service.ExecuteEnemyTurn(b);
    service.ExecuteEnemyTurn(b);
    assert.ok(b.player.hp > 0, 'alive two turns after the song');
    service.ExecuteEnemyTurn(b);
    assert.equal(b.player.hp, 0, '镇魂歌 lands at the end of the third turn');
  }
  ok('镇魂歌 counts down on idle turns');

  // ==================== 换精灵（BattleManager） ====================

  await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL,pet_all_num INTEGER NOT NULL,pet_max_lev INTEGER NOT NULL)');
  const petSQL = new (load('DataBase/migrations/scripts/012_fix_all_tables').Migration012FixAllTables)().upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'));
  await db.Execute(petSQL);
  for (const sql of new (load('DataBase/migrations/scripts/006_create_items').Migration006CreateItems)().upSQLite()) await db.Execute(sql);
  const uid = 417064, now = Math.floor(Date.now() / 1000);
  await db.Execute('INSERT INTO players VALUES (?, 10000, 7, 123, 3, 50)', [uid]);
  const packets = [];
  player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid: uid, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'TurnRules'), {coins: 10000, mapID: 53})),
    EventBus: new GameEventBus(), SendPacket: async packet => { packets.push({command: packet.getCmdId(), result: packet.getResult()}); }});
  player._session = {Socket: {destroyed: false}, Player: player};
  player.PetManager = new PetManager(player);
  player.ItemManager = new ItemManager(player);
  player.MapSpawnManager = new MapSpawnManager(player);
  player.BattleManager = new BattleManager(player);
  await player.PetManager.Initialize();
  await player.ItemManager.Initialize();
  const make = (petId, catchTime, isDefault) => {
    const p = Object.assign(createDefaultPetInfo(uid, petId), {level: 50, catchTime, isInBag: true, isDefault, skillArray: [SCRATCH]});
    PetCalculator.UpdatePetStats(p);
    return p;
  };
  const pets = [make(139, now - 300, true), make(1, now - 200, false), make(4, now - 100, false)];
  player.PetManager.PetData.PetList = pets;
  await helper.SavePetData(player.PetManager.PetData, true);
  await player.BattleManager.HandleChallengeBoss(53, 0);
  const current = player.BattleManager.GetCurrentBattle();
  assert.ok(current, '达比拉 battle starts');
  await player.BattleManager.HandleReadyToFight();

  // 阵亡后换上：不是一个回合，敌方不出手
  {
    packets.length = 0;
    current.player.hp = 0;
    const turnBefore = current.turn;
    await player.BattleManager.HandleChangePet(pets[1].catchTime);
    assert.equal(current.player.catchTime, pets[1].catchTime, 'switched in');
    assert.ok(packets.some(p => p.command === 2407), 'switch confirmed');
    assert.ok(!packets.some(p => p.command === 2505), 'no foe move after a faint switch');
    assert.equal(current.turn, turnBefore, 'not a turn');
  }
  ok('Switching in after a faint is free');

  // 主动换精灵：放弃出手，敌方出手，回合+1
  {
    packets.length = 0;
    const turnBefore = current.turn;
    await player.BattleManager.HandleChangePet(pets[2].catchTime);
    assert.ok(packets.some(p => p.command === 2505), 'the foe moves after a voluntary switch');
    assert.equal(current.turn, turnBefore + 1, 'the switch uses up the turn');
  }
  ok('A voluntary switch gives up the move');

  // 换精灵回合结束时中毒击倒敌方：判玩家胜
  {
    const overs = [];
    player.BattleManager.HandleFightOver = async (winner, reason) => { overs.push([winner, reason]); };
    current.enemy.hp = 1;
    afflict(current.enemy, POISON);
    await player.BattleManager.HandleChangePet(pets[1].catchTime);
    assert.equal(current.enemy.hp, 0, 'poison finishes the foe at the end of the switch turn');
    assert.deepEqual(overs, [[uid, 0]], 'the player wins');
  }
  ok('A foe knocked out at the end of an idle turn ends the battle');

  console.log(JSON.stringify({passed: results.length, results, database: 'temporary-only'}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (player) { delete player.BattleManager.HandleFightOver; player.BattleManager.CleanupBattle(); player.Data.cleanup(); helper.RemoveCache(player.Uid); }
  await db.Shutdown();
  fs.rmSync(temporary, {recursive: true, force: true});
  process.exit(process.exitCode || 0);
});
