'use strict';
/**
 * BOSS 招牌特性回归：用真实的回合执行器逐条验证每个特性的规则。
 * 不连数据库、不起服务，只加载配置与战斗模块。
 * 用法：node scripts/test-boss-signatures.cjs <app 运行目录（含 node_modules）>
 */
const path = require('node:path');
const assert = require('node:assert/strict');

const app = path.resolve(process.argv[2] || '');
assert.ok(process.argv[2], 'usage: test-boss-signatures.cjs <app>');
process.chdir(app);
const load = f => require(path.join(app, 'dist', f));
const {Logger, LogLevel} = load('shared/utils/Logger'); Logger.SetMinLevel(LogLevel.Error);
const {ConfigLoader} = load('shared/config/ConfigLoader'), {ConfigRegistry} = load('shared/config/ConfigRegistry'), {GetGameConfigRegistrations} = load('shared/config/ConfigDefinitions');
const {GameConfig} = load('shared/config/game/GameConfig'), {BossAbilityConfig} = load('GameServer/Game/Battle/BossAbility/BossAbilityConfig');
const {BattleInitService} = load('GameServer/Game/Battle/services/BattleInitService'), {BattleTurnService} = load('GameServer/Game/Battle/services/BattleTurnService');
const {BattleManager} = load('GameServer/Game/Battle/BattleManager'), {BattleEffectIntegration} = load('GameServer/Game/Battle/BattleEffectIntegration');
const {PetCalculator} = load('GameServer/Game/Pet/PetCalculator');
const Signatures = load('GameServer/Game/Battle/BossSignatures'), {BossSpecialRules} = load('GameServer/Game/Battle/BossSpecialRules');
const {SkillEffectRuntime} = load('GameServer/Game/Battle/SkillEffectRuntime');
const init = new BattleInitService({Uid: 1}), service = new BattleTurnService(), realRandom = Math.random;

// 测试技能按属性、类别在技能表里现找，不写死 ID
const maxPP = id => GameConfig.GetSkillById(id).MaxPP;
const findSkill = filter => GameConfig.GetAllSkills().find(filter);
function skillOf({type, category, priority, multi, power = 60}) {
  const s = findSkill(m => [1, 2].includes(m.Category) && (!category || m.Category === category) && (!type || m.Type === type)
    && (priority ? (m.Priority || 0) > 0 : !(m.Priority > 0)) && (multi ? String(m.SideEffect || '').split(/\s+/).includes('31') : !m.SideEffect)
    && (m.Power || 0) >= (multi ? 1 : power) && (m.Accuracy || 100) >= 100 && m.ID < 20000);
  assert.ok(s, `no skill for ${JSON.stringify({type, category, priority, multi})}`);
  return s.ID;
}

async function start(key, skills, speed) {
  const [mapId, param2] = key.split('/').map(Number);
  const config = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, param2);
  const enemy = init.BuildBossBattlePet(config, GameConfig.GetPetById(config.petId));
  const petId = 3, level = 100;
  const stat = name => PetCalculator.CalculateStat(petId, name, level, 31, 0, 0);
  const hp = 5000; // 测试用的大体力，避免被打倒打断流程
  const player = init.BuildBattlePet(petId, '测试精灵', level, hp, hp, stat('atk'), stat('def'), stat('spAtk'), stat('spDef'), speed ?? stat('speed'), 8, skills, 1700000001, 0);
  const battle = {userId: 1, player, enemy, turn: 0, isOver: false, roundCount: 0, lastHitWasCritical: false, battleType: 'BOSS', bossMapId: mapId, bossParam2: param2, startTime: 0};
  load('GameServer/Game/Battle/PuniSealBattle').InitPuniSeal(battle);
  await init.TriggerPassiveAbilities(player, enemy);
  load('GameServer/Game/Battle/AlderSealBattle').InitAlder(battle);
  BattleEffectIntegration.OnBattleStart(battle);
  const manager = new BattleManager({Uid: 1}); manager._currentBattle = battle;
  const sig = () => enemy.bossState.sig;
  const turn = id => { player.skillPP = player.skills.map(maxPP); const r = service.ExecuteTurn(battle, id); return {r, own: [r.firstAttack, r.secondAttack].find(a => a?.userId === 1), foe: [r.firstAttack, r.secondAttack].find(a => a?.userId === 0)}; };
  const idle = () => service.ExecuteEnemyTurn(battle);
  const swap = (id = petId) => { const info = {petId: id, nick: '替补', level, hp, maxHp: hp, atk: player.attack, def: player.defence, spAtk: player.spAtk, spDef: player.spDef, speed: player.speed, catchTime: 1700000002 + battle.turn, skillArray: skills, skillPP: Object.fromEntries(skills.map(id => [id, maxPP(id)])), dvHp: 31, dvAtk: 31, dvDef: 31, dvSpAtk: 31, dvSpDef: 31, dvSpeed: 31, nature: 0}; manager.UpdateBattlePet(battle.player, info, GameConfig.GetPetById(id)); return idle(); };
  // 打掉 BOSS 当前这条命（走真实的复活结算）
  const kill = () => { enemy.hp = 0; BossSpecialRules.SettleBossHp(battle, 'attack'); };
  const notices = () => Signatures.drainNotices(battle);
  // 伤害类断言不受难度倍率影响
  const c = {...config.mechanics.signature}; enemy.bossMechanics = {...enemy.bossMechanics, signature: {...c, might: 0}};
  return {battle, player, enemy, config, c, sig, turn, idle, swap, kill, notices};
}
/** 属性技能：附加效果为 effect、参数以 args 开头、必定命中 */
function statusSkill(effect, args = '') {
  const s = findSkill(m => m.Category === 4 && String(m.SideEffect || '').trim() === String(effect) && String(m.SideEffectArg || '').startsWith(args) && (m.Accuracy || 100) >= 100 && m.ID < 30000);
  assert.ok(s, `no status skill ${effect} ${args}`);
  return s.ID;
}
const petOfType = type => (GameConfig.GetPetConfig().Monsters.Monster.find(p => p.Type === type && p.ID < 2000)).ID;
// 暗黑门技能伤害对照：BOSS 打玩家、玩家打 BOSS 的倍率
const out = (t, skill, damage = 100) => Signatures.modifyDamage(t.battle, t.enemy, t.player, {category: 1, type: 8, ...skill}, damage, 'attack');
const inc = (t, skill, damage = 100) => Signatures.modifyDamage(t.battle, t.player, t.enemy, {category: 1, type: 8, ...skill}, damage, 'attack');
const near = (actual, expected, message, slack = 2) => assert.ok(Math.abs(actual - expected) <= slack, `${message}: ${actual} 应约为 ${expected}`);
/** 固定随机数：命中、不暴击（r 偏大）或必暴击（r=0） */
const fixRandom = value => { Math.random = () => value; };

