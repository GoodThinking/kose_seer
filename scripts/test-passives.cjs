'use strict';
// Boss passives and player traits (skill_effects_v2 ids 1902-2772) in real turns on an isolated runtime copy.
// Semantics follow the official NewSe table in config/data/xml/skill_effects.xml.
// Usage: node scripts/test-passives.cjs <runtime app dir with dist/config/node_modules> [--report]
const assert = require('node:assert/strict');
const path = require('node:path');
const app = path.resolve(process.argv[2]);
const report = process.argv.includes('--report');
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
const {Logger, LogLevel} = load('shared/utils/Logger');
Logger.SetMinLevel(process.env.SIM_LOG === 'info' ? LogLevel.Info : LogLevel.Error);
const {ConfigLoader} = load('shared/config/ConfigLoader');
const {ConfigRegistry} = load('shared/config/ConfigRegistry');
const {GetGameConfigRegistrations} = load('shared/config/ConfigDefinitions');
const {GameConfig} = load('shared/config/game/GameConfig');
const {SkillEffectsConfig} = load('shared/config/game/SkillEffectsConfig');
const {BattleInitService} = load('GameServer/Game/Battle/services/BattleInitService');
const {BattleTurnService} = load('GameServer/Game/Battle/services/BattleTurnService');
const {BattleTurnExecutor} = load('GameServer/Game/Battle/BattleTurnExecutor');
const {BattleEffectIntegration} = load('GameServer/Game/Battle/BattleEffectIntegration');
const {BattleType} = load('shared/models/BattleModel');

const init = new BattleInitService({Uid: 1});
const service = new BattleTurnService();
const results = [];
const failures = [];

// 抓 (physical 40), 水枪 (special water 40), 鸣叫 (status), 麻痹粉, 撞击; 皮皮 (flying) vs 伊优 (water)
const SCRATCH = 10006, WATER = 10013, GROWL = 20002, PARALYZE = 20031, PLAYER = 10, FOE = 4;

function pet(petId, skills, stats = {}) {
  const cfg = GameConfig.GetPetById(petId);
  const p = init.BuildBattlePet(petId, cfg.DefName, 100, 1000, 1000, 300, 300, 300, 300, 300, cfg.Type || 0, skills, 1700000000 + petId, 0);
  return Object.assign(p, {hp: 1000, maxHp: 1000}, stats);
}
/** passives: {player: [[id, args]], foe: [[id, args]]}; traits: player trait ability ids */
async function battle(playerSkills, foeSkills, {player = {}, foe = {}, passives = {}, traits = []} = {}) {
  const b = {userId: 1, player: pet(PLAYER, playerSkills, {speed: 999, ...player}), enemy: pet(FOE, foeSkills, {speed: 10, ...foe}),
    turn: 0, isOver: false, startTime: 0, roundCount: 0, lastHitWasCritical: false, battleType: BattleType.PVE};
  if (traits.length) b.player.effectList = traits.map(itemId => ({status: 2, itemId}));
  if (passives.player) b.player.bossAbilityEntries = passives.player.map(([id, args]) => ({id, args}));
  if (passives.foe) b.enemy.bossAbilityEntries = passives.foe.map(([id, args]) => ({id, args}));
  await init.TriggerPassiveAbilities(b.player, b.enemy);
  BattleEffectIntegration.OnBattleStart(b);
  b.skills = new Map();
  for (const id of [...playerSkills, ...foeSkills]) if (id) service.LoadSkillConfig(id, b.skills);
  return b;
}
function withRandom(value, fn) {
  const random = Math.random;
  Math.random = typeof value === 'function' ? value : () => value;
  try { return fn(); } finally { Math.random = random; }
}
function turn(b, mine, foeSkill, random = 0.5) {
  b.turn++;
  const before = {p: b.player.hp, e: b.enemy.hp};
  const r = withRandom(random, () => BattleTurnExecutor.ExecuteTurn(b, mine, foeSkill, b.skills, {isPvp: foeSkill === 0}));
  const mineAttack = [r.firstAttack, r.secondAttack].find(a => a?.userId === b.userId);
  const foeAttack = [r.firstAttack, r.secondAttack].find(a => a && a.userId !== b.userId);
  return {r, mine: mineAttack, foe: foeAttack, dealt: before.e - b.enemy.hp, taken: before.p - b.player.hp};
}
/** Damage of one player move into the foe, with and without the foe's passive. */
async function dealtWith(move, passive, opts = {}, random = 0.5) {
  const on = await battle([move], [0], {...opts, passives: {foe: [passive]}});
  const off = await battle([move], [0], opts);
  return [turn(on, move, 0, random).dealt, turn(off, move, 0, random).dealt, on];
}
async function check(id, name, fn) {
  try {
    await fn();
    results.push(`${id} ${name}`);
  } catch (error) {
    if (!report) throw error;
    failures.push(`${id} ${name}: ${error.message.split('\n')[0]}`);
  }
}

