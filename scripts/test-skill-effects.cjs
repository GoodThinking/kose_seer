'use strict';
// Classic skill effects and status rules in real turns on an isolated runtime copy (no database, no network).
// Usage: node scripts/test-skill-effects.cjs <runtime app dir with dist/config/node_modules>
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
const {SkillEffectRuntime} = load('GameServer/Game/Battle/SkillEffectRuntime');
const Puni = load('GameServer/Game/Battle/PuniSealBattle');
const {BattleType} = load('shared/models/BattleModel');

const init = new BattleInitService({Uid: 1});
const service = new BattleTurnService();
const results = [];
const ok = (name, detail = {}) => results.push({name, ...detail});

// Fixtures: 抓 (physical 40, 100%), 鸣叫 (status, foe attack -1), pets 皮皮 (flying) vs 伊优 (water), 布布种子 (grass).
const SCRATCH = 10006, GROWL = 20002, PLAYER = 10, FOE = 4, GRASS = 1;
const S = {PARALYSIS: 0, POISON: 1, FREEZE: 5, FATIGUE: 7, SLEEP: 8, CONFUSION: 10};

function pet(petId, skills, stats = {}) {
  const cfg = GameConfig.GetPetById(petId);
  const p = init.BuildBattlePet(petId, cfg.DefName, 100, 1000, 1000, 300, 300, 300, 300, 300, cfg.Type || 0, skills, 1700000000 + petId, 0);
  return Object.assign(p, {hp: 1000, maxHp: 1000}, stats);
}
async function battle(playerSkills, foeSkills, {player = {}, foe = {}, foePet = FOE, enemy} = {}) {
  const b = {userId: 1, player: pet(PLAYER, playerSkills, {speed: 999, ...player}), enemy: enemy || pet(foePet, foeSkills, {speed: 10, ...foe}),
    turn: 0, isOver: false, startTime: 0, roundCount: 0, lastHitWasCritical: false, battleType: enemy ? BattleType.BOSS : BattleType.PVE};
  await init.TriggerPassiveAbilities(b.player, b.enemy);
  BattleEffectIntegration.OnBattleStart(b);
  b.skills = new Map();
  for (const id of [...playerSkills, ...(enemy ? enemy.skills : foeSkills)]) if (id) service.LoadSkillConfig(id, b.skills);
  return b;
}
async function bossBattle(mapId, param2, playerSkills, player = {}) {
  const cfg = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, param2);
  assert.ok(cfg, `boss ${mapId}/${param2}`);
  const enemy = init.BuildBossBattlePet(cfg, GameConfig.GetPetById(cfg.petId));
  const b = await battle(playerSkills, [], {player, enemy});
  Object.assign(b, {bossMapId: mapId, bossParam2: param2});
  Puni.InitPuniSeal(b);
  return b;
}
function withRandom(value, fn) {
  const random = Math.random;
  Math.random = typeof value === 'function' ? value : () => value;
  try { return fn(); } finally { Math.random = random; }
}
/** One full turn; foeSkill 0 = the foe does nothing this turn. */
function turn(b, mine, foeSkill, random = 0.5) {
  b.turn++;
  const before = {p: b.player.hp, e: b.enemy.hp};
  const r = withRandom(random, () => BattleTurnExecutor.ExecuteTurn(b, mine, foeSkill, b.skills, {isPvp: foeSkill === 0}));
  const mineAttack = [r.firstAttack, r.secondAttack].find(a => a?.userId === b.userId);
  const foeAttack = [r.firstAttack, r.secondAttack].find(a => a && a.userId !== b.userId);
  return {r, mine: mineAttack, foe: foeAttack, dealt: before.e - b.enemy.hp, taken: before.p - b.player.hp};
}
const afflict = (p, status, turns = 3) => { p.statusTurns = turns; p.status = status; };
const stripped = (b, id) => { const s = b.skills.get(id); b.skills.set(id, {...s, sideEffect: '', sideEffectArg: ''}); };

