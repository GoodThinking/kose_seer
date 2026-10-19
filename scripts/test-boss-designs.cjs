'use strict';
// Designed and classic-note boss mechanics (boss-mechanics.json entries without full official data) in real turns.
// Usage: node scripts/test-boss-designs.cjs <runtime app dir with dist/config/node_modules>
const assert = require('node:assert/strict');
const path = require('node:path');
const app = path.resolve(process.argv[2]);
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
const {Logger, LogLevel} = load('shared/utils/Logger');
Logger.SetMinLevel(process.env.SIM_LOG === 'info' ? LogLevel.Info : LogLevel.Error);
const {ConfigLoader} = load('shared/config/ConfigLoader');
const {ConfigRegistry} = load('shared/config/ConfigRegistry');
const {GetGameConfigRegistrations} = load('shared/config/ConfigDefinitions');
const {GameConfig} = load('shared/config/game/GameConfig');
const {SkillEffectsConfig} = load('shared/config/game/SkillEffectsConfig');
const {BossAbilityConfig} = load('GameServer/Game/Battle/BossAbility/BossAbilityConfig');
const {BattleInitService} = load('GameServer/Game/Battle/services/BattleInitService');
const {BattleTurnService} = load('GameServer/Game/Battle/services/BattleTurnService');
const {BattleTurnExecutor} = load('GameServer/Game/Battle/BattleTurnExecutor');
const {BattleEffectIntegration} = load('GameServer/Game/Battle/BattleEffectIntegration');
const {PassiveEffectRunner} = load('GameServer/Game/Battle/PassiveEffectRunner');
const {BossSpecialRules} = load('GameServer/Game/Battle/BossSpecialRules');
const Puni = load('GameServer/Game/Battle/PuniSealBattle');
const {BattleType} = load('shared/models/BattleModel');

const init = new BattleInitService({Uid: 1});
const service = new BattleTurnService();
const results = [];
const ok = name => results.push(name);
const SCRATCH = 10006, WATER = 10013, FIRE = 10007, GROWL = 20002;

function pet(petId, level, skills, stats = {}) {
  const cfg = GameConfig.GetPetById(petId);
  const p = init.BuildBattlePet(petId, cfg.DefName, level, 99999, 99999, 400, 400, 400, 400, 400, cfg.Type || 0, skills, 1700000000 + petId, 0);
  return Object.assign(p, {hp: 99999, maxHp: 99999, speed: 999}, stats);
}
async function fight(mapId, param2, player) {
  const cfg = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, param2);
  assert.ok(cfg, `boss ${mapId}/${param2}`);
  const enemy = init.BuildBossBattlePet(cfg, GameConfig.GetPetById(cfg.petId));
  const b = {userId: 1, player, enemy, turn: 0, isOver: false, startTime: 0, roundCount: 0, lastHitWasCritical: false,
    battleType: BattleType.BOSS, bossMapId: mapId, bossParam2: param2};
  Puni.InitPuniSeal(b);
  await init.TriggerPassiveAbilities(player, enemy);
  BattleEffectIntegration.OnBattleStart(b);
  b.skills = new Map();
  for (const id of [...player.skills, ...enemy.skills]) service.LoadSkillConfig(id, b.skills);
  return b;
}
function withRandom(value, fn) {
  const random = Math.random;
  Math.random = typeof value === 'function' ? value : () => value;
  try { return fn(); } finally { Math.random = random; }
}
/** One turn with a chosen boss move (0 = the boss does nothing). */
function turn(b, mine, bossSkill, random = 0.5) {
  b.turn++;
  for (const id of [mine, bossSkill]) if (id && !b.skills.has(id)) service.LoadSkillConfig(id, b.skills);
  const before = {p: b.player.hp, e: b.enemy.hp};
  const r = withRandom(random, () => BattleTurnExecutor.ExecuteTurn(b, mine, bossSkill, b.skills));
  const boss = [r.firstAttack, r.secondAttack].find(a => a && a.userId !== b.userId);
  const me = [r.firstAttack, r.secondAttack].find(a => a?.userId === b.userId);
  return {r, boss, me, dealt: before.e - b.enemy.hp, taken: before.p - b.player.hp};
}
const passiveIds = p => (p.effectCounters?._registered_passives || []).map(x => x.effectId);