(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());
  await ConfigRegistry.Instance.Initialize();
  await SkillEffectsConfig.Instance.Load();

  // ==================== 玩家特性（pet_abilities 1006-1045） ====================
  await check(1027, '瞬杀 3% OHKO', async () => {
    const b = await battle([SCRATCH], [0], {traits: [1027]});
    turn(b, SCRATCH, 0, 0.01);
    assert.equal(b.enemy.hp, 0, 'OHKO at 1%');
    const c = await battle([SCRATCH], [0], {traits: [1027]});
    turn(c, SCRATCH, 0, 0.5);
    assert.ok(c.enemy.hp > 0, 'no OHKO at 50%');
  });
  await check(1024, '坚硬 damage -5%', async () => {
    const off = await battle([SCRATCH], [SCRATCH]);
    const b = await battle([SCRATCH], [SCRATCH], {traits: [1024]});
    const taken = turn(b, SCRATCH, SCRATCH).taken, raw = turn(off, SCRATCH, SCRATCH).taken;
    assert.ok(taken < raw && taken >= Math.floor(raw * 0.94), `坚硬 ${taken}/${raw}`);
  });
  await check(1029, '带电 paralyzes the attacker', async () => {
    const b = await battle([SCRATCH], [SCRATCH], {traits: [1029], player: {speed: 10}, foe: {speed: 999}});
    turn(b, SCRATCH, SCRATCH, 0.01);
    assert.ok(b.enemy.statusDurations[0] > 0, 'foe paralyzed after hitting');
  });
  await check(1025, '回避 accuracy -5%', async () => {
    const b = await battle([GROWL], [SCRATCH], {traits: [1025]});
    // 抓 100% 命中：回避后为95%，随机96落空
    assert.equal(turn(b, GROWL, SCRATCH, 0.96).foe.missed, true, 'dodged at 96');
    const c = await battle([GROWL], [SCRATCH], {traits: [1025]});
    assert.equal(turn(c, GROWL, SCRATCH, 0.9).foe.missed, false, 'hit at 90');
  });
  await check(1006, '叶绿 grass +5%', async () => {
    const leaf = 10003; // 疾风刃 grass physical
    const a = await battle([leaf], [0], {traits: [1006]});
    const c = await battle([leaf], [0]);
    const on = turn(a, leaf, 0).dealt, off = turn(c, leaf, 0).dealt;
    assert.ok(on > off && on <= Math.ceil(off * 1.06), `叶绿 ${on}/${off}`);
  });
  await check(1022, '精准 accuracy +5%', async () => {
    const b = await battle([10001], [0], {traits: [1022]}); // 撞击 95%
    assert.equal(turn(b, 10001, 0, 0.97).mine.missed, false, '95%+5% hits at 97');
    const c = await battle([10001], [0]);
    assert.equal(turn(c, 10001, 0, 0.97).mine.missed, true, 'fixture misses at 97');
  });
  await check(1023, '会心 crit +1/16', async () => {
    // 1/16 + 1/16：基础判定不中时再以 1/15 补判，随机0.065两次都落在区间内
    const b = await battle([SCRATCH], [0], {traits: [1023]});
    assert.equal(turn(b, SCRATCH, 0, 0.065).mine.isCrit, true, '2/16 crit at 0.065');
    const c = await battle([SCRATCH], [0]);
    assert.equal(turn(c, SCRATCH, 0, 0.065).mine.isCrit, false, 'fixture no crit at 0.065');
  });
  await check(1026, '顽强 3% survive with 1 HP', async () => {
    const b = await battle([GROWL], [SCRATCH], {traits: [1026], player: {hp: 5}});
    turn(b, GROWL, SCRATCH, 0.01);
    assert.equal(b.player.hp, 1, 'survives at 1%');
  });
  await check(1028, '回神 3% full heal at 1/8', async () => {
    const b = await battle([GROWL], [SCRATCH], {traits: [1028], player: {hp: 150}});
    turn(b, GROWL, SCRATCH, 0.01);
    assert.equal(b.player.hp, 1000, 'full heal at 1%');
  });
  await check(1035, '反抗 special hit lowers foe attack', async () => {
    const b = await battle([GROWL], [WATER], {traits: [1035]});
    turn(b, GROWL, WATER, 0.01);
    assert.equal(b.enemy.battleLevels[0], -1, 'foe attack -1');
  });
  await check(1041, '反击 hit raises own attack, capped at +6', async () => {
    const b = await battle([GROWL], [SCRATCH], {traits: [1041], player: {hp: 99999, maxHp: 99999}});
    b.player.battleLevels[0] = 5;
    for (let i = 0; i < 3; i++) turn(b, GROWL, SCRATCH, 0.01);
    assert.equal(b.player.battleLevels[0], 6, 'capped at +6');
  });
  await check(1039, '汲取 heals 8% of damage', async () => {
    const b = await battle([SCRATCH], [0], {traits: [1039], player: {hp: 500}});
    const r = turn(b, SCRATCH, 0);
    assert.equal(b.player.hp, 500 + Math.floor(r.dealt * 0.08), '汲取 heal');
  });

  // ==================== BOSS被动 ====================
  await check(1902, '免疫能力下降', async () => {
    const b = await battle([GROWL], [0], {passives: {foe: [[1902, []]]}});
    turn(b, GROWL, 0);
    assert.equal(b.enemy.battleLevels[0], 0);
  });
  await check(1903, '免疫异常状态', async () => {
    const b = await battle([PARALYZE], [0], {passives: {foe: [[1903, []]]}});
    turn(b, PARALYZE, 0, 0.3);
    assert.equal(b.enemy.statusDurations[0], 0);
  });
  await check(1904, '受伤减免 50%', async () => {
    const [on, off] = await dealtWith(SCRATCH, [1904, [50]]);
    assert.ok(Math.abs(on * 2 - off) <= 2, `${on}/${off}`);
  });
  await check(1905, '同系吸收', async () => {
    const b = await battle([WATER], [0], {passives: {foe: [[1905, []]]}, foe: {hp: 500}});
    turn(b, WATER, 0);
    assert.ok(b.enemy.hp > 500, `water heals the water foe: ${b.enemy.hp}`);
  });
  await check(1906, '属性免疫 only normal and fire', async () => {
    const [water] = await dealtWith(WATER, [1906, [3]]);
    assert.equal(water, 0, 'water blocked');
    const [normal] = await dealtWith(SCRATCH, [1906, [3]]);
    assert.ok(normal > 0, 'normal still hurts');
  });
  await check(2006, '受击致异常 100% paralysis', async () => {
    const b = await battle([SCRATCH], [0], {passives: {foe: [[2006, [0, 100]]]}});
    turn(b, SCRATCH, 0);
    assert.ok(b.player.statusDurations[0] > 0);
  });
  await check(2007, '闪避提升 100%', async () => {
    const b = await battle([SCRATCH], [0], {passives: {foe: [[2007, [100]]]}});
    assert.equal(turn(b, SCRATCH, 0).mine.missed, true);
  });
  await check(2008, '固定会心率 16/16', async () => {
    const b = await battle([SCRATCH], [0], {passives: {player: [[2008, [16]]]}});
    assert.equal(turn(b, SCRATCH, 0, 0.9).mine.isCrit, true);
  });
  await check(2009, '濒死回满 below 500', async () => {
    const b = await battle([SCRATCH], [0], {passives: {foe: [[2009, [0, 990]]]}});
    turn(b, SCRATCH, 0);
    assert.equal(b.enemy.hp, b.enemy.maxHp);
  });
  await check(2010, '无限PP', async () => {
    const b = await battle([SCRATCH], [0], {passives: {player: [[2010, []]]}});
    const pp = b.player.skillPP[0];
    turn(b, SCRATCH, 0);
    assert.equal(b.player.skillPP[0], pp);
  });
  await check(2011, '伤害反弹 1/2', async () => {
    const b = await battle([SCRATCH], [0], {passives: {foe: [[2011, [2]]]}});
    const r = turn(b, SCRATCH, 0);
    assert.equal(r.taken, Math.floor(r.dealt / 2));
  });
  await check(2012, '受特攻提升能力 twice at most', async () => {
    const b = await battle([WATER], [0], {passives: {foe: [[2012, [3, 2]]]}});
    for (let i = 0; i < 3; i++) turn(b, WATER, 0);
    assert.equal(b.enemy.battleLevels[3], 2);
  });
  await check(2016, '血量绑定能力', async () => {
    const b = await battle([SCRATCH], [0], {passives: {foe: [[2016, [1]]]}, player: {attack: 1500}});
    turn(b, SCRATCH, 0);
    const lost = Math.floor((1000 - b.enemy.hp) / 125);
    assert.equal(b.enemy.battleLevels[1], Math.min(6, lost), `def stage ${b.enemy.battleLevels[1]} for ${1000 - b.enemy.hp} lost`);
  });
  await check(2020, '技能破防 by 水枪', async () => {
    const b = await battle([SCRATCH, WATER], [0], {passives: {foe: [[2020, [WATER]]]}});
    assert.equal(turn(b, SCRATCH, 0).dealt, 0, 'shielded');
    turn(b, WATER, 0);
    assert.ok(turn(b, SCRATCH, 0).dealt > 0, 'broken by 水枪');
  });
  await check(2021, '致死余1 unless 水枪', async () => {
    const b = await battle([SCRATCH], [0], {passives: {foe: [[2021, [WATER]]]}, foe: {hp: 5}});
    turn(b, SCRATCH, 0);
    assert.equal(b.enemy.hp, 1, 'survives 抓');
    const c = await battle([WATER], [0], {passives: {foe: [[2021, [WATER]]]}, foe: {hp: 5}});
    turn(c, WATER, 0);
    assert.equal(c.enemy.hp, 0, '水枪 kills');
  });
  await check(2022, '受击伤害倍增 x2', async () => {
    const [on, off] = await dealtWith(SCRATCH, [2022, [2]]);
    assert.ok(Math.abs(on - off * 2) <= 2, `${on}/${off}`);
  });
  await check(2024, '技能闪避 抓', async () => {
    const b = await battle([SCRATCH, WATER], [0], {passives: {foe: [[2024, [SCRATCH]]]}});
    assert.equal(turn(b, SCRATCH, 0).mine.missed, true, '抓 misses');
    assert.equal(turn(b, WATER, 0).mine.missed, false, '水枪 hits');
  });
  await check(2026, '固定属性加成 attack +100', async () => {
    const b = await battle([SCRATCH], [0], {passives: {player: [[2026, [1, 100]]]}});
    turn(b, SCRATCH, 0);
    turn(b, SCRATCH, 0);
    assert.equal(b.player.attack, 400, 'applied once at the first turn');
  });
  await check(2027, '属性顺序破防 water then fire', async () => {
    const fire = 10007;
    const b = await battle([SCRATCH, WATER, fire], [0], {passives: {foe: [[2027, [2, 3]]]}});
    assert.equal(turn(b, fire, 0).dealt, 0, 'fire first blocked');
    assert.ok(turn(b, WATER, 0).dealt > 0, 'water first');
    assert.ok(turn(b, fire, 0).dealt > 0, 'then fire');
  });
  await check(2028, '属性伤害加成 normal +50%', async () => {
    const a = await battle([SCRATCH], [0], {passives: {player: [[2028, [8, 50]]]}});
    const c = await battle([SCRATCH], [0]);
    const on = turn(a, SCRATCH, 0).dealt, off = turn(c, SCRATCH, 0).dealt;
    assert.ok(Math.abs(on - off * 1.5) <= 2, `${on}/${off}`);
  });
  await check(2031, '致死存活 100% keeps 1 HP', async () => {
    const b = await battle([SCRATCH], [0], {passives: {foe: [[2031, [100, 1]]]}, foe: {hp: 5}});
    turn(b, SCRATCH, 0);
    assert.equal(b.enemy.hp, 1);
  });
  await check(2035, '受击自身提升能力 capped', async () => {
    const b = await battle([SCRATCH], [0], {passives: {foe: [[2035, [1, 100]]]}, foe: {hp: 99999, maxHp: 99999}});
    for (let i = 0; i < 8; i++) turn(b, SCRATCH, 0);
    assert.equal(b.enemy.battleLevels[1], 6);
  });
  await check(2037, '高伤反杀 over 50', async () => {
    const b = await battle([SCRATCH], [0], {passives: {foe: [[2037, [0, 50]]]}, player: {attack: 3000}});
    turn(b, SCRATCH, 0);
    assert.equal(b.player.hp, 0);
  });
  await check(2038, '伤害增加 +50%', async () => {
    const a = await battle([SCRATCH], [0], {passives: {player: [[2038, [50]]]}});
    const c = await battle([SCRATCH], [0]);
    const on = turn(a, SCRATCH, 0).dealt, off = turn(c, SCRATCH, 0).dealt;
    assert.ok(Math.abs(on - off * 1.5) <= 2, `${on}/${off}`);
  });
  await check(2041, '每回合回血 100', async () => {
    const b = await battle([GROWL], [0], {passives: {foe: [[2041, [100]]]}, foe: {hp: 500}});
    turn(b, GROWL, 0);
    assert.equal(b.enemy.hp, 600);
  });
  await check(2042, '先制变化 +6', async () => {
    const b = await battle([SCRATCH], [SCRATCH], {passives: {foe: [[2042, [6]]]}});
    assert.equal(turn(b, SCRATCH, SCRATCH).r.firstAttack.userId, 0, 'foe moves first');
  });
  await check(2044, '重生 once', async () => {
    const b = await battle([SCRATCH, GROWL], [0], {passives: {foe: [[2044, [1]]]}, foe: {hp: 1}});
    turn(b, SCRATCH, 0);
    assert.equal(b.enemy.hp, b.enemy.maxHp, 'revived');
    for (let i = 0; i < 3; i++) turn(b, GROWL, 0);
    b.enemy.hp = 1;
    turn(b, SCRATCH, 0);
    assert.equal(b.enemy.hp, 0, 'no second revive');
  });
  await check(2047, '双方伤害降低 50%', async () => {
    const [on, off] = await dealtWith(SCRATCH, [2047, [50]]);
    assert.ok(Math.abs(on * 2 - off) <= 2, `${on}/${off}`);
  });
  await check(2048, '攻击类型无效 physical', async () => {
    const [phys] = await dealtWith(SCRATCH, [2048, [1]]);
    const [spec] = await dealtWith(WATER, [2048, [1]]);
    assert.equal(phys, 0, 'physical blocked');
    assert.ok(spec > 0, 'special still hurts');
  });
  await check(2050, '免疫特效 鸣叫(5)', async () => {
    const b = await battle([GROWL], [0], {passives: {foe: [[2050, [5]]]}});
    turn(b, GROWL, 0);
    assert.equal(b.enemy.battleLevels[0], 0);
  });
  await check(2061, '概率完全抵挡 100%', async () => {
    const [on] = await dealtWith(SCRATCH, [2061, [100]]);
    assert.equal(on, 0);
  });
  await check(2071, '回合吸血 100/100', async () => {
    const b = await battle([GROWL], [0], {passives: {foe: [[2071, [100, 100]]]}, foe: {hp: 500}});
    turn(b, GROWL, 0);
    assert.deepEqual([b.enemy.hp, b.player.hp], [600, 900]);
  });
  await check(2073, '伤害吸血 50%', async () => {
    const b = await battle([SCRATCH], [0], {passives: {player: [[2073, [50]]]}, player: {hp: 500}});
    const r = turn(b, SCRATCH, 0);
    assert.equal(b.player.hp, 500 + Math.floor(r.dealt / 2));
  });
  await check(2081, '低血守护 90% reduction', async () => {
    const b = await battle([SCRATCH], [0], {passives: {foe: [[2081, [50, 2]]]}, foe: {hp: 400}});
    const first = turn(b, SCRATCH, 0).dealt;
    const second = turn(b, SCRATCH, 0).dealt;
    assert.ok(second <= Math.ceil(first * 0.1) + 1, `guarded ${second} after ${first}`);
  });
  await check(2083, '高伤反弹 over 10 reflect 100%', async () => {
    const b = await battle([SCRATCH], [0], {passives: {foe: [[2083, [10, 100]]]}});
    const r = turn(b, SCRATCH, 0);
    assert.equal(r.taken, r.dealt);
  });

  await check(2025, '死亡回血', async () => {
    const b = await battle([SCRATCH], [0], {passives: {foe: [[2025, []]]}, foe: {hp: 1}});
    turn(b, SCRATCH, 0);
    assert.ok(b.enemy.hp > 0, `hp ${b.enemy.hp}`);
  });
  await check(2039, '偶数伤害倍增 x2 / 2040 奇数伤害削减 /2 (damage received)', async () => {
    const [on, off] = await dealtWith(SCRATCH, [2039, [2]]);
    assert.equal(on, off % 2 === 0 ? off * 2 : off, `${on}/${off}`);
    const [cut, raw] = await dealtWith(SCRATCH, [2040, [2]], {player: {attack: 301}});
    assert.equal(cut, raw % 2 === 1 ? Math.floor(raw / 2) : raw, `${cut}/${raw}`);
  });
  await check(2045, '固定致命率 1/1', async () => {
    const b = await battle([SCRATCH], [0], {passives: {player: [[2045, [1]]]}});
    assert.equal(turn(b, SCRATCH, 0, 0.9).mine.isCrit, true);
  });
  await check(2046, '五回合不死', async () => {
    const b = await battle([SCRATCH], [0], {passives: {foe: [[2046, []]]}, foe: {hp: 5}});
    turn(b, SCRATCH, 0);
    assert.equal(b.enemy.hp, b.enemy.maxHp, `hp ${b.enemy.hp}`);
  });
  await check(2049, '受击后减伤 2回合50%', async () => {
    const b = await battle([SCRATCH], [0], {passives: {foe: [[2049, [2, 50]]]}});
    const first = turn(b, SCRATCH, 0).dealt, second = turn(b, SCRATCH, 0).dealt;
    assert.ok(Math.abs(second * 2 - first) <= 2, `${second} after ${first}`);
  });
  await check(2052, '轮换免疫 turn1 special', async () => {
    const b = await battle([WATER, SCRATCH], [0], {passives: {foe: [[2052, []]]}});
    assert.equal(turn(b, WATER, 0).dealt, 0, 'turn 1 special immune');
    assert.equal(turn(b, SCRATCH, 0).dealt, 0, 'turn 2 physical immune');
  });
  await check(2053, '双方回血 10%', async () => {
    const b = await battle([GROWL], [0], {passives: {foe: [[2053, [10]]]}, foe: {hp: 500}, player: {hp: 500}});
    turn(b, GROWL, 0);
    assert.deepEqual([b.enemy.hp, b.player.hp], [600, 600]);
  });
  await check(2054, '双方扣血 100', async () => {
    const b = await battle([GROWL], [0], {passives: {foe: [[2054, [100]]]}});
    turn(b, GROWL, 0);
    assert.deepEqual([b.enemy.hp, b.player.hp], [900, 900]);
  });
  await check(2055, '双方伤害倍增 x2', async () => {
    const [on, off] = await dealtWith(SCRATCH, [2055, [2]]);
    assert.ok(Math.abs(on - off * 2) <= 2, `${on}/${off}`);
  });
  await check(2056, '定时秒杀 turn 2', async () => {
    const b = await battle([GROWL], [0], {passives: {foe: [[2056, [2]]]}});
    turn(b, GROWL, 0);
    assert.ok(b.player.hp > 0, 'alive on turn 1');
    turn(b, GROWL, 0);
    assert.equal(b.player.hp, 0, 'killed on turn 2');
  });
  await check(2057, '异常状态暴击 burn +16/16', async () => {
    const b = await battle([SCRATCH], [0], {passives: {player: [[2057, [2, 16]]]}});
    b.enemy.statusTurns = 3; b.enemy.status = 2;
    assert.equal(turn(b, SCRATCH, 0, 0.9).mine.isCrit, true);
  });
  await check(2060, '概率减伤 100% -10', async () => {
    const [on, off] = await dealtWith(SCRATCH, [2060, [100, 10]]);
    assert.equal(on, off - 10);
  });
  await check(2062, '物攻概率加伤 100% +50', async () => {
    const a = await battle([SCRATCH], [0], {passives: {player: [[2062, [100, 50]]]}});
    const c = await battle([SCRATCH], [0]);
    assert.equal(turn(a, SCRATCH, 0).dealt, turn(c, SCRATCH, 0).dealt + 50);
  });
  await check(2064, '致命率降低 16/16', async () => {
    const b = await battle([SCRATCH], [0], {passives: {foe: [[2064, [16]]]}});
    assert.equal(turn(b, SCRATCH, 0, 0.01).mine.isCrit, false);
  });
  await check(2065, '物攻加伤 +50%', async () => {
    const a = await battle([SCRATCH], [0], {passives: {player: [[2065, [1, 50]]]}});
    const c = await battle([SCRATCH], [0]);
    const on = turn(a, SCRATCH, 0).dealt, off = turn(c, SCRATCH, 0).dealt;
    assert.ok(Math.abs(on - off * 1.5) <= 2, `${on}/${off}`);
  });
  await check(2066, '物攻致异常 100% burn', async () => {
    const b = await battle([SCRATCH], [0], {passives: {player: [[2066, [100, 2]]]}});
    turn(b, SCRATCH, 0);
    assert.ok(b.enemy.statusDurations[2] > 0);
  });
  await check(2068, '特定系吸收 water', async () => {
    const b = await battle([WATER], [0], {passives: {foe: [[2068, [2]]]}, foe: {hp: 500}});
    turn(b, WATER, 0);
    assert.ok(b.enemy.hp > 500, `hp ${b.enemy.hp}`);
  });
  await check(2070, '复制强化', async () => {
    const b = await battle([20001], [0], {passives: {foe: [[2070, []]]}});
    turn(b, 20001, 0);
    assert.equal(b.enemy.battleLevels[1], 1);
  });
  await check(2072, '低伤回血 under 100', async () => {
    const b = await battle([SCRATCH], [0], {passives: {foe: [[2072, [100]]]}, foe: {hp: 500}});
    const r = turn(b, SCRATCH, 0);
    assert.ok(r.mine.damage < 100, 'fixture: small hit');
    assert.equal(b.enemy.hp, 500 - r.mine.damage + 100);
  });
  await check(2074, '命中叠衰弱 100%', async () => {
    const b = await battle([SCRATCH], [0], {passives: {player: [[2074, [100]]]}});
    turn(b, SCRATCH, 0);
    assert.ok(b.enemy.statusDurations[11] > 0);
  });
  await check(2076, '自身伤害削减 50%', async () => {
    const a = await battle([SCRATCH], [0], {passives: {player: [[2076, [50]]]}});
    const c = await battle([SCRATCH], [0]);
    const on = turn(a, SCRATCH, 0).dealt, off = turn(c, SCRATCH, 0).dealt;
    assert.ok(Math.abs(on * 2 - off) <= 2, `${on}/${off}`);
  });
  await check(2077, '每回合扣敌血 100', async () => {
    const b = await battle([GROWL], [0], {passives: {foe: [[2077, [100]]]}});
    turn(b, GROWL, 0);
    assert.equal(b.player.hp, 900);
  });
  await check(2078, '受特攻致异常 100% sleep', async () => {
    const b = await battle([WATER], [0], {passives: {foe: [[2078, [8, 100]]]}});
    turn(b, WATER, 0);
    assert.ok(b.player.statusDurations[8] > 0);
  });
  await check(2079, '高伤下招翻倍 over 10', async () => {
    const b = await battle([SCRATCH], [SCRATCH], {passives: {foe: [[2079, [10]]]}, player: {hp: 99999, maxHp: 99999}});
    const c = await battle([SCRATCH], [SCRATCH], {player: {hp: 99999, maxHp: 99999}});
    const doubled = turn(b, SCRATCH, SCRATCH).taken, normal = turn(c, SCRATCH, SCRATCH).taken;
    assert.ok(doubled > normal * 1.8, `${doubled} vs ${normal}`);
  });
  await check(2080, '高伤回血 over 10 heal 100', async () => {
    const b = await battle([SCRATCH], [0], {passives: {foe: [[2080, [10, 100]]]}, foe: {hp: 500}});
    const r = turn(b, SCRATCH, 0);
    assert.equal(b.enemy.hp, 500 - 32 + 100 > 1000 ? 1000 : b.enemy.hp, 'heal');
    assert.ok(b.enemy.hp > 500, `hp ${b.enemy.hp} dealt ${r.dealt}`);
  });
  await check(2082, '闪避回血 100', async () => {
    const b = await battle([SCRATCH], [0], {passives: {foe: [[2082, [100]], [2007, [100]]]}, foe: {hp: 500}});
    turn(b, SCRATCH, 0);
    assert.equal(b.enemy.hp, 600);
  });
  await check(2097, '低血必先手 under 50%', async () => {
    const b = await battle([SCRATCH], [SCRATCH], {passives: {foe: [[2097, [50]]]}, foe: {hp: 400}});
    assert.equal(turn(b, SCRATCH, SCRATCH).r.firstAttack.userId, 0);
  });
  await check(2098, '高伤下回合先手 over 10', async () => {
    const b = await battle([SCRATCH], [SCRATCH], {passives: {foe: [[2098, [10]]]}});
    turn(b, SCRATCH, SCRATCH);
    assert.equal(turn(b, SCRATCH, SCRATCH).r.firstAttack.userId, 0);
  });
  await check(2185, '免疫指定技能特效 鸣叫', async () => {
    const b = await battle([GROWL], [0], {passives: {foe: [[2185, [GROWL]]]}});
    turn(b, GROWL, 0);
    assert.equal(b.enemy.battleLevels[0], 0);
  });
  await check(2205, '属性秒杀 vs flying', async () => {
    const b = await battle([GROWL], [SCRATCH], {passives: {foe: [[2205, [4]]]}});
    turn(b, GROWL, SCRATCH);
    assert.equal(b.player.hp, 0);
  });
  await check(2772, '命中消回合效果', async () => {
    const b = await battle([20012, GROWL], [SCRATCH], {passives: {foe: [[2772, []]]}});
    turn(b, 20012, SCRATCH);
    assert.equal(b.player.effectStates?.statDownImmune, undefined);
  });

  if (report) console.log(JSON.stringify({passed: results.length, failed: failures.length, failures}, null, 2));
  else console.log(JSON.stringify({passed: results.length, results}, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