(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());
  await ConfigRegistry.Instance.Initialize();
  await SkillEffectsConfig.Instance.Load();
  BossAbilityConfig.Instance.Load();

  // ==================== 异常状态核心规则 ====================

  // 先出手施加控制类异常，后手当回合即无法行动；默认3回合
  {
    const b = await battle([20031, SCRATCH], [SCRATCH]);
    assert.equal(turn(b, 20031, SCRATCH, 0.3).taken, 0, '麻痹粉 first: foe loses this turn');
    assert.equal(turn(b, SCRATCH, SCRATCH).taken, 0, 'paralysis turn 2');
    assert.equal(turn(b, SCRATCH, SCRATCH).taken, 0, 'paralysis turn 3');
    assert.ok(turn(b, SCRATCH, SCRATCH).taken > 0, 'paralysis over after 3 turns');
  }
  {
    const b = await battle([20031, SCRATCH], [SCRATCH], {player: {speed: 10}, foe: {speed: 999}});
    assert.ok(turn(b, 20031, SCRATCH, 0.3).taken > 0, 'foe already acted before the late paralysis');
    // 回合数从施加的回合算起：后出手施加时当回合已过，只再挡两次
    for (let i = 0; i < 2; i++) assert.equal(turn(b, SCRATCH, SCRATCH).taken, 0, `late paralysis blocks turn ${i + 2}`);
    assert.ok(turn(b, SCRATCH, SCRATCH).taken > 0, 'late paralysis over');
  }
  ok('Control status set by the first mover blocks the foe in the same turn; set by the second mover it counts the current turn');

  // 疲惫：火箭头槌令自身下回合无法攻击
  {
    const b = await battle([10072, SCRATCH], [GROWL]);
    assert.ok(turn(b, 10072, GROWL).dealt > 0, '火箭头槌 hits');
    assert.equal(turn(b, SCRATCH, GROWL).dealt, 0, 'fatigued next turn');
    assert.ok(turn(b, SCRATCH, GROWL).dealt > 0, 'fatigue over');
  }
  ok('Fatigue (7) stops the pet from acting');

  // 睡眠：属性技能不会唤醒，攻击技能命中后解除，醒来当回合即可行动
  {
    const b = await battle([20019, GROWL, SCRATCH], [SCRATCH]);
    assert.equal(turn(b, 20019, SCRATCH, 0.3).taken, 0, '催眠粉 first: foe sleeps this turn');
    assert.equal(turn(b, GROWL, SCRATCH).taken, 0, 'status move does not wake');
    const hit = turn(b, SCRATCH, SCRATCH);
    assert.equal(b.enemy.statusDurations[S.SLEEP], 0, 'woken by the attack');
    assert.ok(hit.taken > 0, 'woken foe acts in the same turn');
  }
  ok('Sleep ends when hit by an attack, not by status moves');

  // 中毒/冻伤：每回合结束扣1/8最大体力，当回合施加当回合结算
  {
    const b = await battle([20020, GROWL], [GROWL]);
    turn(b, 20020, GROWL);
    assert.equal(b.enemy.hp, 875, '毒粉: 1/8 at the end of the same turn');
    turn(b, GROWL, GROWL);
    turn(b, GROWL, GROWL);
    assert.equal(b.enemy.hp, 625, 'three poison ticks');
    turn(b, GROWL, GROWL);
    assert.equal(b.enemy.hp, 625, 'poison over');
  }
  {
    const b = await battle([GROWL], [GROWL]);
    afflict(b.enemy, S.FREEZE);
    turn(b, GROWL, GROWL);
    assert.equal(b.enemy.hp, 875, 'freeze deals 1/8');
  }
  ok('Poison/freeze lose 1/8 max HP at turn end');

  // 混乱：命中率降低80%（满命中技能同样受影响），不会令精灵无法行动
  {
    const b = await battle([GROWL], [SCRATCH]);
    afflict(b.enemy, S.CONFUSION);
    const miss = turn(b, GROWL, SCRATCH, 0.5);
    assert.equal(miss.foe.missed, true, 'confused 100% move misses at 50');
    assert.equal(miss.taken, 0);
    assert.ok(turn(b, GROWL, SCRATCH, 0.1).taken > 0, 'confused move still hits within 20%');
  }
  {
    // 落空的技能没有特效：混乱中的鸣叫落空不降对手攻击
    const b = await battle([GROWL], [0]);
    afflict(b.player, S.CONFUSION);
    assert.equal(turn(b, GROWL, 0, 0.5).mine.missed, true, 'confused 鸣叫 misses');
    assert.equal(b.enemy.battleLevels[0], 0, 'missed 鸣叫 has no effect');
  }
  ok('Confusion cuts accuracy by 80% instead of skipping the turn; missed moves have no effects');

  // 原子效果的概率条件按技能参数判定（以前一律用配置默认值：能力变化100%、疲惫30%）
  {
    const roll = async (move, random) => { const b = await battle([move], [0]); turn(b, move, 0, random); return b; };
    assert.equal((await roll(10015, 0.5)).enemy.battleLevels[1], 0, '咬碎 15%: no drop at 50');
    assert.equal((await roll(10015, 0.1)).enemy.battleLevels[1], -2, '咬碎 15%: drop at 10');
    assert.equal((await roll(10132, 0.5)).player.battleLevels[1], 0, '硬化冲击 20%: no boost at 50');
    assert.equal((await roll(10132, 0.1)).player.battleLevels[1], 1, '硬化冲击 20%: boost at 10');
    const weak = await battle([10245], [SCRATCH]);
    assert.ok(turn(weak, 10245, SCRATCH, 0.2).taken > 0, '气绝冲 10%: no fatigue at 20');
    const sure = await battle([20499], [SCRATCH]);
    assert.equal(turn(sure, 20499, SCRATCH, 0.6).taken, 0, '灵魂干涉 100%: fatigue at 60');
  }
  ok('Probability arguments of atomic effects follow the skill');

  // ==================== 经典效果 ====================

  // 寄生种子：5回合每回合吸取1/8，草系无效
  {
    const b = await battle([20007, GROWL], [GROWL], {player: {hp: 300}});
    turn(b, 20007, GROWL);
    assert.deepEqual([b.enemy.hp, b.player.hp], [875, 425], 'seed drains at the end of the same turn');
    for (let i = 0; i < 5; i++) turn(b, GROWL, GROWL);
    assert.equal(b.enemy.hp, 375, 'five drains in total');
  }
  {
    const b = await battle([20007, GROWL], [GROWL], {foePet: GRASS});
    turn(b, 20007, GROWL);
    turn(b, GROWL, GROWL);
    assert.equal(b.enemy.hp, 1000, 'grass pets are immune to 寄生种子');
  }
  ok('寄生种子 drains 1/8 for 5 turns and skips grass pets');

  // 海洋之心：降低对方1/4体力
  {
    const b = await battle([20143], [GROWL]);
    assert.equal(turn(b, 20143, GROWL).dealt, 250, '海洋之心 removes 1/4 max HP');
  }
  ok('海洋之心 removes 1/n of max HP');

  // 绝命火焰5%秒杀；极度冰点命中即秒杀
  {
    const b = await battle([11022], [GROWL]);
    turn(b, 11022, GROWL, 0.5);
    assert.ok(b.enemy.hp > 0, '绝命火焰 without the 5% roll');
    turn(b, 11022, GROWL, 0.01);
    assert.equal(b.enemy.hp, 0, '绝命火焰 OHKO');
  }
  {
    const b = await battle([10210], [GROWL]);
    turn(b, 10210, GROWL, 0.1);
    assert.equal(b.enemy.hp, 0, '极度冰点 OHKO on hit');
  }
  ok('绝命火焰/极度冰点 OHKO');

  // 镇魂歌：3回合后对方死亡
  {
    const b = await battle([20215, GROWL], [GROWL]);
    turn(b, 20215, GROWL);
    turn(b, GROWL, GROWL);
    turn(b, GROWL, GROWL);
    assert.equal(b.enemy.hp, 1000, 'alive during the countdown');
    turn(b, GROWL, GROWL);
    assert.equal(b.enemy.hp, 0, '镇魂歌 kills three turns after use');
  }
  ok('镇魂歌 kills the foe three turns later');

  // 乱突：2~5次攻击
  {
    const b = await battle([10022], [GROWL]);
    b.skills.get(10022).accuracy = 100;
    const multi = turn(b, 10022, GROWL, 0.99);
    const one = await battle([10022], [GROWL]);
    one.skills.get(10022).accuracy = 100;
    stripped(one, 10022);
    const single = turn(one, 10022, GROWL, 0.99);
    assert.equal(multi.mine.atkTimes, 5, 'five hits reported');
    assert.equal(multi.dealt, single.dealt * 5, 'five times the damage');
  }
  ok('乱突 hits 2~5 times');

  // 旋转冲击：额外50点固定伤害
  {
    const a = await battle([10026], [GROWL]);
    const c = await battle([10026], [GROWL]);
    stripped(c, 10026);
    assert.equal(turn(a, 10026, GROWL).dealt - turn(c, 10026, GROWL).dealt, 50, '+50 fixed damage');
  }
  ok('旋转冲击 adds fixed damage');

  // 寒冰碎裂：下2回合攻击必定致命一击
  {
    const b = await battle([20151, SCRATCH], [GROWL]);
    turn(b, 20151, GROWL);
    assert.equal(turn(b, SCRATCH, GROWL).mine.isCrit, true, 'crit turn 1');
    assert.equal(turn(b, SCRATCH, GROWL).mine.isCrit, true, 'crit turn 2');
    assert.equal(turn(b, SCRATCH, GROWL).mine.isCrit, false, 'crit buff over');
  }
  ok('寒冰碎裂 grants two critical turns');

  // 太阳能：下回合攻击伤害2倍
  {
    const a = await battle([20104, SCRATCH], [0]);
    turn(a, 20104, 0);
    const boosted = turn(a, SCRATCH, 0).dealt;
    const normal = turn(a, SCRATCH, 0).dealt;
    assert.equal(boosted, normal * 2, '太阳能 doubles the next attack only');
  }
  ok('太阳能 doubles the next turn');

  // 保护、寒冰护体、空间跳跃
  {
    const b = await battle([20036, GROWL], [SCRATCH]);
    assert.equal(turn(b, 20036, SCRATCH).taken, 0, '保护 blocks one attack');
    assert.ok(turn(b, GROWL, SCRATCH).taken > 0, '保护 used up');
  }
  {
    const b = await battle([20059, SCRATCH], [SCRATCH]);
    const shielded = turn(b, 20059, SCRATCH).taken;
    const raw = turn(b, SCRATCH, SCRATCH).taken;
    assert.equal(shielded, Math.max(0, raw - 50), '寒冰护体 absorbs 50');
  }
  {
    const b = await battle([20097, GROWL], [SCRATCH]);
    const first = turn(b, 20097, SCRATCH);
    assert.equal(first.foe.missed, true, '空间跳跃 makes the later foe move miss');
    assert.ok(turn(b, GROWL, SCRATCH).taken > 0, '空间跳跃 lasts one turn');
  }
  ok('保护/寒冰护体/空间跳跃 defend as described');

  // 意念干扰：降低对手全部PP，所选技能PP归零则当回合无法行动
  {
    const b = await battle([10220], [SCRATCH]);
    b.enemy.skillPP[0] = 1;
    const r = turn(b, 10220, SCRATCH, 0.1);
    assert.equal(b.enemy.skillPP[0], 0, 'PP drained');
    assert.equal(r.taken, 0, 'foe cannot act with 0 PP');
  }
  ok('意念干扰 drains PP and cancels a 0-PP move');

  // 愤怒：连续使用威力+20，最高80
  {
    const b = await battle([10074], [0]);
    const d = [0, 1, 2, 3].map(() => turn(b, 10074, 0).dealt);
    // 伤害公式带常数项，60/80威力约为40威力的1.47/1.94倍
    assert.ok(d[1] / d[0] > 1.4 && d[1] / d[0] < 1.55, `愤怒 60 power ${d}`);
    assert.ok(d[2] / d[0] > 1.85 && d[2] / d[0] < 2.05, `愤怒 80 power ${d}`);
    assert.equal(d[3], d[2], '愤怒 capped at 80');
  }
  ok('愤怒 grows with consecutive use up to 80 power');

  // 手下留情、星辰守护、沙葬、永恒、打盹
  {
    const b = await battle([10057], [GROWL], {foe: {hp: 10}});
    turn(b, 10057, GROWL);
    assert.equal(b.enemy.hp, 1, '手下留情 leaves 1 HP');
  }
  {
    const b = await battle([20303], [SCRATCH], {player: {hp: 10}});
    turn(b, 20303, SCRATCH);
    assert.equal(b.player.hp, 1, '星辰守护 survives with 1 HP');
  }
  {
    const b = await battle([11109], [GROWL]);
    turn(b, 11109, GROWL, 0.99);
    assert.equal(b.player.hp, 0, '沙葬 miss kills the user');
  }
  {
    const b = await battle([20608, SCRATCH], [GROWL]);
    b.player.skillPP[1] = 0;
    turn(b, 20608, GROWL);
    assert.equal(b.player.skillPP[1], GameConfig.GetSkillById(SCRATCH).MaxPP, '永恒 restores PP');
  }
  {
    const b = await battle([21422, SCRATCH], [GROWL], {player: {hp: 100}});
    turn(b, 21422, GROWL);
    assert.equal(b.player.hp, 1000, '打盹 heals fully');
    assert.equal(turn(b, SCRATCH, GROWL).dealt, 0, 'asleep turn 1');
    assert.equal(turn(b, SCRATCH, GROWL).dealt, 0, 'asleep turn 2');
    assert.ok(turn(b, SCRATCH, GROWL).dealt > 0, 'awake after 2 turns');
  }
  ok('手下留情/星辰守护/沙葬/永恒/打盹');

  // 多效果技能按官方参数个数切分：月之恩赐 4+199 → 自身速度+1
  {
    const b = await battle([21680], [GROWL]);
    turn(b, 21680, GROWL);
    assert.equal(b.player.battleLevels[4], 1, 'speed +1 from effect 4 only');
  }
  ok('Multi-effect skills split arguments by official counts');

  // 道具/换宠后的敌方回合走完整出手流程：睡眠中不能行动
  {
    const b = await battle([GROWL], [SCRATCH]);
    afflict(b.enemy, S.SLEEP);
    const r = withRandom(0.5, () => service.ExecuteEnemyTurn(b));
    assert.equal(r.damage || 0, 0, 'sleeping foe cannot counter');
    assert.equal(b.player.hp, 1000);
  }
  ok('Enemy-only turns respect status rules');

  // ==================== 条件触发的效果 ====================
  const plainDamage = async (moveId, setup, random = 0.5) => {
    const pair = [];
    for (const strip of [false, true]) {
      const b = await battle([moveId], [GROWL]);
      setup?.(b);
      if (strip) stripped(b, moveId);
      pair.push(turn(b, moveId, GROWL, random).dealt);
    }
    return pair;
  };
  {
    // 32 寰宇劲乐：之后5回合暴击率+1/16（独立判定）
    const b = await battle([10723, SCRATCH], [GROWL]);
    turn(b, 10723, GROWL);
    const crit = withRandom(0.03, () => SkillEffectRuntime.Crit(b, b.player, b.enemy, b.skills.get(SCRATCH), () => false));
    assert.equal(crit, true, '寰宇劲乐 crit bonus');
  }
  {
    // 48 龙翔破空刃：命中后当回合免疫异常
    const b = await battle([13874], [20031]);
    turn(b, 13874, 20031, 0.3);
    assert.equal(b.player.statusDurations[S.PARALYSIS], 0, '龙翔破空刃 status immunity');
    const c = await battle([13874], [20031]);
    stripped(c, 13874);
    turn(c, 13874, 20031, 0.3);
    assert.ok(c.player.statusDurations[S.PARALYSIS] > 0, 'fixture: 麻痹粉 lands without it');
  }
  {
    // 47 白雾：5回合免疫能力下降
    const b = await battle([20012, SCRATCH], [GROWL]);
    turn(b, 20012, GROWL);
    for (let i = 0; i < 4; i++) turn(b, SCRATCH, GROWL);
    assert.equal(b.player.battleLevels[0], 0, '白雾 blocks 5 turns of 鸣叫');
    turn(b, SCRATCH, GROWL);
    assert.equal(b.player.battleLevels[0], -1, '白雾 over');
  }
  {
    // 65 精神集中：下回合超能系威力2倍；42 充电：下回合电系伤害2倍
    const b = await battle([20285, 10220], [0]);
    turn(b, 20285, 0);
    const [boosted, normal] = [turn(b, 10220, 0).dealt, turn(b, 10220, 0).dealt];
    assert.ok(boosted / normal > 1.8, `精神集中 ${boosted}/${normal}`);
    const c = await battle([20006, 10010], [0]);
    turn(c, 20006, 0);
    const [charged, plain] = [turn(c, 10010, 0).dealt, turn(c, 10010, 0).dealt];
    assert.equal(charged, plain * 2, '充电 doubles the next electric attack');
  }
  {
    // 81 追踪魔影：下回合必中（沙葬50%命中不再落空）
    const b = await battle([11775, 11109], [GROWL]);
    turn(b, 11775, GROWL);
    const hit = turn(b, 11109, GROWL, 0.99);
    assert.ok(hit.dealt > 0 && b.player.hp > 0, '追踪魔影 sure hit');
  }
  {
    // 41 水冰决：3回合火系伤害减半
    const b = await battle([12062, SCRATCH], [10007]);
    const c = await battle([12062, SCRATCH], [10007]);
    stripped(c, 12062);
    assert.ok(Math.abs(turn(b, 12062, 10007).taken * 2 - turn(c, 12062, 10007).taken) <= 2, '水冰决 halves fire damage');
  }
  {
    // 154 精神侵蚀：对手睡眠时伤害的1/2回复体力
    const b = await battle([12744], [GROWL], {player: {hp: 300}});
    afflict(b.enemy, S.SLEEP);
    const r = turn(b, 12744, GROWL);
    assert.equal(b.player.hp, 300 + Math.floor(r.dealt / 2), '精神侵蚀 drains from a sleeping foe');
  }
  {
    // 180 时空漩涡：消除对手的回合类效果（白雾）
    const b = await battle([10220, 12987, GROWL], [20012], {foe: {speed: 999}, player: {speed: 10}});
    turn(b, 10220, 20012);
    turn(b, 12987, 0, 0.5);
    turn(b, GROWL, 0);
    assert.equal(b.enemy.battleLevels[0], -1, '时空漩涡 removes 白雾');
  }
  {
    // 456 乾坤伏魔棍：本次伤害后对手体力不足250直接秒杀
    const [on, off] = await plainDamage(13841, b => { b.enemy.hp = 300; });
    assert.equal(on, 300, '乾坤伏魔棍 finishes below 250');
    assert.ok(off < 300);
  }
  {
    // 107 紫雾霜冻：伤害小于100则自身特攻+1；134 光束反冲：伤害低于100则PP+1
    const b = await battle([11841], [GROWL], {foe: {spDef: 5000}});
    turn(b, 11841, GROWL);
    assert.equal(b.player.battleLevels[2], 1, '紫雾霜冻 special attack +1');
    const c = await battle([12545, SCRATCH], [GROWL], {foe: {spDef: 5000}});
    c.player.skillPP[1] = 10;
    turn(c, 12545, GROWL);
    assert.equal(c.player.skillPP[1], 11, '光束反冲 PP +1');
  }
  {
    // 67 疲乏撕咬：击败后下一只出战精灵最大体力-1/3；185 永恒圣焰：击败烧伤对手后下一只也烧伤
    const b = await battle([10778, GROWL], [GROWL], {foe: {hp: 1}});
    turn(b, 10778, GROWL);
    b.enemy = pet(FOE, [GROWL], {speed: 10});
    turn(b, GROWL, GROWL);
    assert.equal(b.enemy.maxHp, 667, '疲乏撕咬 cuts the next pet');
    const c = await battle([13024, GROWL], [GROWL], {foe: {hp: 1}});
    afflict(c.enemy, 2);
    turn(c, 13024, GROWL);
    c.enemy = pet(FOE, [GROWL], {speed: 10});
    turn(c, GROWL, GROWL);
    assert.ok(c.enemy.statusDurations[2] > 0, '永恒圣焰 burns the next pet');
  }
  {
    // 182 混沌冰暴：对手冻伤时自身速度+1；193 冰怒刺拳：对手冻伤必定暴击；467 炎火击：对手烧伤附加200
    const b = await battle([13070], [GROWL]);
    afflict(b.enemy, S.FREEZE);
    turn(b, 13070, GROWL);
    assert.equal(b.player.battleLevels[4], 1, '混沌冰暴 speed +1');
    const c = await battle([13154], [GROWL]);
    afflict(c.enemy, S.FREEZE);
    assert.equal(turn(c, 13154, GROWL).mine.isCrit, true, '冰怒刺拳 crit on frozen');
    const [on, off] = await plainDamage(14049, x => afflict(x.enemy, 2));
    assert.equal(on - off, 200, '炎火击 +200 on burned');
  }
  {
    // 195 寒天玄冰破：无视对手双防提升
    const [boosted] = await plainDamage(13178, b => { b.enemy.battleLevels[3] = 2; });
    const [, raw] = await plainDamage(13178);
    assert.ok(Math.abs(boosted - raw) <= 2, `寒天玄冰破 ignores +2 special defense ${boosted}/${raw}`);
  }
  {
    // 45 模仿术 / 51 变化术：防御/攻击与对手相同，结束后恢复
    const b = await battle([20029, SCRATCH], [GROWL], {foe: {defence: 800}});
    const own = b.player.defence;
    turn(b, 20029, GROWL);
    assert.equal(b.player.defence, 800, '模仿术 copies defence');
    for (let i = 0; i < 4; i++) turn(b, SCRATCH, GROWL);
    assert.equal(b.player.defence, own, '模仿术 restores defence');
    const c = await battle([20096], [GROWL], {foe: {attack: 900}});
    turn(c, 20096, GROWL);
    assert.equal(c.player.attack, 900, '变化术 copies attack');
  }
  {
    // 125 钢筋铁骨：3回合每次受伤不超过280
    const b = await battle([21148, SCRATCH], [SCRATCH], {foe: {attack: 20000}});
    assert.equal(turn(b, 21148, SCRATCH).taken, 280, '钢筋铁骨 caps damage');
  }
  {
    // 183 暗之反射：本回合免疫并反弹特殊攻击
    const b = await battle([21563], [10013]);
    const r = turn(b, 21563, 10013);
    assert.equal(r.taken, 0, '暗之反射 immune to special');
    assert.ok(b.enemy.hp < 1000, '暗之反射 reflects');
  }
  {
    // 86 圣洁：属性技能对自身必定miss
    const b = await battle([20605], [GROWL]);
    turn(b, 20605, GROWL);
    assert.equal(b.player.battleLevels[0], 0, '圣洁 evades 鸣叫');
  }
  {
    // 110 天然防御：躲避时50%特攻+1；160 急速闪现：对手落空后下回合必暴击；177 光佑守护：对手落空回复1/2
    const b = await battle([21009], [SCRATCH]);
    afflict(b.enemy, S.CONFUSION);
    turn(b, 21009, SCRATCH, 0.3);
    assert.equal(b.player.battleLevels[2], 1, '天然防御 boosts on dodge');
    const c = await battle([21439, SCRATCH], [GROWL]);
    afflict(c.enemy, S.CONFUSION);
    turn(c, 21439, GROWL, 0.3);
    assert.equal(turn(c, SCRATCH, GROWL).mine.isCrit, true, '急速闪现 crit after a miss');
    const d = await battle([21543], [SCRATCH], {player: {hp: 300}});
    afflict(d.enemy, S.CONFUSION);
    turn(d, 21543, SCRATCH, 0.3);
    assert.equal(d.player.hp, 800, '光佑守护 heals half on a miss');
  }
  {
    // 121 超能电磁炮：属性相同时40%麻痹
    const b = await battle([12155], [SCRATCH], {player: {type: 6}});
    assert.equal(turn(b, 12155, SCRATCH, 0.3).taken, 0, '超能电磁炮 paralysis');
  }
  {
    // 136 小太阳：落空回复1/4体力
    const b = await battle([12548], [GROWL], {player: {hp: 500}});
    turn(b, 12548, GROWL, 0.99);
    assert.equal(b.player.hp, 750, '小太阳 heals on miss');
  }
  {
    // 151 火龙烈焰击：对手烧伤时30%疲惫（与烧伤并存）
    const b = await battle([12715], [SCRATCH]);
    afflict(b.enemy, 2);
    assert.equal(turn(b, 12715, SCRATCH, 0.2).taken, 0, '火龙烈焰击 fatigue on a burned foe');
    assert.ok(b.enemy.statusDurations[2] > 0, 'burn still active');
  }
  {
    // 171 圣光觉醒：属性技能较快出手
    const b = await battle([21511, GROWL], [SCRATCH], {player: {speed: 10}, foe: {speed: 999}});
    turn(b, 21511, SCRATCH);
    assert.equal(turn(b, GROWL, SCRATCH).r.firstAttack.userId, b.userId, '圣光觉醒 status move goes first');
  }
  {
    // 190 强磁光环：受到攻击时消除对手强化
    const b = await battle([21631], [SCRATCH]);
    b.enemy.battleLevels[0] = 2;
    turn(b, 21631, SCRATCH);
    assert.equal(b.enemy.battleLevels[0], 0, '强磁光环 clears the attacker');
  }
  ok('Conditional effects (32/41/42/45/47/48/51/65/67/81/86/107/110/121/125/134/136/151/154/160/171/177/180/182/183/185/190/193/195/456/467)');

  // ==================== BOSS ====================

  // BOSS本回合不出手（技能0），只看玩家技能的效果
  // 海洋之心：哈莫雷特免疫，亚伦斯有效；寄生种子：亚伦斯免疫
  {
    const b = await bossBattle(57, 0, [20143]);
    assert.equal(turn(b, 20143, 0).dealt, 0, '哈莫雷特 immune to 海洋之心');
  }
  {
    const b = await bossBattle(430, 0, [20143, 20007]);
    const hp = b.enemy.hp;
    turn(b, 20007, 0);
    turn(b, 20007, 0);
    assert.ok(b.enemy.hp >= hp, '亚伦斯 immune to 寄生种子 (only its own regen applies)');
    const quarter = turn(b, 20143, 0);
    assert.ok(quarter.dealt >= Math.floor(b.enemy.maxHp / 4) - 100, '海洋之心 works on 亚伦斯');
  }
  // 镇魂歌：塞维尔（免疫异常）无效，魔狮迪露有效
  {
    const b = await bossBattle(348, 3, [20215]);
    for (let i = 0; i < 5; i++) turn(b, 20215, 0);
    assert.ok(b.enemy.hp > 0, '镇魂歌 has no effect on 塞维尔');
  }
  {
    const b = await bossBattle(53, 1, [20215, GROWL], {hp: 5000, maxHp: 5000});
    turn(b, 20215, 0);
    for (let i = 0; i < 3; i++) turn(b, GROWL, 0);
    assert.equal(b.enemy.hp, 0, '镇魂歌 kills 魔狮迪露');
  }
  // 秒杀对经典BOSS有效（魔焰猩猩绝命火焰秒塔克林）
  {
    const b = await bossBattle(348, 0, [11022]);
    turn(b, 11022, 0, 0.01);
    assert.equal(b.enemy.hp, 0, '绝命火焰 OHKO on 塔克林');
  }
  ok('Boss interplay: 海洋之心/寄生种子/镇魂歌/秒杀 follow the classic boss notes');

  console.log(JSON.stringify({passed: results.length, results}, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