(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());
  await ConfigRegistry.Instance.Initialize();
  await SkillEffectsConfig.Instance.Load();
  BossAbilityConfig.Instance.Load();

  // Every phase lists resolvable abilities and skills.
  for (const cfg of require(path.join(app, 'config/data/json/boss_abilities.json')).bossConfigs)
    for (const phase of cfg.mechanics?.phases || []) {
      for (const a of phase.abilities || []) assert.ok(PassiveEffectRunner.BuildPassiveFromConfig(a.id ?? a, a.args), `${cfg.petName} phase ability`);
      for (const id of phase.skills || []) assert.ok(GameConfig.GetSkillById(id), `${cfg.petName} phase skill ${id}`);
    }
  ok('Phase abilities and skills resolve');

  // 克拉尼特：两种形态，第二形态换成两个攻击招+两个属性招
  {
    const b = await fight(435, 0, pet(7, 100, [SCRATCH]));
    assert.equal(b.enemy.maxHp, 4500);
    b.enemy.hp = 1;
    turn(b, SCRATCH, 0);
    assert.equal(b.enemy.hp, 4500, 'second form at full HP');
    assert.deepEqual(b.enemy.skills, [11357, 11359, 20457, 20528], 'second form kit');
    b.enemy.hp = 1;
    assert.equal(turn(b, SCRATCH, 0).r.isOver, true, 'no third form');
  }
  ok('克拉尼特 two forms');

  // 墨杜萨：半血以下必定暴击
  {
    const b = await fight(438, 0, pet(7, 100, [GROWL]));
    assert.equal(turn(b, GROWL, 11466, 0.9).boss.isCrit, false, 'no crit above half');
    b.enemy.hp = Math.floor(b.enemy.maxHp / 3);
    assert.equal(turn(b, GROWL, 11466, 0.9).boss.isCrit, true, 'crit below half');
  }
  ok('墨杜萨 crits below half HP');

  // 菲尼克斯：愤怒之影反伤→光芒之影先手闪避→重生之影两条命回血
  {
    const b = await fight(318, 0, pet(7, 100, [SCRATCH, GROWL]));
    const rage = turn(b, SCRATCH, 0);
    assert.equal(rage.taken, Math.floor(rage.dealt / 4), '愤怒之影 reflects a quarter of the damage');
    b.enemy.hp = 1;
    turn(b, SCRATCH, 0);
    assert.equal(b.enemy.hp, b.enemy.maxHp, 'second shadow');
    assert.deepEqual(passiveIds(b.enemy), [2042], '光芒之影 abilities');
    assert.equal(turn(b, GROWL, 10079).r.firstAttack.userId, 0, '光芒之影 moves first');
    assert.equal(turn(b, SCRATCH, 0, 0.15).me.missed, true, '光芒之影 dodges');
    b.enemy.hp = 1;
    turn(b, SCRATCH, 0);
    assert.deepEqual(passiveIds(b.enemy), [2041], '重生之影 abilities');
    b.enemy.hp = 1000;
    turn(b, GROWL, 0);
    assert.equal(b.enemy.hp, 1100, '重生之影 heals 100');
    b.enemy.hp = 1;
    turn(b, SCRATCH, 0);
    assert.equal(b.enemy.hp, b.enemy.maxHp, '重生之影 second life');
    b.enemy.hp = 1;
    assert.equal(turn(b, SCRATCH, 0).r.isOver, true, 'four bars in total');
  }
  ok('菲尼克斯 three shadows');

  // 巴弗洛：对手等级高时开场先放镇魂歌
  {
    const high = await fight(110, 1012, pet(7, 100, [GROWL]));
    assert.equal(service.ExecuteEnemyTurn(high).skillId, 20215, 'opens with 镇魂歌 against a higher level');
    const low = await fight(110, 1012, pet(7, 50, [GROWL]));
    assert.equal(BossSpecialRules.SelectBossSkill(low, 10502), 10502, 'no opener against a lower level');
  }
  ok('巴弗洛 opens with 镇魂歌');

  // 攻击附带异常：贝鲁基德烧伤、西萨拉斯麻痹、克林卡修与冰洛伏特冻伤
  for (const [map, param2, move, status] of [[110, 1006, 10093, 2], [110, 1018, 10557, 0], [110, 1019, 10555, 5], [331, 0, 11253, 5]]) {
    const b = await fight(map, param2, pet(7, 100, [GROWL]));
    turn(b, GROWL, move, 0.1);
    assert.ok(b.player.statusDurations[status] > 0, `${b.enemy.name} inflicts ${status}`);
  }
  ok('Status on hit: 贝鲁基德/西萨拉斯/克林卡修/冰洛伏特');

  // 出场能力等级
  for (const [map, param2, stages] of [[110, 1000, [0, 0, 1, 0, 1, 0]], [110, 1018, [0, 1, 0, 1, 0, 0]], [110, 1026, [0, 1, 0, 1, 0, 0]],
    [110, 1031, [2, 0, 2, 0, 0, 0]], [110, 1037, [0, 0, 1, 0, 0, 0]], [110, 1043, [1, 0, 1, 0, 0, 0]], [110, 1049, [1, 0, 0, 0, 2, 0]]]) {
    const b = await fight(map, param2, pet(7, 100, [GROWL]));
    assert.deepEqual([...b.enemy.battleLevels], stages, `${b.enemy.name} start stages`);
  }
  ok('Start stages for 暗黑门');

  // 伤害加成（奇拉塔顿/斯加尔卡/迪普利德）与暴击加成（卡库/迪尔科特）只看特性是否挂上
  for (const [map, param2, id] of [[110, 1013, 2038], [110, 1030, 2038], [110, 1048, 2038], [110, 1024, 2030], [405, 1, 2030], [405, 1, 2042]]) {
    const b = await fight(map, param2, pet(7, 100, [GROWL]));
    assert.ok(passiveIds(b.enemy).includes(id), `${b.enemy.name} has ${id}`);
  }
  {
    // 奇拉塔顿 伤害+30%：同一招比去掉特性时高约30%
    const a = await fight(110, 1013, pet(7, 100, [GROWL]));
    const c = await fight(110, 1013, pet(7, 100, [GROWL]));
    c.enemy.effectCounters._registered_passives = [];
    const boosted = turn(a, GROWL, 10521).taken, plain = turn(c, GROWL, 10521).taken;
    assert.ok(boosted > plain * 1.25 && boosted < plain * 1.35, `奇拉塔顿 ${boosted}/${plain}`);
  }
  ok('Damage and crit traits attached');

  // 赫德卡、远古鱼龙：受击后下回合减伤30%；远古鱼龙吸收水系
  {
    const b = await fight(110, 1025, pet(7, 100, [SCRATCH]));
    const first = turn(b, SCRATCH, 0).dealt, second = turn(b, SCRATCH, 0).dealt;
    assert.ok(Math.abs(second - first * 0.7) <= 2, `赫德卡 ${second} after ${first}`);
    const fish = await fight(59, 0, pet(7, 100, [WATER]));
    fish.enemy.hp = 3000;
    turn(fish, WATER, 0);
    assert.ok(fish.enemy.hp > 3000, '远古鱼龙 absorbs water');
  }
  ok('赫德卡/远古鱼龙 guard after hits');

  // 帕多尼：反弹1/4伤害
  {
    const b = await fight(110, 1042, pet(7, 100, [SCRATCH]));
    const r = turn(b, SCRATCH, 0);
    assert.equal(r.taken, Math.floor(r.dealt / 8));
  }
  ok('帕多尼 reflects 1/8');

  // 上古炎兽：免疫烧伤；物理攻击它30%被烧伤；火系攻击被吸收
  {
    const b = await fight(16, 0, pet(7, 100, [SCRATCH, FIRE, 20048]));
    turn(b, SCRATCH, 0, 0.1);
    assert.ok(b.player.statusDurations[2] > 0, 'physical attacker burned');
    b.enemy.hp = 3000;
    turn(b, FIRE, 0);
    assert.ok(b.enemy.hp > 3000, 'fire absorbed');
    turn(b, 20048, 0, 0.3);
    assert.equal(b.enemy.statusDurations[2], 0, 'burn immune');
  }
  ok('上古炎兽 fire body');

  // 始祖灵兽、卡特斯：每回合回血
  for (const [map, param2, heal] of [[13, 0, 100], [110, 0, 100]]) {
    const b = await fight(map, param2, pet(7, 100, [GROWL]));
    b.enemy.hp = 1000;
    turn(b, GROWL, 0);
    assert.equal(b.enemy.hp, 1000 + heal, `${b.enemy.name} heals ${heal}`);
  }
  ok('始祖灵兽/卡特斯 regen');

  // 罗德利斯：复活一次
  {
    const b = await fight(405, 0, pet(7, 100, [SCRATCH]));
    b.enemy.hp = 1;
    turn(b, SCRATCH, 0);
    assert.equal(b.enemy.hp, 4000, 'reborn');
    b.enemy.hp = 1;
    assert.equal(turn(b, SCRATCH, 0).r.isOver, true, 'only once');
  }
  ok('罗德利斯 rebirth');

  // 巴斯特：特殊攻击无效，物理有效
  {
    const b = await fight(401, 1, pet(7, 100, [SCRATCH, WATER]));
    assert.equal(turn(b, WATER, 0).dealt, 0, 'special blocked');
    assert.ok(turn(b, SCRATCH, 0).dealt > 0, 'physical works');
  }
  ok('巴斯特 blocks special attacks');

  // 该伊、闪光波克尔：被命中几率降低
  for (const [map, param2] of [[415, 0], [10, 0]]) {
    const b = await fight(map, param2, pet(7, 100, [SCRATCH]));
    assert.equal(turn(b, SCRATCH, 0, 0.85).me.missed, true, `${b.enemy.name} dodges at 85`);
  }
  ok('该伊/闪光波克尔 dodge');

  // 伊特：造成伤害的50%回血
  {
    const b = await fight(414, 0, pet(7, 100, [GROWL]));
    b.enemy.hp = 1000;
    const r = turn(b, GROWL, 10067);
    assert.equal(b.enemy.hp, 1000 + Math.floor(r.taken / 2), '伊特 lifesteal');
  }
  ok('伊特 lifesteal');

  // 悠悠：20%完全抵挡；果冻鸭：50%少受30
  {
    const b = await fight(105, 0, pet(7, 100, [SCRATCH]));
    assert.equal(turn(b, SCRATCH, 0, 0.1).dealt, 0, '悠悠 blocks at 10');
    const c = await fight(34, 0, pet(7, 100, [SCRATCH]));
    const d = await fight(34, 0, pet(7, 100, [SCRATCH]));
    d.enemy.effectCounters._registered_passives = [];
    assert.equal(turn(c, SCRATCH, 0, 0.3).dealt, Math.max(0, turn(d, SCRATCH, 0, 0.3).dealt - 30), '果冻鸭 -30');
  }
  ok('悠悠/果冻鸭 damage blocks');

  // 巨型树妖、德拉萨：经典招牌技能
  {
    const tree = await fight(502, 0, pet(7, 100, [GROWL]));
    assert.deepEqual(tree.enemy.skills, [20146, 10340, 20055, 10343]);
    assert.equal(tree.enemy.maxHp, 2400);
    const dragon = await fight(484, 1, pet(7, 100, [GROWL]));
    assert.deepEqual(dragon.enemy.skills, [11752, 11754, 11751, 20879]);
  }
  ok('巨型树妖/德拉萨 classic kits');

  console.log(JSON.stringify({passed: results.length, results}, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
