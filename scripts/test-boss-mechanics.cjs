'use strict';
// Run real boss battles on an isolated runtime copy (no database, no network) and check each mechanic.
// Usage: node scripts/test-boss-mechanics.cjs <runtime app dir with dist/config/node_modules>
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
const {BattleEffectIntegration} = load('GameServer/Game/Battle/BattleEffectIntegration');
const {PassiveEffectRunner, REGISTERED_PASSIVES_KEY} = load('GameServer/Game/Battle/PassiveEffectRunner');
const Puni = load('GameServer/Game/Battle/PuniSealBattle');
const {BattleType} = load('shared/models/BattleModel');

const init = new BattleInitService({Uid: 1});
const turns = new BattleTurnService();
const results = [];
const ok = (name, detail = {}) => results.push({name, ...detail});

function pet(petId, level, skills, stats = {}) {
  const cfg = GameConfig.GetPetById(petId);
  const s = init.CalculateEnemyStats(cfg, level);
  const p = init.BuildBattlePet(petId, cfg.DefName, level, s.hp, s.maxHp, s.attack, s.defence, s.spAtk, s.spDef, s.speed,
    cfg.Type || 0, skills, 1700000000 + petId, 0);
  Object.assign(p, {hp: 5000, maxHp: 5000, speed: 999}, stats);
  return p;
}
function boss(mapId, param2) {
  const cfg = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, param2);
  assert.ok(cfg, `boss ${mapId}/${param2}`);
  return init.BuildBossBattlePet(cfg, GameConfig.GetPetById(cfg.petId));
}
async function battle(player, enemy, bossAt) {
  const b = {userId: 1, player, enemy, turn: 0, isOver: false, startTime: 0, roundCount: 0, lastHitWasCritical: false,
    battleType: bossAt ? BattleType.BOSS : BattleType.PVE};
  if (bossAt) Object.assign(b, {bossMapId: bossAt[0], bossParam2: bossAt[1]});
  if (bossAt) Puni.InitPuniSeal(b);
  await init.TriggerPassiveAbilities(player, enemy);
  BattleEffectIntegration.OnBattleStart(b);
  return b;
}
async function fightBoss(mapId, param2, player) {
  return battle(player, boss(mapId, param2), [mapId, param2]);
}
function withRandom(value, fn) {
  const random = Math.random;
  Math.random = typeof value === 'function' ? value : () => value;
  try { return fn(); } finally { Math.random = random; }
}
function withWeekday(day, fn) {
  const RealDate = Date;
  global.Date = class extends RealDate { getDay() { return day; } };
  try { return fn(); } finally { global.Date = RealDate; }
}
function turn(b, skillId, random = 0.5) {
  const before = {p: b.player.hp, e: b.enemy.hp};
  const r = withRandom(random, () => turns.ExecuteTurn(b, skillId));
  return {r, toBoss: before.e - b.enemy.hp, toPlayer: before.p - b.player.hp};
}
const passives = p => (p.effectCounters?.[REGISTERED_PASSIVES_KEY] || []).map(x => x.effectId);
// A slow, harmless enemy-side check: freeze the boss so only the player's move matters.
const stun = b => { b.enemy.statusTurns = 99; b.enemy.status = 8; };

