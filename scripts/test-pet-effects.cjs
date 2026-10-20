'use strict';
// Skill effects of obtainable pets that used to do nothing, plus "first/second strike" conditions by the actual move order.
// Runs real turns on an isolated runtime copy (no database, no network).
// Usage: node scripts/test-pet-effects.cjs <runtime app dir with dist/config/node_modules>
const assert = require('node:assert/strict');
const path = require('node:path');
const app = path.resolve(process.argv[2]);
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
const {Logger, LogLevel} = load('shared/utils/Logger');
Logger.SetMinLevel(LogLevel.Error);
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
const {BattleType} = load('shared/models/BattleModel');

const init = new BattleInitService({Uid: 1});
const service = new BattleTurnService();
const results = [];
const ok = name => results.push(name);
// 抓、鸣叫（对手攻击-1）、缩头（自身防御+1）、吸取（吸血50%）、电光火石（先制+1）
const SCRATCH = 10006, GROWL = 20002, WITHDRAW = 20001, ABSORB = 10002, QUICK = 10008;
// 皮皮（雌），伊优（雄），布布种子（雌）
const PIPI = 10, YIYOU = 4, BUBU = 1;

function pet(petId, skills, stats = {}) {
  const cfg = GameConfig.GetPetById(petId);
  const p = init.BuildBattlePet(petId, cfg.DefName, 100, 1000, 1000, 300, 300, 300, 300, 300, cfg.Type || 0, skills, 1700000000 + petId, 0);
  return Object.assign(p, {hp: 1000, maxHp: 1000}, stats);
}
async function battle(playerSkills, foeSkills, {me = PIPI, foe = YIYOU, player = {}, enemy = {}} = {}) {
  const b = {userId: 1, player: pet(me, playerSkills, {speed: 999, ...player}), enemy: pet(foe, foeSkills, {speed: 10, ...enemy}),
    turn: 0, isOver: false, startTime: 0, roundCount: 0, lastHitWasCritical: false, battleType: BattleType.PVE};
  await init.TriggerPassiveAbilities(b.player, b.enemy);
  BattleEffectIntegration.OnBattleStart(b);
  b.skills = new Map();
  for (const id of [...playerSkills, ...foeSkills]) service.LoadSkillConfig(id, b.skills);
  return b;
}
function withRandom(value, fn) {
  const random = Math.random;
  Math.random = () => value;
  try { return fn(); } finally { Math.random = random; }
}
/** One turn; returns the player's and the foe's attack results and HP changes. */
function turn(b, mine, foeSkill, random = 0.5) {
  b.turn++;
  const before = {p: b.player.hp, e: b.enemy.hp};
  const r = withRandom(random, () => BattleTurnExecutor.ExecuteTurn(b, mine, foeSkill, b.skills));
  const pick = own => [r.firstAttack, r.secondAttack].find(a => a && (a.userId === b.userId) === own);
  return {r, mine: pick(true), foe: pick(false), dealt: before.e - b.enemy.hp, taken: before.p - b.player.hp};
}
/** Damage of one use, with the move's side effects or with them stripped. */
async function hit(skill, opts = {}, strip = false, setup = () => {}) {
  const b = await battle([skill], [GROWL], opts);
  if (strip) b.skills.set(skill, {...b.skills.get(skill), sideEffect: '', sideEffectArg: ''});
  setup(b);
  return turn(b, skill, GROWL).mine.damage;
}
const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) <= Math.max(2, expected * 0.02), `${label}: ${actual} vs ${expected}`);
const afflict = (p, status, turns = 3) => { p.statusTurns = turns; p.status = status; };