const tests = {
  async coldSnap() {
    const normal = skillOf({type: 8, category: 1}), fire = skillOf({type: 3});
    fixRandom(0.99);
    let t = await start('40/0', [normal, fire]);
    t.turn(normal); assert.equal(t.sig().chill, 1);
    t.turn(normal); assert.equal(t.sig().chill, 2);
    assert.match(t.notices(), /寒意 2\/3，下回合结束时冻结/);
    t.turn(normal); assert.equal(t.sig().chill, 0, '满层后清零');
    assert.equal(t.player.fatigueTurns, 1);
    assert.match(t.notices(), /被冻住/);
    const frozen = t.turn(normal); assert.equal(frozen.own.skillId, 0, '被冻住的回合不能出手');
    // 火系命中清零
    t = await start('40/0', [normal, fire]);
    t.turn(normal); t.turn(normal); assert.equal(t.sig().chill, 2);
    t.turn(fire); assert.equal(t.sig().chill, 1, '火系清零后本回合末+1');
    // 换精灵清零
    t = await start('40/0', [normal, fire]);
    t.turn(normal); t.turn(normal); t.swap(); assert.equal(t.sig().chill, 1, '换精灵清零后本回合末+1');
    // 同一回合没有新事件、状态没变时不重复下发状态行（补位换精灵时回合结果后和换上后各发一次）
    t.notices(); assert.equal(t.notices(), '', '同一回合不重复'); t.idle(); assert.match(t.notices(), /寒意/, '下一回合照常');
  },
  async gale() {
    const normal = skillOf({type: 8, category: 1});
    // 玩家慢：BOSS 先手，随机数 0.1 < 50% 闪避
    fixRandom(0.1);
    let t = await start('27/0', [normal], 1);
    let a = t.turn(normal); assert.equal(a.r.firstAttack.userId, 0); assert.equal(a.own.missed, true, 'BOSS 先手时可闪避');
    fixRandom(0.99);
    a = t.turn(normal); assert.equal(a.own.missed, false);
    const slowDamage = a.own.damage;
    // 玩家快：不闪避且伤害 +20%
    fixRandom(0.1);
    t = await start('27/0', [normal], 9999);
    a = t.turn(normal); assert.equal(a.r.firstAttack.userId, 1); assert.equal(a.own.missed, false, '玩家先手时不闪避');
    fixRandom(0.99);
    t = await start('27/0', [normal], 9999);
    a = t.turn(normal);
    assert.ok(Math.abs(a.own.damage - Math.floor(slowDamage * 1.2)) <= 2, `先手伤害 ${a.own.damage} 应约为 ${slowDamage}×1.2`);
  },
  async thunderCharge() {
    const normal = skillOf({type: 8, category: 1}), ground = skillOf({type: 7}), quick = skillOf({priority: true});
    fixRandom(0.99);
    let t = await start('32/0', [normal, ground, quick]);
    const used = [];
    for (let i = 0; i < 5; i++) { used.push(t.turn(normal).foe.skillId); }
    assert.ok(!used.includes(10176), '未满层不放瞬雷天闪');
    assert.equal(t.sig().charge, 5);
    assert.match(t.notices(), /蓄雷 5\/5，下回合释放/);
    const base = (() => { const before = t.player.hp; return before; })();
    const release = t.turn(normal); assert.equal(release.foe.skillId, 10176); assert.equal(t.sig().charge, 0);
    const charged = base - t.player.hp;
    // 对照：0 层时同一招的伤害
    t = await start('32/0', [normal, ground, quick]);
    t.sig().charge = 5; t.enemy.bossMechanics = {...t.enemy.bossMechanics, signature: {...t.enemy.bossMechanics.signature, perLayer: 0}};
    const before = t.player.hp; t.turn(normal); const plain = before - t.player.hp;
    assert.ok(Math.abs(charged - plain * 2) <= 4, `满层伤害 ${charged} 应约为 ${plain}×2`);
    // 地面清空、先制减一
    t = await start('32/0', [normal, ground, quick]);
    t.turn(normal); t.turn(normal); t.turn(normal); assert.equal(t.sig().charge, 3);
    t.turn(quick); assert.equal(t.sig().charge, 3, '先制 -1 后回合末 +1');
    t.turn(ground); assert.equal(t.sig().charge, 1, '地面清空后回合末 +1');
  },
  async sandArmor() {
    const normal = skillOf({type: 8, category: 1}), multi = skillOf({multi: true});
    fixRandom(0.99);
    let t = await start('106/0', [normal, multi]);
    const d0 = t.turn(normal).own.damage; assert.equal(t.sig().layers, 1);
    const max = t.c.max; for (let i = 1; i < max; i++) t.idle();
    assert.equal(t.sig().layers, max); t.idle(); assert.equal(t.sig().layers, max, '层数有上限');
    const dMax = t.turn(normal).own.damage, ratio = 1 - max * t.c.perLayer / 100;
    assert.ok(Math.abs(dMax - Math.floor(d0 * ratio)) <= 2, `满层伤害 ${dMax} 应约为 ${d0}×${ratio}`);
    // 连击剥层
    const hit = t.turn(multi); const hits = hit.own.atkTimes;
    assert.ok(hits > 1, '连击技能应多段'); assert.equal(t.sig().layers, Math.max(0, max - hits) + 1);
    // 暴击清空
    t = await start('106/0', [normal, multi]);
    t.idle(); t.idle(); t.idle(); assert.equal(t.sig().layers, 3);
    fixRandom(0); const crit = t.turn(normal); fixRandom(0.99);
    if (crit.own.isCrit && !crit.own.missed) assert.equal(t.sig().layers, 1, '暴击清空后回合末 +1');
    else throw new Error('expected a critical hit');
  },
  async statCopy() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.99);
    const t = await start('49/0', [normal]);
    t.player.battleLevels[0] = 3; t.player.battleLevels[4] = 2;
    t.idle(); t.idle(); assert.equal(t.enemy.battleLevels[0], 0);
    t.player.battleLevels[0] = 3; t.player.battleLevels[4] = 2;
    t.idle(); assert.equal(t.enemy.battleLevels[0], 3, '第 3 回合复制攻击'); assert.equal(t.enemy.battleLevels[4], 2);
    assert.match(t.notices(), /复制了你的强化/);
    // 过载
    t.enemy.hp = Math.floor(t.enemy.maxHp / 2); const sp = t.enemy.battleLevels[2] || 0, hp = t.enemy.hp;
    t.idle();
    assert.equal(t.enemy.battleLevels[2], Math.min(6, sp + 1)); assert.equal(t.enemy.hp, hp - Math.floor(t.enemy.maxHp * 0.05));
    assert.equal(t.sig().overload, true);
  },
  async mindMirror() {
    const physical = skillOf({type: 8, category: 1}), special = skillOf({type: 8, category: 2});
    fixRandom(0.99);
    const t = await start('325/0', [physical, special]);
    const p1 = t.turn(physical).own.damage, p2 = t.turn(physical).own.damage;
    assert.ok(Math.abs(p2 - Math.floor(p1 * 0.3)) <= 2, `连续物理 ${p2} 应约为 ${p1}×0.3`);
    const s1 = t.turn(special).own.damage, p3 = t.turn(physical).own.damage, s2 = t.turn(special).own.damage;
    assert.ok(Math.abs(p3 - p1) <= 2, '交替后物理恢复全额'); assert.ok(Math.abs(s2 - s1) <= 2, '交替后特殊全额');
    assert.equal(t.sig().last, 2);
  },
  async tide() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.99);
    const t = await start('59/0', [normal]);
    assert.match(t.notices(), /下回合涨潮/);
    t.enemy.hp -= 2000;
    let hp = t.enemy.hp; const flood = t.turn(normal);
    assert.equal(t.enemy.hp, hp - flood.own.damage + t.c.heal, '涨潮回合末回血');
    assert.match(t.notices(), /下回合满潮/);
    hp = t.enemy.hp; const high = t.turn(normal);
    assert.equal(high.foe.skillId, 10848, '满潮必放滔天龙汲水'); assert.equal(high.foe.missed, false);
    assert.equal(t.enemy.hp, hp - high.own.damage, '满潮不回血');
    hp = t.enemy.hp; const ebb = t.turn(normal);
    assert.equal(t.enemy.hp, hp - ebb.own.damage, '退潮不回血');
    assert.ok(Math.abs(ebb.own.damage - Math.floor(high.own.damage * 1.5)) <= 2, `退潮伤害 ${ebb.own.damage} 应约为 ${high.own.damage}×1.5`);
    assert.equal(t.turn(normal).foe.skillId !== undefined, true);
  },
  async furnace() {
    const normal = skillOf({type: 8, category: 1}), water = skillOf({type: 2}), ice = skillOf({type: 9});
    fixRandom(0.99);
    let t = await start('16/0', [normal, water, ice]);
    t.idle(); t.idle(); assert.equal(t.sig().heat, 2);
    let hp = t.player.hp; const third = t.idle();
    assert.equal(t.sig().heat, 3); assert.equal(hp - t.player.hp - third.damage, Math.floor(t.player.maxHp / 8), '3 级起灼伤 1/8');
    t.idle(); t.idle(); assert.equal(t.sig().heat, 5);
    assert.match(t.notices(), /熔炉温度 5\/5，下回合爆发/);
    hp = t.player.hp; const blast = t.idle();
    assert.equal(blast.skillId, 10984); assert.equal(t.sig().heat, 0, '爆发后归零');
    const blasted = blast.damage;
    // 对照：同一招不加倍
    t = await start('16/0', [normal, water, ice]);
    t.sig().heat = 5; t.enemy.bossMechanics = {...t.enemy.bossMechanics, signature: {...t.enemy.bossMechanics.signature, blastPercent: 100}};
    const plain = t.idle().damage, factor = t.c.blastPercent / 100;
    assert.ok(Math.abs(blasted - plain * factor) <= 4, `爆发伤害 ${blasted} 应约为 ${plain}×${factor}`);
    // 降温
    t = await start('16/0', [normal, water, ice]);
    t.idle(); t.idle(); t.idle(); t.idle(); assert.equal(t.sig().heat, 4);
    t.turn(water); assert.equal(t.sig().heat, 3, '水系 -2 后回合末 +1');
    t.turn(ice); assert.equal(t.sig().heat, 3, '冰系 -1 后回合末 +1');
  },
  async roots() {
    const normal = skillOf({type: 8, category: 1}), fire = skillOf({type: 3});
    fixRandom(0.99);
    let t = await start('13/0', [normal, fire]);
    assert.match(t.notices(), /根须缠着/);
    t.enemy.hp -= 3000;
    let php = t.player.hp, bhp = t.enemy.hp; const a = t.idle();
    assert.equal(php - t.player.hp - a.damage, Math.floor(t.player.maxHp / 8), '每回合吸取 1/8');
    assert.equal(t.enemy.hp, bhp + Math.floor(t.enemy.maxHp * 0.05), '自身回复 5%');
    // 换精灵摆脱，3 回合后重新种下
    bhp = t.enemy.hp; t.swap();
    assert.equal(t.sig().rooted, false); assert.equal(t.enemy.hp, bhp, '摆脱的回合不回血');
    const replant = t.sig().replantTurn; assert.equal(replant, t.battle.turn + 2);
    t.idle(); assert.equal(t.sig().rooted, false);
    t.idle(); assert.equal(t.sig().rooted, true, '到点重新缠上');
    // 火系烧断
    t = await start('13/0', [normal, fire]);
    t.turn(fire); assert.equal(t.sig().rooted, false);
    assert.match(t.notices(), /火焰烧断了根须/);
  },

  // ---------- 训练师之门 ----------
  async vines() {
    const normal = skillOf({type: 8, category: 1}), quick = skillOf({priority: true});
    fixRandom(0.6); // 0.99 会让 95 命中的 BOSS 技能落空
    const t = await start('102/201', [normal, quick], 1);
    const hp = t.player.hp, a = t.turn(normal);
    assert.equal(t.sig().bound, true, '被命中后缠住');
    assert.equal(t.player.battleLevels[4], -1, '回合末降速');
    assert.equal(hp - t.player.hp - a.foe.damage, Math.floor(t.player.maxHp / 16), '回合末吸取 1/16');
    t.turn(quick); assert.equal(t.sig().bound, false, '先制命中挣脱且本回合不再被缠');
    t.idle(); assert.equal(t.sig().bound, false, '下回合仍受保护');
    t.idle(); assert.equal(t.sig().bound, true, '保护结束后重新缠上');
    t.swap(); assert.equal(t.sig().bound, false, '换精灵挣脱');
  },
  async rage() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.99);
    const t = await start('102/202', [normal], 1);
    const used = [];
    for (let i = 0; i < 5; i++) used.push(t.turn(normal).foe.skillId);
    assert.ok(!used.includes(12359), '怒气未满不放怒焰火锤'); assert.equal(t.sig().rage, 5);
    assert.match(t.notices(), /怒气 5\/5.*下回合怒焰火锤/);
    const a = t.turn(normal); assert.equal(a.foe.skillId, 12359); assert.equal(t.sig().rage, 1, '放出后清空，本回合又被打 +1');
    t.sig().rage = 5;
    assert.equal(Signatures.modifyDamage(t.battle, t.enemy, t.player, {type: 3, category: 1}, 100, 'attack'), 175, '5 层火系 +75%');
    assert.equal(Signatures.modifyDamage(t.battle, t.enemy, t.player, {type: 8, category: 1}, 100, 'attack'), 100, '非火系不加');
  },
  async barrier() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.99);
    const slow = (await start('102/203', [normal], 1)).turn(normal), fast = (await start('102/203', [normal], 9999)).turn(normal);
    assert.equal(slow.r.firstAttack.userId, 0); assert.equal(fast.r.firstAttack.userId, 1);
    assert.ok(Math.abs(fast.own.damage - Math.floor(slow.own.damage * 0.5)) <= 2, `先手伤害 ${fast.own.damage} 应约为 ${slow.own.damage}×0.5`);
  },
  async toxin() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.6); // 0.99 会让 95 命中的 BOSS 技能落空
    const t = await start('102/204', [normal]);
    const loss = () => { const hp = t.player.hp, a = t.idle(); return hp - t.player.hp - a.damage; };
    assert.equal(loss(), Math.floor(t.player.maxHp / 16));
    assert.equal(loss(), Math.floor(t.player.maxHp / 8), '翻倍');
    assert.equal(loss(), Math.floor(t.player.maxHp / 4));
    assert.equal(loss(), Math.floor(t.player.maxHp / 4), '封顶 1/4');
    const old = t.player.catchTime; t.swap();
    assert.equal(t.sig().toxic[old], 0, '换下重置倍数，毒不解');
  },
  async float() {
    const physical = skillOf({type: 8, category: 1}), special = skillOf({type: 8, category: 2});
    fixRandom(0.99);
    const t = await start('102/205', [physical, special], 1);
    const a = t.turn(physical); assert.equal(a.foe.skillId, 12464, '第 1 回合放浮空连击'); assert.equal(t.sig().until, 3);
    assert.equal(t.turn(physical).own.missed, true, '浮空中物理落空');
    assert.equal(t.turn(special).own.missed, false, '特殊技能照常');
    assert.equal(t.turn(physical).own.missed, false, '浮空结束');
    assert.equal(t.turn(physical).foe.skillId, 12464, '第 5 回合再放');
  },
  async smash() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.6); // 0.99 会让 95 命中的 BOSS 技能落空
    const t = await start('102/206', [normal]);
    t.idle(); t.idle(); assert.equal(t.player.battleLevels[1], 0, '普通攻击不碎甲');
    const hammer = t.idle(); assert.equal(hammer.skillId, t.c.skillId, '第 3 回合放连锤');
    assert.equal(t.player.battleLevels[1], -Math.min(t.c.maxPerHammer, Math.max(1, hammer.atkTimes)), '每段 -1，单次有上限');
    t.player.battleLevels[1] = t.c.lethalAt; t.idle();
    assert.equal(t.player.hp, 0, '防御碎到底时必杀');
  },
  async suppress() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.99);
    const t = await start('102/207', [normal], 9999);
    t.idle(); assert.equal(t.sig().turn, 2, '空过回合被压制');
    assert.match(t.notices(), /下回合火力压制/);
    const a = t.turn(normal); assert.equal(a.r.firstAttack.userId, 0, '被压制必后手');
    const b = t.turn(normal); assert.equal(b.r.firstAttack.userId, a.own.damage >= t.c.threshold ? 1 : 0);
  },
  async abyss() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.6); // 0.99 会让 95 命中的 BOSS 技能落空
    const t = await start('102/208', [normal]);
    t.enemy.hp -= 2000; const hp = t.enemy.hp; t.player.hp = 1; t.idle();
    assert.equal(t.player.hp, 0); assert.equal(t.sig().souls, 1);
    assert.equal(t.enemy.hp, hp + Math.floor(t.enemy.maxHp * t.c.healPercent / 100), '回血');
    assert.equal(t.enemy.battleLevels[0], 1, '攻击 +1');
  },
  async iceLock() {
    const a1 = skillOf({type: 8, category: 1}), a2 = skillOf({type: 8, category: 2});
    fixRandom(0.99);
    const t = await start('102/209', [a1, a2]);
    assert.equal(t.turn(a1).own.missed, false);
    assert.equal(t.turn(a1).own.missed, true, '冰封第 1 回合');
    assert.equal(t.turn(a2).own.missed, false, '其他技能可用');
    assert.equal(t.turn(a1).own.missed, false, '冰封 2 回合后恢复，被挡下不续冰封');
  },
  async blind() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.1);
    const t = await start('102/210', [normal]);
    assert.equal(t.turn(normal).own.missed, true, '奇数回合强光');
    fixRandom(0.99);
    const even = t.turn(normal).own.damage, odd = t.turn(normal).own.damage;
    assert.ok(Math.abs(even - Math.floor(odd * 1.3)) <= 2, `偶数回合伤害 ${even} 应约为 ${odd}×1.3`);
  },
  async scaleRage() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0);
    const t = await start('102/211', [normal]);
    const a = t.turn(normal); assert.equal(a.own.isCrit, true);
    assert.deepEqual([t.enemy.battleLevels[0], t.enemy.battleLevels[1]], [2, -2], '暴击后激怒');
    fixRandom(0.99);
    t.idle(); assert.equal(t.enemy.battleLevels[0], 2);
    t.idle(); assert.deepEqual([t.enemy.battleLevels[0], t.enemy.battleLevels[1]], [0, 0], '2 回合后平息');
  },
  async formless() {
    const normal = skillOf({type: 8, category: 1}), fire = skillOf({type: 3, category: 1});
    fixRandom(0.99);
    const t = await start('102/212', [normal, fire]);
    const d = [t.turn(normal), t.turn(normal), t.turn(normal), t.turn(normal)].map(x => x.own.damage);
    [100, 75, 50, 40].forEach((p, i) => assert.ok(Math.abs(d[i] - Math.floor(d[0] * p / 100)) <= 2, `第${i + 1}次 ${d[i]} 应约为 ${d[0]}×${p}%`));
    t.turn(fire);
    assert.ok(Math.abs(t.turn(normal).own.damage - d[0]) <= 2, '换属性后恢复');
  },
  async battery() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.99);
    const t = await start('102/213', [normal]);
    const full = t.turn(normal).own.damage;
    t.sig().energy = 1; t.idle(); assert.equal(t.sig().down, t.battle.turn + 2, '耗尽瘫痪');
    const down = t.turn(normal); assert.equal(down.foe.skillId, 0, '瘫痪不行动');
    assert.ok(Math.abs(down.own.damage - Math.floor(full * (100 + t.c.downBonus) / 100)) <= 2, '瘫痪受伤增加');
    t.idle(); assert.equal(t.sig().energy, t.c.capacity, '瘫痪结束充满');
  },
  async starSlot() {
    const a1 = skillOf({type: 8, category: 1});
    fixRandom(0.99);
    const t = await start('102/214', [a1, a1 + 0]);
    t.sig().slot = 0; const lit = t.turn(a1).own.damage;
    t.sig().slot = 1; const dim = t.turn(a1).own.damage;
    assert.ok(Math.abs(lit - Math.floor(dim / 0.8 * 1.5)) <= 3, `星光位 ${lit} 与其余 ${dim} 应为 150:80`);
    assert.match(t.notices(), /星光位：下回合第\d个技能/);
  },
  async bloodlust() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.3);
    const t = await start('102/215', [normal]);
    assert.equal(t.idle().isCrit, false, '满血不加暴击');
    t.enemy.hp = Math.floor(t.enemy.maxHp / 2);
    assert.equal(t.idle().isCrit, true, '半血暴击率 +50%');
  },
  async chaosGreen() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.99);
    const t = await start('102/216', [normal]);
    t.idle(); t.idle(); assert.equal(t.player.status === 10 || t.player.statusDurations[10] > 0, false);
    t.idle(); assert.ok(t.player.status === 10 || t.player.statusDurations[10] > 0, '在场 3 回合混乱');
    assert.match(t.notices(), /陷入混乱/);
    t.player.statusDurations[10] = 2;
    assert.equal(Signatures.modifyDamage(t.battle, t.enemy, t.player, {type: 8, category: 1}, 100, 'attack'), 150, '对异常目标 +50%');
  },
  async beastForm() {
    const physical = skillOf({type: 8, category: 1}), special = skillOf({type: 8, category: 2});
    fixRandom(0.99);
    const t = await start('102/217', [physical, special]);
    const d0 = t.turn(physical).own.damage; assert.equal(t.sig().form, 'shadow');
    const d1 = t.turn(physical).own.damage;
    assert.ok(Math.abs(d1 - Math.floor(d0 * 1.25)) <= 2, '暗影形态受伤 +25%');
    t.turn(special); assert.equal(t.sig().form, 'water');
    t.enemy.hp -= 1000; const hp = t.enemy.hp; const a = t.idle();
    assert.equal(t.enemy.hp, hp + Math.floor(t.enemy.maxHp * t.c.regen / 100), '水之形态回血');
  },

  // ---------- 暗黑武斗场 ----------
  async sacrifice() {
    fixRandom(0.6);
    const t = await start('110/0', [skillOf({type: 8, category: 1})]);
    assert.equal(out(t, {}), 150, '伤害 +50%');
    const hp = t.enemy.hp; t.idle();
    assert.equal(t.enemy.hp, hp - Math.floor(hp * 0.1), '攻击自损 10% 当前体力');
    t.enemy.hp = Math.floor(t.enemy.maxHp * 0.19); t.idle();
    assert.equal(t.sig().final, true); assert.match(t.notices(), /同归于尽/);
    t.idle(); assert.equal(t.player.hp, 0, '同归于尽必定击倒'); assert.equal(t.enemy.hp, 1, '之后只剩 1 体力');
    t.player.hp = 100; t.idle(); assert.ok(!t.sig().final, '只放一次');
  },
  async bloodScent() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.6);
    const t = await start('110/1000', [normal], 9999);
    assert.equal(t.turn(normal).r.firstAttack.userId, 1); assert.equal(out(t, {}), 100);
    t.player.hp = 2000;
    assert.equal(t.turn(normal).r.firstAttack.userId, 0, '残血必后手'); assert.equal(out(t, {}), 130);
  },
  async overheat() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.6);
    const t = await start('110/1006', [normal]);
    // 火射八方自带下回合疲惫，所以按出手次数而不是回合数累计
    let warm;
    for (let i = 0; i < 8 && !t.sig().cool; i++) warm = t.turn(normal);
    assert.equal(t.sig().cool, t.battle.turn + 1, '用满 3 次火系技能后过热');
    assert.match(t.notices(), /下回合冷却/);
    const cool = t.turn(normal); assert.equal(cool.foe.skillId, 0, '冷却回合不行动');
    near(cool.own.damage, Math.floor(warm.own.damage * 1.5), '冷却回合受伤 +50%');
    assert.equal(t.sig().heat, 0);
  },
  async requiem() {
    fixRandom(0.6);
    let t = await start('110/1012', [skillOf({type: 8, category: 1})]);
    const used = [t.idle().skillId]; assert.equal(t.sig().mark.turn, 4);
    assert.match(t.notices(), /第4回合结束时倒下/);
    used.push(t.idle().skillId, t.idle().skillId); assert.ok(t.player.hp > 0);
    used.push(t.idle().skillId); assert.equal(t.player.hp, 0, '镇魂歌唱完倒下');
    assert.ok(!used.includes(t.c.skillId), '不用原技能镇魂歌');
    t = await start('110/1012', [skillOf({type: 8, category: 1})]);
    t.idle(); t.swap(); assert.equal(t.sig().mark, null, '换下解除');
    t.player.maxHp = t.player.hp = 5000; t.idle(); assert.equal(t.sig().mark, null); t.idle(); assert.equal(t.sig().mark.turn, 7, '下一次在第 4 回合重唱');
  },
  async quake() {
    fixRandom(0.6);
    const t = await start('110/1013', [skillOf({type: 8, category: 1})]);
    const hp = t.player.hp, a = t.idle();
    assert.equal(hp - t.player.hp - a.damage, Math.floor(t.player.maxHp / 8), '震伤 1/8'); assert.equal(t.player.battleLevels[4], -1, '降速');
    t.player.type = 4; const hp2 = t.player.hp, b = t.idle();
    assert.equal(hp2 - t.player.hp, b.damage, '飞行系不受震波'); assert.equal(t.player.battleLevels[4], -1);
  },
  async staticCharge() {
    const special = skillOf({type: 8, category: 2});
    fixRandom(0.6);
    const t = await start('110/1018', [special], 1);
    for (let i = 0; i < 3; i++) assert.notEqual(t.turn(special).foe.skillId === t.c.skillId && i < 2 && t.sig().blast, true);
    assert.equal(t.sig().charge, 3); assert.match(t.notices(), /电荷 3\/3.*下回合/);
    const a = t.turn(special); assert.equal(a.foe.skillId, t.c.skillId); assert.equal(a.foe.missed, false);
    assert.equal(t.sig().charge, 1, '释放后清空，本回合特攻又 +1');
    t.sig().blast = true; assert.equal(out(t, {id: t.c.skillId, category: 2, type: 5}), 200, '伤害翻倍');
  },
  async gems() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.6);
    const t = await start('110/1019', [normal], 9999);
    assert.equal(t.turn(normal).r.firstAttack.userId, 0, '速度宝石：必定先手');
    assert.equal(inc(t, {}), 70); assert.equal(out(t, {}), 140);
    t.enemy.hp = Math.floor(t.enemy.maxHp * 0.6); t.turn(normal);
    assert.deepEqual(t.sig().gems, ['speed', 'atk'], '体力跌破 75% 碎防御宝石');
    fixRandom(0); t.turn(normal); fixRandom(0.6);
    assert.ok(!t.sig().gems.includes('speed'), '致命一击碎下一颗');
    assert.equal(t.turn(normal).r.firstAttack.userId, 1); assert.equal(inc(t, {}), 100);
  },
  async allIn() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.6);
    const t = await start('110/1024', [normal], 9999);
    assert.equal(out(t, {}), 150); assert.equal(inc(t, {}), 150);
    t.enemy.hp = Math.floor(t.enemy.maxHp * 0.29); t.idle(); assert.equal(t.sig().ready, true);
    const a = t.turn(normal); assert.equal(a.r.firstAttack.userId, 0, '绝招先手'); assert.equal(a.foe.isCrit, true, '绝招必暴');
    assert.equal(t.sig().used, true); assert.equal(t.turn(normal).r.firstAttack.userId, 1, '只放一次');
  },
  async turret() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.6);
    const t = await start('110/1025', [normal]);
    const cannon = t.turn(normal); assert.ok(cannon.foe.skillId > 0); t.turn(normal);
    assert.match(t.notices(), /铁壁形态/);
    const wall = t.turn(normal); assert.equal(wall.foe.skillId, 0, '铁壁不攻击'); t.turn(normal);
    near(wall.own.damage * 130 / 40, cannon.own.damage, '炮台与铁壁受伤之比 130:40', 8);
    t.battle.turn = 5; assert.equal(out(t, {}), 140, '炮台伤害 +40%');
  },
  async hexagram() {
    fixRandom(0.6);
    let t = await start('110/1026', [skillOf({type: 8, category: 1}), skillOf({type: 11})]);
    for (let i = 0; i < 5; i++) t.idle();
    assert.equal(t.sig().stars, 5); assert.match(t.notices(), /本回合结束时爆发/);
    const hp = t.player.hp, a = t.idle();
    assert.equal(hp - t.player.hp - a.damage, Math.floor(t.player.maxHp / 2), '六星齐亮扣 50%'); assert.equal(t.sig().stars, 0);
    t.idle(); t.idle(); t.turn(skillOf({type: 11})); assert.equal(t.sig().stars, 2, '战斗系命中熄一颗后回合末 +1');
  },
  async timeBomb() {
    fixRandom(0.6);
    let t = await start('110/1030', [skillOf({type: 8, category: 1})]);
    t.idle(); assert.equal(t.sig().at, 3);
    t.idle(); let hp = t.player.hp, a = t.idle();
    assert.equal(hp - t.player.hp - a.damage, Math.floor(t.player.maxHp * 0.4), '炸 40%');
    t.idle(); assert.equal(t.sig().at, 6, '隔一回合重新挂上');
    t = await start('110/1030', [skillOf({type: 8, category: 1})]);
    t.idle(); t.swap(); assert.equal(t.sig().moved, true);
    t.player.maxHp = t.player.hp = 5000; hp = t.player.hp; a = t.idle();
    assert.equal(hp - t.player.hp - a.damage, t.c.fixed, '转移后固定伤害');
  },
  async dissociate() {
    fixRandom(0.6);
    const t = await start('110/1031', [skillOf({type: 8, category: 1})]);
    const {attack, spAtk, defence, spDef} = t.player;
    t.idle(); assert.deepEqual([t.player.attack, t.player.spAtk, t.player.defence, t.player.spDef], [spAtk, attack, spDef, defence]);
    t.idle(); assert.equal(t.player.attack, spAtk, '只对调一次');
    // 替补按配置重算属性，与首发同种同级，对调后应与首发对调后相同
    t.swap(); assert.equal(t.player.attack, spAtk, '换上的精灵同样对调');
  },
  async acidRain() {
    fixRandom(0.6);
    const t = await start('110/1032', [skillOf({type: 8, category: 1})]);
    t.idle(); assert.deepEqual([t.sig().def, t.sig().spDef], [1, 0]);
    assert.equal(inc(t, {category: 1}), 150); assert.equal(out(t, {category: 2}), 100);
    t.idle(); assert.equal(out(t, {category: 2}), 150);
    for (let i = 0; i < 10; i++) t.idle();
    assert.deepEqual([t.sig().def, t.sig().spDef], [4, 4], '最多 4 级'); assert.equal(inc(t, {category: 1}), 300);
    t.enemy.battleLevels.fill(0); assert.equal(inc(t, {category: 1}), 300, '不受能力变化影响');
  },
  async acidTide() {
    fixRandom(0.6);
    const t = await start('110/1066', [skillOf({type: 8, category: 1})]);
    t.idle(); assert.equal(inc(t, {category: 1}), 150, '第一条命酸雨');
    t.kill(); assert.equal(t.enemy.hp, t.enemy.maxHp); assert.equal(t.sig().second, true);
    assert.match(t.notices(), /混沌潮汐/); assert.equal(inc(t, {category: 1}), 100, '第二条命不再腐蚀');
    t.player.battleLevels[0] = 2; t.enemy.battleLevels[1] = -1; t.idle();
    assert.equal(t.player.battleLevels[0], -2, '强化反转为削弱'); assert.equal(t.enemy.battleLevels[1], 1);
  },
  async bloom() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.6);
    const t = await start('110/1036', [normal]);
    t.enemy.hp = Math.floor(t.enemy.maxHp * 0.76); t.turn(normal);
    assert.equal(t.sig().flowers, 1, '跌破 75% 开花'); assert.match(t.notices(), /绽开了一朵魔花/);
    const hp = t.enemy.hp; t.idle(); assert.equal(t.enemy.hp, hp + t.c.heal, '每朵每回合回血');
    Signatures.afterAttack(t.battle, t.player, {id: normal, category: 1, type: 8}, {hit: true, damage: t.c.breakAt, isCrit: false, hits: 1});
    assert.equal(t.sig().flowers, 0, '重击击碎');
  },
  async sandstorm() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.1);
    const t = await start('110/1037', [normal]);
    assert.equal(t.turn(normal).own.missed, true, '沙尘暴落空');
    t.player.type = 7; assert.equal(t.turn(normal).own.missed, false, '地面系不受影响');
  },
  async wildfire() {
    fixRandom(0.6);
    const t = await start('110/1038', [skillOf({type: 8, category: 1})]);
    let hp = t.player.hp, a = t.idle();
    assert.equal(t.sig().layers[t.player.catchTime], 1);
    assert.equal(hp - t.player.hp - a.damage, Math.floor(t.player.maxHp / 16), '一层火种 1/16');
    hp = t.player.hp; a = t.idle();
    assert.equal(hp - t.player.hp - a.damage, Math.floor(t.player.maxHp * 2 / 16), '火种叠层');
    t.swap(petOfType(2)); assert.deepEqual(t.sig().layers, {}, '水系上场熄灭全队火种');
    assert.match(t.notices(), /熄灭了全队的火种/);
  },
  async concert() {
    const a1 = skillOf({type: 8, category: 1}), a2 = skillOf({type: 8, category: 2});
    fixRandom(0.6);
    const t = await start('110/1042', [a1, a2], 1);
    assert.equal(t.turn(a1).foe.skillId, t.c.program[0]);
    assert.equal(t.turn(a2).foe.skillId, t.c.program[1], '第 2 回合安可曲');
    assert.equal(t.sig().encoreSkill, a1, '锁定上一招');
    assert.equal(t.turn(a2).own.skillId, a1, '安可：只能重复'); assert.equal(t.turn(a2).own.skillId, a1);
    assert.equal(t.turn(a2).own.skillId, a2, '两回合后恢复');
    const from = t.battle.turn;
    assert.deepEqual([0, 1, 2, 3].map(() => t.turn(a1).foe.skillId), [0, 1, 2, 3].map(i => t.c.program[(from + i) % 4]), '固定曲目循环');
  },
  async overgrowth() {
    const normal = skillOf({type: 8, category: 1}), lower = statusSkill(5, '0 100 -');
    fixRandom(0.6);
    const t = await start('110/1043', [normal, lower]);
    const max = t.enemy.maxHp; t.idle(); t.idle();
    assert.equal(t.sig().stage, 2); assert.equal(t.enemy.maxHp, max + 600); assert.equal(out(t, {}), 110);
    t.turn(lower); assert.equal(t.sig().stage, 1, '被降能力缩回一档'); assert.equal(t.enemy.maxHp, max + 300);
  },
  async mirrors() {
    const normal = skillOf({type: 8, category: 1}), multi = skillOf({multi: true});
    fixRandom(0.1);
    let t = await start('110/1044', [normal, multi]);
    assert.equal(t.turn(normal).own.missed, true, '打中镜像'); assert.equal(t.sig().images, 1);
    assert.equal(t.turn(normal).own.missed, true); assert.equal(t.sig().images, 0);
    assert.equal(t.turn(normal).own.missed, false, '镜像碎完打中本体');
    t.turn(normal); assert.equal(t.sig().images, 2, '第 4 回合补满');
    fixRandom(0.6); t = await start('110/1044', [normal, multi]);
    assert.equal(t.turn(multi).own.missed, false, '连击打中本体'); assert.equal(t.sig().images, 0);
  },
  async belt() {
    fixRandom(0.6);
    const t = await start('110/1048', [skillOf({type: 8, category: 1})], 1);
    assert.equal(t.idle().skillId, t.c.skillId); assert.equal(t.sig().until, 4);
    assert.equal(t.player.battleLevels[3], -1, '特防 -1'); assert.match(Signatures.blockSwitch(t.battle), /不能换下/);
    assert.match(t.notices(), /黑色束带缠着/);
    t.player.catchTime++; assert.doesNotMatch(t.notices(), /黑色束带缠着/, '换上的精灵没被缠，不显示被缠'); t.player.catchTime--;
    t.player.catchTime++; assert.equal(Signatures.selectSkill(t.battle, 0), t.c.skillId, '换上的精灵没被缠，它会再放束带'); t.player.catchTime--;
    t.kill(); assert.equal(t.sig().second, true);
    const hp = t.player.hp, a = t.idle();
    assert.equal(hp - t.player.hp - a.damage, Math.floor(t.player.maxHp * 0.05), '暴走后吸血 5%');
    t.player.hp = 0; assert.equal(Signatures.blockSwitch(t.battle), '', '倒下后可以换');
  },
  async breakBlade() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.6);
    const t = await start('110/1049', [normal], 9999);
    const d1 = t.turn(normal).own.damage; assert.equal(t.sig().cut[normal], 20);
    const power = GameConfig.GetSkillById(normal).Power;
    near(t.turn(normal).own.damage, Math.floor(d1 * Math.max(40, Math.round((power - 20) * 100 / power)) / 100), '威力 -20');
    t.kill(); assert.equal(t.turn(normal).r.firstAttack.userId, 0, '暴走后必定先手');
  },
  async frostRule() {
    const a1 = skillOf({type: 8, category: 1}), a2 = skillOf({type: 8, category: 2});
    fixRandom(0.2);
    const t = await start('110/1050', [a1, a2]);
    t.idle(); assert.ok(SkillEffectRuntime.HasStatus(t.player, 5), '冰系攻击 30% 冻伤');
    fixRandom(0.9); assert.equal(Signatures.playerSkill(t.battle, a1), a2, '冻伤时技能随机');
    t.player.statusDurations.fill(0); t.player.status = undefined;
    assert.equal(Signatures.playerSkill(t.battle, a1), a1);
    t.kill(); fixRandom(0.2); t.player.statusDurations.fill(0); t.player.status = undefined;
    t.enemy.skills = [t.enemy.skills.find(id => GameConfig.GetSkillById(id).Type !== 9) || t.enemy.skills[0]];
    t.idle(); assert.ok(SkillEffectRuntime.HasStatus(t.player, 5), '暴走后回合末判定冻伤');
  },
  async scales() {
    fixRandom(0.6);
    const t = await start('110/1054', [skillOf({type: 8, category: 1})]);
    const gate = Math.floor(t.enemy.maxHp * 0.08);
    assert.equal(inc(t, {}, gate - 1), 0, '低于门槛被弹开'); assert.equal(inc(t, {}, gate), gate);
    t.kill(); assert.equal(inc(t, {}, 50), 50, '鳞甲剥落');
    assert.deepEqual([t.enemy.battleLevels[0], t.enemy.battleLevels[4]], [2, 2]);
  },
  async echo() {
    const a1 = skillOf({type: 8, category: 1}), a2 = skillOf({type: 8, category: 2});
    fixRandom(0.6);
    const t = await start('110/1055', [a1, a2], 9999);
    t.turn(a1); assert.match(t.notices(), new RegExp('回放你的' + GameConfig.GetSkillById(a1).Name));
    assert.equal(t.turn(a2).foe.skillId, a1, '回放上回合的攻击');
    assert.equal(t.turn(a1).foe.skillId, a2);
    t.kill(); t.sig().echo = a1; assert.equal(out(t, {id: a1}), 200, '暴走后回放伤害加倍');
  },
  async meteor() {
    const normal = skillOf({type: 8, category: 1}), guard = statusSkill(4, '1 100');
    fixRandom(0.6);
    let t = await start('110/1056', [normal, guard]);
    t.idle(); t.idle(); let hp = t.player.hp, a = t.idle();
    assert.equal(hp - t.player.hp - a.damage, Math.floor(t.player.maxHp * 0.5), '陨星 50%'); assert.equal(t.sig().at, 6);
    t.idle(); t.idle(); t.player.hp = t.player.maxHp; hp = t.player.hp; a = t.turn(guard);
    assert.equal(hp - t.player.hp - a.foe.damage, Math.floor(t.player.maxHp * 0.25), '属性技能减半');
    t.kill(); assert.equal(t.sig().at, t.battle.turn + 2, '暴走后间隔 2');
    assert.equal(t.enemy.battleLevels[0] >= 2, true);
  },
  // ---------- 星系霸主 ----------
  async dragonAwe() {
    fixRandom(0.6);
    const t = await start('348/0', [skillOf({type: 8, category: 1})]);
    const stat = t.player.attack >= t.player.spAtk ? 0 : 2;
    t.idle(); assert.equal(t.player.battleLevels[stat], -1); t.idle(); assert.equal(t.player.battleLevels[stat], -2);
    assert.match(t.notices(), /龙威/);
    t.swap(); assert.equal(t.player.battleLevels[stat], -1, '换精灵重置后本回合末 -1');
  },
  async undying() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.6);
    let t = await start('348/3', [normal], 9999);
    t.enemy.hp = 10; t.turn(normal);
    assert.equal(t.enemy.hp, 1, '濒死撑住'); assert.equal(t.sig().until, 4); assert.equal(t.enemy.battleLevels[0], 2);
    t.turn(normal); t.turn(normal); assert.equal(t.enemy.hp, 1, '期间攻击无效');
    t.turn(normal); assert.equal(t.enemy.hp, 0, '没击倒精灵就力竭'); assert.equal(t.battle.isOver, true);
    t = await start('348/3', [normal], 9999);
    t.enemy.hp = 10; t.turn(normal); t.player.hp = 1; t.idle(); assert.equal(t.player.hp, 0); assert.equal(t.sig().kills, 1);
    t.notices(); t.idle(); t.battle.turn = 4; assert.match(Signatures.DEFS.undying.status(t.battle, t.c, t.sig()), /本回合结束时结算/, '期限到了但还没结算');
    t.battle.turn = 3;
    t.swap(); t.player.maxHp = t.player.hp = 5000; t.idle(); assert.equal(t.enemy.hp, 1 + Math.floor(t.enemy.maxHp * 0.2), '击倒过精灵则回复 20%');
  },
  async dimensionIce() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.6);
    let t = await start('331/0', [normal], 1);
    const used = [t.idle().skillId, t.idle().skillId, t.idle().skillId];
    assert.ok(!used.includes(t.c.skillId), '平时不用次元冰魄'); assert.match(t.notices(), /第4回合使出/);
    t.player.hp = t.player.maxHp - 1000; const a = t.turn(normal);
    assert.equal(a.foe.skillId, t.c.skillId); assert.equal(a.foe.damage, 1000, '伤害等于已损失体力'); assert.equal(a.own.skillId, 0, '它先手时当回合被冻住');
    // 玩家先手：冻住下一回合
    t = await start('331/0', [normal], 9999);
    t.idle(); t.idle(); t.idle(); t.turn(normal); assert.equal(t.turn(normal).own.skillId, 0, '玩家先手时下回合被冻住');
  },
  async rebirth() {
    fixRandom(0.6);
    const t = await start('405/0', [skillOf({type: 8, category: 1})]);
    t.idle(); assert.equal(t.enemy.hp, t.enemy.maxHp, '第一条命不自焚');
    t.kill(); assert.equal(t.sig().second, true); assert.ok(t.enemy.battleLevels[0] >= 2 && t.enemy.battleLevels[2] >= 2);
    t.idle(); assert.equal(t.enemy.hp, t.enemy.maxHp - Math.floor(t.enemy.maxHp * 0.08), '每回合自焚 8%');
    t.enemy.hp = 10; t.idle(); assert.equal(t.enemy.hp, 0, '自焚可以烧死'); assert.equal(t.battle.isOver, true);
  },
  async combo() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.6);
    let t = await start('405/1', [normal], 1);
    t.idle(); t.idle(); assert.equal(t.sig().combo, 2); assert.equal(out(t, {}), 150);
    Signatures.afterAttack(t.battle, t.enemy, {id: 1, category: 2, type: 8}, {hit: false, damage: 0, isCrit: false, hits: 0});
    assert.equal(t.sig().combo, 0, '打空中断');
    t = await start('405/1', [normal], 9999);
    t.idle(); t.idle(); t.turn(normal); assert.equal(t.sig().combo, 1, '被先手命中中断后再叠 1');
  },
  async petrify() {
    const a1 = skillOf({type: 8, category: 1}), a2 = skillOf({type: 8, category: 2});
    fixRandom(0.6);
    const t = await start('438/0', [a1, a2], 9999);
    t.turn(a1); assert.match(t.notices(), /再用.*会被石化/);
    t.turn(a1); assert.equal(t.player.fatigueTurns, 1, '连续两回合同一招被石化');
    assert.equal(t.turn(a2).own.skillId, 0, '石化回合不能出手');
    t.turn(a1); t.turn(a2); t.turn(a1); assert.equal(t.player.fatigueTurns, 0, '交替使用不石化');
  },
  async dualArmor() {
    fixRandom(0.6);
    const t = await start('401/1', [skillOf({type: 8, category: 1})]);
    assert.equal(inc(t, {category: 1}), 40); assert.equal(inc(t, {category: 2}), 40);
    Signatures.afterAttack(t.battle, t.player, {id: 1, category: 1, type: 8}, {hit: true, damage: 100, isCrit: false, hits: 1});
    assert.equal(inc(t, {category: 1}), 60, '物理命中剥物理装甲'); assert.equal(inc(t, {category: 2}), 40);
    for (let i = 0; i < 4; i++) t.idle();
    assert.equal(inc(t, {category: 1}), 40, '第 4 回合长回');
  },
  async absoluteZero() {
    fixRandom(0.6);
    let t = await start('430/0', [skillOf({type: 8, category: 1})]);
    for (let i = 0; i < 4; i++) t.idle();
    assert.ok(t.player.hp > 0);
    t.idle(); assert.equal(t.player.hp, 0, '读条结束倒下');
    t = await start('430/0', [skillOf({type: 8, category: 1})]);
    Signatures.afterAttack(t.battle, t.player, {id: 1, category: 1, type: 8}, {hit: true, damage: t.c.breakAt, isCrit: false, hits: 1});
    assert.match(t.notices(), /被自己的寒气冻住/);
    assert.equal(t.idle().skillId, 0, '打断后冻住一回合'); assert.equal(inc(t, {}), 130);
    t.idle(); t.idle(); t.idle(); assert.ok(t.player.hp > 0); assert.equal(t.sig().at, 6);
  },
  async underdog() {
    for (const key of ['415/0', '411/0']) {
      const t = await start(key, [skillOf({type: 8, category: 1})]);
      assert.equal(inc(t, {power: 150}), 50); assert.equal(inc(t, {power: 100}), 100);
    }
  },
  async taproot() {
    fixRandom(0.6);
    const t = await start('414/0', [skillOf({type: 8, category: 1})]);
    t.enemy.skills = [10067];
    t.enemy.hp = 1000; t.idle(); assert.equal(t.enemy.hp, 1300); t.idle(); assert.equal(t.enemy.hp, 1700, '逐回合 +100');
    for (let i = 0; i < 6; i++) t.idle();
    assert.equal(t.sig().heal, 800, '最多 800');
    assert.ok(SkillEffectRuntime.Inflict(t.enemy, 0, 2), '伊特不免疫异常');
    const hp = t.enemy.hp; t.idle(); assert.equal(t.enemy.hp, hp, '异常中不回血'); assert.equal(t.sig().heal, 300, '回复量重置');
  },
  async peakShadow() {
    fixRandom(0.6);
    const t = await start('445/0', [skillOf({type: 8, category: 1})]);
    t.enemy.skills = [10223];
    t.idle(); t.idle(); t.idle(); assert.deepEqual(t.enemy.battleLevels.slice(0, 5), [1, 1, 1, 1, 1]);
    assert.equal(t.idle().isCrit, true, '强化够高必暴');
    const hp = t.enemy.hp; t.enemy.battleLevels.fill(0);
    Signatures.afterAttack(t.battle, t.player, {id: 1, category: 4, type: 8}, {hit: true, damage: 0, isCrit: false, hits: 1});
    assert.equal(t.enemy.hp, hp - Math.floor(hp * 0.15), '被消强损失 15% 当前体力');
  },
  async havoc() {
    fixRandom(0.6);
    const t = await start('486/0', [skillOf({type: 8, category: 1})]);
    t.enemy.skills = [11752];
    const hp = t.player.hp, boss = t.enemy.hp, a = t.idle();
    assert.equal(hp - t.player.hp - a.damage, Math.floor(t.player.maxHp * 0.06)); assert.equal(t.enemy.hp, boss - Math.floor(t.enemy.maxHp * 0.06));
  },
  async tireless() {
    fixRandom(0.6);
    const t = await start('450/0', [skillOf({type: 8, category: 1})]);
    t.idle(); t.idle(); assert.equal(t.sig().stacks, 2); assert.equal(out(t, {}), 120);
    t.enemy.hp = Math.floor(t.enemy.maxHp * 0.7); t.enemy.battleLevels[0] = 3;
    Signatures.afterAttack(t.battle, t.player, {id: 1, category: 1, type: 8}, {hit: true, damage: 100, isCrit: false, hits: 1});
    assert.equal(t.sig().stacks, 0, '跌破 75% 清空'); assert.equal(t.enemy.battleLevels[0], 0);
  },
  async spinDodge() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.6);
    const t = await start('495/0', [normal], 1);
    t.turn(normal); t.turn(normal); assert.match(t.notices(), /下回合回旋闪避/);
    assert.equal(t.turn(normal).own.missed, true, '闪避回合必落空'); assert.equal(t.sig().punish, true);
    assert.equal(t.turn(normal).foe.skillId, t.c.skillId, '打空后用破绽打击'); assert.equal(t.sig().punish, false);
  },
  async duel() {
    const t = await start('9507/0', [skillOf({type: 8, category: 1})]);
    assert.equal(out(t, {}), 100);
    t.enemy.hp = Math.floor(t.enemy.maxHp * 0.59); assert.equal(out(t, {}), 130);
    t.player.hp = Math.floor(t.player.maxHp * 0.79); assert.equal(inc(t, {}), 115);
  },
  async vortex() {
    fixRandom(0.6);
    const t = await start('441/0', [skillOf({type: 8, category: 1})]);
    t.enemy.skills = [11544];
    t.player.battleLevels[2] = 3; t.player.battleLevels[0] = 1; t.idle();
    assert.equal(t.player.battleLevels[2], 2, '卷走最高的一级'); assert.equal(t.enemy.battleLevels[2], 1);
    t.player.battleLevels.fill(0); const hp = t.player.hp, a = t.idle();
    assert.equal(hp - t.player.hp - a.damage, Math.floor(t.player.maxHp / 10), '没有强化时吸取 1/10');
  },
  // ---------- 剧情 BOSS ----------
  async screech() {
    fixRandom(0.6);
    let t = await start('684/0', [skillOf({type: 8, category: 1})]);
    const used = [t.idle().skillId, t.idle().skillId, t.idle().skillId];
    assert.ok(!used.includes(t.c.skillId)); assert.equal(t.sig().charge, 3);
    const a = t.idle(); assert.equal(a.skillId, t.c.skillId); assert.equal(a.missed, false); assert.equal(t.sig().charge, 0);
    t = await start('684/0', [skillOf({type: 8, category: 1})]);
    t.idle();
    for (let i = 0; i < 3; i++) Signatures.afterAttack(t.battle, t.player, {id: 1, category: 1, type: 8}, {hit: true, damage: 10, isCrit: false, hits: 1});
    assert.equal(t.sig().charge, 0, '被命中 3 次打断');
  },
  async nightVeil() {
    const normal = skillOf({type: 8, category: 1});
    fixRandom(0.1);
    let t = await start('686/0', [normal], 9999);
    assert.equal(t.turn(normal).own.missed, true); assert.equal(t.sig().dodge, 40);
    fixRandom(0.5); assert.equal(t.turn(normal).own.missed, false); assert.equal(t.sig().dodge, 30, '命中 -10%');
    t = await start('686/1', [normal]);
    assert.equal(t.sig().dodge, 0, '火之果形态开场无闪避'); t.idle(); assert.equal(t.sig().dodge, 10);
  },
};

(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());
  await ConfigRegistry.Instance.Initialize();
  await load('shared/config/game/SkillEffectsConfig').SkillEffectsConfig.Instance.Load();
  BossAbilityConfig.Instance.Load();
  load('GameServer/Game/Battle/effects');
  const only = process.argv[3];
  let failed = 0;
  for (const [name, run] of Object.entries(tests)) {
    if (only && only !== name) continue;
    try { await run(); console.log(`ok   ${name}`); }
    catch (error) { failed++; console.log(`FAIL ${name}: ${error.message}\n${String(error.stack).split('\n').slice(1, 4).join('\n')}`); }
    finally { Math.random = realRandom; }
  }
  const configured = new Set(JSON.parse(require('node:fs').readFileSync(path.join(app, 'config/data/json/boss_abilities.json'), 'utf8')).bossConfigs.map(b => b.mechanics?.signature?.id).filter(Boolean));
  for (const id of configured) if (!tests[id]) { failed++; console.log(`FAIL no test for signature ${id}`); }
  console.log(failed ? `${failed} failed` : 'all passed');
  process.exitCode = failed ? 1 : 0;
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