(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());
  await ConfigRegistry.Instance.Initialize();
  await SkillEffectsConfig.Instance.Load();
  BossAbilityConfig.Instance.Load();

  // Every configured boss builds, and every ability it lists resolves to a passive.
  const all = BossAbilityConfig.Instance.GetAllSPTBosses().length;
  for (const cfg of require(path.join(app, 'config/data/json/boss_abilities.json')).bossConfigs) {
    for (const day of [0, 1, 2, 3, 4, 5, 6]) {
      const p = withWeekday(day, () => boss(cfg.mapId, cfg.param2));
      for (const entry of p.bossAbilityEntries)
        assert.ok(PassiveEffectRunner.BuildPassiveFromConfig(entry.id, entry.args), `${cfg.petName} ability ${entry.id}`);
      assert.ok(p.skills.every(id => GameConfig.GetSkillById(id)), `${cfg.petName} skill missing`);
    }
  }
  ok('All boss entries build with resolvable abilities and skills', {sptBosses: all});

  // 同生共死 (HP difference) is blocked on immune bosses but still works where the classic game allowed it.
  for (const [map, param2] of [[57, 0], [348, 2], [32, 0], [314, 0], [348, 0], [348, 1], [419, 0]]) {
    const b = await fightBoss(map, param2, pet(139, 50, [10036], {hp: 10, maxHp: 10}));
    stun(b);
    assert.equal(turn(b, 10036).toBoss, 0, `同生共死 on ${map}/${param2}`);
  }
  {
    const b = await fightBoss(49, 0, pet(139, 50, [10036], {hp: 10, maxHp: 10}));
    stun(b);
    assert.ok(turn(b, 10036).toBoss > 1000, '同生共死 should still work on 雷纳多');
  }
  ok('同生共死 immune on 哈莫雷特/雷伊/尤纳斯/塔克林/塔西亚/盖亚, effective on 雷纳多');

  // 哈莫雷特: water -> fire -> grass; wrong types do nothing; a missed correct-type attack still uses the slot.
  {
    const b = await fightBoss(57, 0, pet(7, 100, [10001, 10326, 10098, 10016, 10025]));
    stun(b);
    assert.equal(turn(b, 10001).toBoss, 0, 'normal attack');
    assert.equal(turn(b, 10098).toBoss, 0, 'fire before water');
    assert.ok(turn(b, 10326).toBoss > 0, 'water first');
    assert.equal(turn(b, 10326).toBoss, 0, 'water twice');
    assert.ok(turn(b, 10098).toBoss > 0, 'fire second');
    const grass = GameConfig.GetSkillById(10016);
    assert.equal(grass.Type, 1, 'grass fixture');
    assert.ok(turn(b, 10016).toBoss > 0, 'grass third');
    const miss = turn(b, 10025, 0.999);
    assert.equal(miss.r.firstAttack.missed, true, 'water miss fixture');
    assert.ok(turn(b, 10098).toBoss > 0, 'missed water still advances to fire');
  }
  ok('哈莫雷特 water/fire/grass order, misses consume the step');

  // Status immunity now blocks the inflicting atom itself; partial lists only block the listed statuses.
  {
    const b = await fightBoss(57, 0, pet(7, 100, [20020, 20048]));
    stun(b); b.enemy.status = -1; b.enemy.statusDurations.fill(0);
    turn(b, 20020);
    assert.equal(b.enemy.statusDurations[1], 0, '哈莫雷特 poisoned');
    const y = await fightBoss(314, 0, pet(7, 100, [20020]));
    turn(y, 20020);
    assert.equal(y.enemy.statusDurations[1], 0, '尤纳斯 poisoned');
    const r = await fightBoss(49, 0, pet(7, 100, [20020]));
    turn(r, 20020);
    assert.ok(r.enemy.statusDurations[1] > 0, '雷纳多 should be poisoned');
  }
  ok('Status immunity holds for immune bosses only');

  // 塔西亚 ignores stat drops; 雷纳多 does not.
  {
    const b = await fightBoss(348, 1, pet(7, 100, [20082]));
    turn(b, 20082);
    assert.equal(b.enemy.battleLevels[5], 0, '塔西亚 accuracy dropped');
    const r = await fightBoss(49, 0, pet(7, 100, [20082]));
    turn(r, 20082);
    assert.ok(r.enemy.battleLevels[5] < 0, '雷纳多 accuracy should drop');
    assert.equal(b.enemy.battleLevels[2], 2, '塔西亚 starts with Sp.Atk +2');
  }
  ok('Stat-down immunity and starting stages');

  // 尤纳斯: no damage until 贯穿水枪, then only 里奥斯's 幻影 can take the last HP; DoT cannot kill.
  {
    const b = await fightBoss(314, 0, pet(110, 100, [10001, 10323, 10100]));
    stun(b);
    assert.equal(turn(b, 10001).toBoss, 0, 'shield before break');
    assert.ok(turn(b, 10323).toBoss > 0, '贯穿水枪 breaks and hits');
    assert.ok(turn(b, 10001).toBoss > 0, 'attacks hit after break');
    b.enemy.hp = 30;
    turn(b, 10100);
    assert.equal(b.enemy.hp, 1, '幻影 from another pet only leaves 1 HP');
    b.enemy.statusTurns = 3; b.enemy.status = -1; b.enemy.statusDurations[1] = 3;
    turn(b, 10001);
    assert.equal(b.enemy.hp, 1, 'poison tick at 1 HP');
    const leo = await fightBoss(314, 0, pet(42, 100, [10323, 10100]));
    stun(leo);
    turn(leo, 10323);
    leo.enemy.hp = 30;
    const kill = turn(leo, 10100);
    assert.equal(leo.enemy.hp, 0, '里奥斯 幻影 finishes');
    assert.equal(kill.r.isOver, true);
  }
  ok('尤纳斯 shield, finisher and 1 HP floor');

  // 提亚斯 dodges 40%; self-target moves are never dodged.
  {
    const b = await fightBoss(27, 0, pet(7, 100, [10001]));
    stun(b);
    assert.equal(turn(b, 10001, 0.1).r.firstAttack.missed, true, 'dodge at 10%');
    assert.equal(turn(b, 10001, 0.5).r.firstAttack.missed, false, 'hit at 50%');
  }
  ok('提亚斯 dodge 40%');

  // Priority: 雷伊 moves first against a much faster pet; a wild 雷伊 does not.
  {
    const b = await fightBoss(32, 0, pet(7, 100, [10001], {speed: 9999}));
    assert.equal(turn(b, 10001).r.firstAttack.userId, 0, 'boss 雷伊 first');
    assert.equal(b.enemy.maxHp, 2800);
    const wild = await battle(pet(7, 100, [10001], {speed: 9999}), pet(70, 70, [10001], {speed: 1}));
    assert.equal(turn(wild, 10001).r.firstAttack.userId, 1, 'wild 雷伊 has no boss priority');
    assert.deepEqual(passives(wild.enemy), []);
  }
  ok('Boss-only priority, wild same species unaffected');

  // Player-owned boss species never inherit boss rules.
  {
    const own = await battle(pet(216, 80, [10001]), pet(1, 100, [10001], {speed: 1}));
    assert.ok(turn(own, 10001).toPlayer > 0, 'own 哈莫雷特 takes damage');
    const lion = await battle(pet(187, 50, [10001]), pet(1, 10, [10001]));
    assert.deepEqual(passives(lion.player), [], 'own 魔狮迪露 passives');
  }
  ok('Player-owned 哈莫雷特/魔狮迪露 have no boss rules');

  // 纳多雷 takes 40% less; 魔狮迪露 ignores type effectiveness.
  {
    const n = await fightBoss(106, 0, pet(7, 100, [10001]));
    stun(n);
    const reduced = turn(n, 10001).toBoss;
    n.enemy.bossMechanics = {};
    n.enemy.hp = n.enemy.maxHp;
    const full = turn(n, 10001).toBoss;
    assert.ok(Math.abs(reduced / full - 0.6) < 0.05, `纳多雷 ratio ${reduced}/${full}`);
    const lion = await fightBoss(53, 1, pet(7, 100, [10364]));
    const fighting = GameConfig.GetSkillById(10364);
    stun(lion);
    const neutral = turn(lion, 10364).toBoss;
    lion.enemy.bossMechanics = {};
    const normal = turn(lion, 10364).toBoss;
    assert.ok(Math.abs(neutral / normal - 0.5) < 0.05, `魔狮迪露 ${fighting?.Name} ${neutral}/${normal}`);
  }
  ok('纳多雷 damage -40%, 魔狮迪露 type neutral');

  // Finite boss PP runs out (哈莫雷特 55 PP), infinite PP bosses keep acting.
  {
    const b = await fightBoss(57, 0, pet(7, 100, [20269], {hp: 999999, maxHp: 999999}));
    let acted = 0;
    for (let i = 0; i < 70; i++) if (turn(b, 20269).r.secondAttack?.skillId) acted++;
    assert.equal(acted, 55, `哈莫雷特 actions ${acted}`);
    assert.ok(b.enemy.skillPP.every(pp => pp === 0));
    const asleep = await fightBoss(57, 0, pet(7, 100, [20269], {hp: 999999, maxHp: 999999}));
    stun(asleep);
    const before = asleep.enemy.skillPP.reduce((sum, pp) => sum + pp, 0);
    for (let i = 0; i < 5; i++) turn(asleep, 20269);
    assert.equal(asleep.enemy.skillPP.reduce((sum, pp) => sum + pp, 0), before, 'sleeping boss keeps PP');
    const r = await fightBoss(32, 0, pet(7, 100, [20269], {hp: 999999, maxHp: 999999, speed: 1}));
    for (let i = 0; i < 40; i++) turn(r, 20269);
    assert.ok(r.enemy.skillPP.some(pp => pp > 0), '雷伊 PP infinite');
  }
  ok('Boss PP depletes unless PP is infinite');

  // Puni seals.
  {
    const v = await fightBoss(514, 1, pet(216, 100, [10001, 10622]));
    stun(v);
    assert.equal(turn(v, 10001).r.firstAttack.missed, true, '虚无: normal skill misses');
    assert.equal(turn(v, 10622).r.firstAttack.missed, false, '虚无: must-hit lands');
    assert.equal(v.enemy.battleLevels[0], 2, '虚无 attack +2');

    const e = await fightBoss(514, 2, pet(139, 100, [10001, 10036], {hp: 10}));
    stun(e);
    assert.equal(turn(e, 10001).toBoss, 0, '元素: normal type blocked');
    assert.equal(turn(e, 10036).toBoss, 0, '元素: 同生共死 blocked');

    const en = await fightBoss(514, 3, pet(7, 100, [10001], {attack: 5000}));
    stun(en);
    const hit = turn(en, 10001);
    assert.ok(hit.toBoss > 500 && en.player.hp === 0, '能量: >500 damage kills the attacker');

    const life = await fightBoss(514, 4, pet(7, 100, [20266]));
    stun(life);
    life.enemy.hp = 1000;
    turn(life, 20266);
    assert.equal(life.enemy.hp, 3000, '生命: +2000 per turn');

    const cycle = await fightBoss(514, 5, pet(7, 100, [10001, 20269]));
    stun(cycle);
    for (let i = 0; i < 3; i++) turn(cycle, 20269);
    cycle.enemy.skillPP.fill(0);
    cycle.enemy.hp = 1;
    turn(cycle, 10001);
    assert.equal(cycle.enemy.hp, cycle.enemy.maxHp, '轮回: second bar survives turn counters');
    assert.ok(cycle.enemy.skillPP.every(pp => pp > 0), '轮回: second bar restores PP');
    turn(cycle, 20269);
    cycle.enemy.hp = 1;
    assert.equal(turn(cycle, 10001).r.isOver, true, '轮回: second kill ends');

    const holy = await fightBoss(514, 7, pet(7, 100, [10001, 20020, 10034]));
    stun(holy); holy.enemy.status = -1; holy.enemy.statusDurations.fill(0);
    assert.equal(turn(holy, 10001).toBoss, 0, '圣洁: direct damage');
    turn(holy, 20020);
    assert.equal(holy.enemy.statusDurations[1], 0, '圣洁: status move poison blocked');
    turn(holy, 10034, 0.1);
    assert.ok(holy.enemy.statusDurations[2] > 0, '圣洁: burn from an attack applies');
    const before = holy.enemy.hp;
    turn(holy, 20020);
    assert.ok(holy.enemy.hp < before, '圣洁: burn damage lands');

    const tf = await fightBoss(514, 8, pet(7, 100, [10001]));
    stun(tf); tf.enemy.status = -1; tf.enemy.statusDurations.fill(0);
    tf.enemy.hp = 100;
    tf.enemy.statusTurns = 3; tf.enemy.status = 1;
    turn(tf, 10001);
    assert.equal(tf.enemy.maxHp, 8000, '真身: poison kill moves to the second life');
    turn(tf, 10001); turn(tf, 10001);
    tf.enemy.hp = 1;
    turn(tf, 10001);
    assert.equal(tf.enemy.maxHp, 9000, '真身: third life after later turns');
  }
  ok('Puni seals: 虚无/元素/能量/生命/轮回/圣洁/真身');

  // 圣灵魔闪光 is a 160-power attack plus 1/8 of the target's max HP, not 50x max HP.
  {
    const b = await fightBoss(514, 2, pet(7, 100, [20269], {hp: 8000, maxHp: 8000, speed: 1}));
    b.enemy.skillPP = b.enemy.skills.map(id => id === 11000 ? 5 : 0);
    const hit = turn(b, 20269).toPlayer;
    assert.ok(hit > 1000 && hit < 8000, `圣灵魔闪光 damage ${hit}`);
  }
  ok('圣灵魔闪光 deals attack damage plus 1/8 max HP');

  // 阿克诺亚 has exactly one extra life, even when turns pass in between.
  {
    const b = await fightBoss(110, 1050, pet(7, 100, [10001, 20269]));
    stun(b);
    b.enemy.hp = 1;
    turn(b, 10001);
    assert.equal(b.enemy.hp, b.enemy.maxHp, '阿克诺亚 second life');
    for (let i = 0; i < 3; i++) turn(b, 20269);
    b.enemy.hp = 1;
    assert.equal(turn(b, 10001).r.isOver, true, '阿克诺亚 no third life');
  }
  ok('阿克诺亚 two lives');

  // 厄尔塞拉 weekday rules.
  {
    const thu = await withWeekday(4, () => fightBoss(61, 0, pet(7, 100, [20266])));
    stun(thu);
    thu.enemy.hp = 1000;
    turn(thu, 20266);
    assert.equal(thu.enemy.hp, 2000, 'Thursday +1000');
    const fri = await withWeekday(5, () => fightBoss(61, 0, pet(7, 100, [10001], {attack: 5000})));
    stun(fri); fri.enemy.status = -1; fri.enemy.statusDurations.fill(0);
    fri.enemy.hp = 10;
    turn(fri, 10001);
    assert.equal(fri.enemy.hp, fri.enemy.maxHp, 'Friday revives without status');
    const wed = await withWeekday(3, () => fightBoss(61, 0, pet(7, 100, [10001], {attack: 3000})));
    stun(wed);
    assert.ok(turn(wed, 10001).toPlayer > 150, 'Wednesday reflects big hits');
  }
  ok('厄尔塞拉 weekday rules (Wed reflect, Thu heal, Fri revive)');

  // Other passives now attached only to their bosses.
  {
    const sev = await fightBoss(348, 3, pet(7, 100, [10001]));
    stun(sev);
    sev.enemy.hp = 210;
    turn(sev, 10001);
    assert.equal(sev.enemy.hp, sev.enemy.maxHp, '塞维尔 heals below 200');
    const tas = await fightBoss(348, 1, pet(7, 100, [10001]));
    stun(tas);
    turn(tas, 10001, 0.1);
    assert.ok(tas.player.statusDurations[6] > 0, '塔西亚 physical hit causes fear');
    const ar = await fightBoss(430, 0, pet(7, 100, [20266]));
    stun(ar);
    assert.ok(turn(ar, 20266).toPlayer >= 100, '亚伦斯 drains 100');
    const lion = await fightBoss(53, 1, pet(7, 100, [20266]));
    lion.enemy.hp = 1000000;
    turn(lion, 20266);
    assert.equal(lion.player.hp, 0, '魔狮迪露 OHKO below half');
  }
  ok('塞维尔 heal, 塔西亚 fear, 亚伦斯 drain, 魔狮迪露 OHKO');

  console.log(JSON.stringify({passed: results.length, results}, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