(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());
  await ConfigRegistry.Instance.Initialize();
  await SkillEffectsConfig.Instance.Load();
  BossAbilityConfig.Instance.Load();

  // ==================== 威力 ====================

  // 609 幻魔空牙冲：对手中毒时威力翻倍
  {
    const poisoned = b => afflict(b.enemy, 1);
    near(await hit(10373, {}, false, poisoned), 2 * await hit(10373, {}, true, poisoned), '609 poisoned');
    near(await hit(10373), await hit(10373, {}, true), '609 clean');
  }
  ok('609 doubles power against the named status');

  // 129 蔚蓝之击：对手为雌性威力翻倍；130 深蓝利刃：对手为雌性附加60点
  {
    near(await hit(12296, {foe: BUBU}), 2 * await hit(12296, {foe: BUBU}, true), '129 female');
    near(await hit(12296, {foe: YIYOU}), await hit(12296, {foe: YIYOU}, true), '129 male');
    assert.equal(await hit(12297, {foe: BUBU}), await hit(12297, {foe: BUBU}, true) + 60, '130 female +60');
    assert.equal(await hit(12297, {foe: YIYOU}), await hit(12297, {foe: YIYOU}, true), '130 male');
  }
  ok('129/130 depend on the foe gender');

  // 82 冰冷之舞：对雄性200%，对雌性50%
  {
    near(await hit(11194, {foe: YIYOU}), 2 * await hit(11194, {foe: YIYOU}, true), '82 male');
    near(await hit(11194, {foe: BUBU}), await hit(11194, {foe: BUBU}, true) / 2, '82 female');
  }
  ok('82 doubles against males and halves against females');

  // 113 冰之潜能：26+个体值×4；1901 本能一击：个体值×5
  {
    const dv = value => b => { b.player.dv = value; };
    const [d31, d0] = [await hit(12041, {}, false, dv(31)), await hit(12041, {}, false, dv(0))];
    assert.ok(d0 > 0 && d31 > d0 * 4, `113 scales with DV: ${d0} → ${d31}`);
    const [p31, p10] = [await hit(10938, {}, false, dv(31)), await hit(10938, {}, false, dv(10))];
    assert.ok(p10 > 0 && p31 > p10 * 2.5, `1901 scales with DV: ${p10} → ${p31}`);
  }
  ok('113/1901 power follows the individual value');

  // 179 机械能量炮：本系时威力+20（原子效果本来就生效，这里防回退）
  {
    const mech = b => { b.player.type = 6; };
    near(await hit(12981, {}, false, mech), await hit(12981, {}, true, mech) * 170 / 150, '179 same type');
    near(await hit(12981), await hit(12981, {}, true), '179 other type');
  }
  ok('179 raises the power of same-type moves');

  // ==================== 伤害 ====================

  // 111 星空火雨：附加自身等级100%~200%的固定伤害（随机0.5 → 150%）
  assert.equal(await hit(11977), await hit(11977, {}, true) + 150, '111 level damage');
  ok('111 adds damage from the level');

  // 411 大杀四方：附加对手当前体力8%，连续使用每次+4%，最高20%
  {
    const b = await battle([13297], [GROWL]);
    const plain = await hit(13297, {}, true);
    assert.equal(turn(b, 13297, 0).mine.damage, plain + 80, '8% of 1000');
    const hp = b.enemy.hp;
    assert.equal(turn(b, 13297, 0).mine.damage, plain + Math.floor(hp * 12 / 100), '12% on the second use');
  }
  ok('411 grows with consecutive use');

  // 423 溃败之击：造成等同于对手防御值的固定伤害
  {
    const b = await battle([21843], [GROWL], {enemy: {defence: 345}});
    assert.equal(turn(b, 21843, GROWL).dealt, 345);
  }
  ok('423 deals the foe defence as fixed damage');

  // 98 恐惧咆哮：之后3回合对雄性伤害2倍
  {
    const b = await battle([20809, SCRATCH], [GROWL], {foe: YIYOU});
    const before = await hit(SCRATCH, {foe: YIYOU});
    turn(b, 20809, 0);
    near(turn(b, SCRATCH, 0).mine.damage, before * 2, '98 against a male');
    const f = await battle([20809, SCRATCH], [GROWL], {foe: BUBU});
    const female = await hit(SCRATCH, {foe: BUBU});
    turn(f, 20809, 0);
    near(turn(f, SCRATCH, 0).mine.damage, female, '98 against a female');
  }
  ok('98 doubles damage against males for a few turns');

  // ==================== 防守与控制 ====================

  // 131 蓝光幻盾：对手为雌性则抵挡当回合伤害
  {
    const female = await battle([21193], [SCRATCH], {foe: BUBU});
    assert.equal(turn(female, 21193, SCRATCH).taken, 0, 'blocked against a female');
    const male = await battle([21193], [SCRATCH], {foe: YIYOU});
    assert.ok(turn(male, 21193, SCRATCH).taken > 0, 'no block against a male');
  }
  ok('131 blocks damage from the named gender');

  // 83 心灵能量：雌性下两回合必定暴击；雄性下两回合必定先手
  {
    const female = await battle([20472, SCRATCH], [GROWL], {me: PIPI});
    turn(female, 20472, GROWL);
    assert.equal(turn(female, SCRATCH, GROWL).mine.isCrit, true, 'female crits next turn');
    const male = await battle([20472, SCRATCH], [SCRATCH], {me: YIYOU, foe: BUBU, player: {speed: 10}, enemy: {speed: 999}});
    turn(male, 20472, SCRATCH);
    assert.equal(turn(male, SCRATCH, SCRATCH).r.firstAttack.userId, male.userId, 'male moves first next turn');
  }
  ok('83 depends on the own gender');

  // 478 退魔封灵：之后两回合对手的属性技能无效
  {
    const b = await battle([21893, SCRATCH], [GROWL]);
    turn(b, 21893, GROWL);
    turn(b, SCRATCH, GROWL);
    assert.equal(b.player.battleLevels[0], 0, '鸣叫 sealed for two turns');
    turn(b, SCRATCH, GROWL);
    assert.equal(b.player.battleLevels[0], -1, 'seal over');
  }
  ok('478 seals the foe status moves');

  // 545 刺刃甲壳：3回合内受到高于200的伤害则对手中毒
  {
    const b = await battle([23403, GROWL], [SCRATCH], {enemy: {attack: 3000}});
    turn(b, 23403, SCRATCH);
    assert.equal(b.enemy.statusDurations[1] > 0, true, 'heavy hit poisons the foe');
  }
  ok('545 punishes heavy hits');

  // 439 森罗万象：5回合内自身能力下降或异常时，对手每回合受200
  {
    const b = await battle([21896, WITHDRAW], [WITHDRAW]);
    turn(b, 21896, WITHDRAW);
    assert.equal(b.enemy.hp, 1000, 'no damage while healthy');
    b.player.battleLevels[0] = -1;
    turn(b, WITHDRAW, WITHDRAW);
    assert.equal(b.enemy.hp, 800, '200 at the end of a weakened turn');
  }
  ok('439 hurts the foe while weakened');

  // 91 自我暗示：对手自己造成的能力变化同步到自身，自己给对手的不同步
  {
    const b = await battle([20666, GROWL], [WITHDRAW]);
    turn(b, 20666, WITHDRAW);
    assert.equal(b.player.battleLevels[1], 1, '缩头 also raises my defence');
    turn(b, GROWL, WITHDRAW);
    assert.equal(b.enemy.battleLevels[0], -1, 'my 鸣叫 lowers the foe attack');
    assert.equal(b.player.battleLevels[0], 0, 'not copied back');
    assert.equal(b.player.battleLevels[1], 2, 'the second 缩头 copies too');
  }
  ok('91 mirrors the foe own stat changes');

  // ==================== 谱尼：圣影流光破 ====================
  {
    const b = await battle([18099], [ABSORB], {enemy: {hp: 5000, maxHp: 5000, spAtk: 50}, player: {hp: 3000, maxHp: 3000}});
    const plain = await hit(18099, {enemy: {hp: 5000, maxHp: 5000}}, true);
    b.enemy.effectStates = {critUp: {turns: 3, self: true}};
    const first = turn(b, 18099, ABSORB);
    assert.equal(first.dealt, plain + 150, '837 drains 150 on the first use');
    assert.deepEqual(b.player.battleLevels, [0, 0, 1, 0, 1, 0], '523 sp.atk and speed +1');
    assert.equal(b.enemy.effectStates.critUp, undefined, '797 clears the foe turn effects');
    assert.ok(b.enemy.effectStates.healBlock, '797 blocks the foe healing');
    const second = turn(b, 18099, ABSORB);
    assert.equal(second.dealt, second.mine.damage + 250, '837 grows to 250 and 吸取 does not heal the foe');
  }
  ok('圣影流光破 (797/523/837)');

  // ==================== 先手/后手条件按实际出手顺序 ====================
  // 冲撞（后手威力×2）：玩家更快，但对手用先制技能先出手
  {
    const slowFoe = await battle([10128], [QUICK]);
    const fastFoe = await battle([10128], [SCRATCH]);
    const second = turn(slowFoe, 10128, QUICK).mine.damage;
    const first = turn(fastFoe, 10128, SCRATCH).mine.damage;
    near(second, first * 2, 'second strike by the actual order');
  }
  ok('First/second strike conditions follow the actual move order');

  console.log(JSON.stringify({passed: results.length, results}, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
