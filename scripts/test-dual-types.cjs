'use strict';
// Dual-type effectiveness and same-type bonus on an isolated runtime copy (client type table, 4399 split formula).
// Usage: node scripts/test-dual-types.cjs <runtime app dir with dist/config/node_modules>
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
const {ElementSystem: E} = load('GameServer/Game/Battle/ElementSystem');
const {BattleAlgorithm} = load('GameServer/Game/Battle/BattleAlgorithm');
const results = [];
const ok = name => results.push(name);

(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());
  await ConfigRegistry.Instance.Initialize();

  // 客户端属性表：21–127为双属性，221–226为王、混沌、神灵、轮回、虫、虚空
  assert.deepEqual(E.Components(8), [8]);
  assert.deepEqual(E.Components(21), [1, 10], '21 草超能');
  assert.deepEqual(E.Components(26), [2, 15], '26 水龙');
  assert.deepEqual(E.Components(27), [3, 4], '27 火飞行');
  assert.deepEqual(E.Components(46), [10, 9], '46 超能冰');
  assert.deepEqual(E.Components(89), [22, 16], '89 混沌圣灵');
  assert.deepEqual(E.Components(221), [21], '221 王');
  ok('Client type table resolves');

  // 4399拆分公式：都克制×4，其中一项无效为两者之和÷4，其余为两者之和÷2
  const cases = [
    [2, 27, 1.5, '水打火飞：(2+1)/2'],
    [5, 27, 1.5, '电打火飞：(1+2)/2'],
    [7, 27, 0.5, '地面打火飞：地面对飞行无效，(2+0)/4'],
    [27, 1, 4, '火飞打草：都克制'],
    [1, 22, 1, '草打草战斗：以前按混沌算成0.5'],
    [2, 3, 2, '单属性不变'],
    [7, 4, 0, '地面打飞行仍无效'],
  ];
  for (const [atk, def, expected, label] of cases) assert.equal(E.GetEffectiveness(atk, def), expected, label);
  assert.equal(BattleAlgorithm.GetTypeEffectiveness(2, 27), 1.5, 'damage path uses dual types');
  ok('Dual effectiveness follows the split formula');

  // 本系：相同属性，或双属性精灵用其中一个属性的单属性技能
  assert.equal(E.GetSTABMultiplier(27, undefined, 3, undefined), 1.5, '火飞精灵用火系技能');
  assert.equal(E.GetSTABMultiplier(27, undefined, 27, undefined), 1.5, '火飞精灵用火飞技能');
  assert.equal(E.GetSTABMultiplier(27, undefined, 2, undefined), 1, '火飞精灵用水系技能');
  assert.equal(E.GetSTABMultiplier(3, undefined, 27, undefined), 1, '火系精灵用火飞技能');
  assert.equal(E.GetSTABMultiplier(3, undefined, 3, undefined), 1.5, '单属性不变');
  ok('Same-type bonus for dual-type pets');

  // 伤害：同样的水系特攻，打火飞是打普通系的1.5倍（攻击方普通系，无本系加成）
  const hit = defType => {
    const random = Math.random;
    Math.random = () => 0.5;
    try {
      const stats = {attack: 300, defence: 300, spAtk: 300, spDef: 300};
      return BattleAlgorithm.CalculateDamage(stats, stats, 8, defType, 100, 100, 2, 2, [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], {isCrit: false}).damage;
    } finally { Math.random = random; }
  };
  const neutral = hit(8), dual = hit(27);
  assert.ok(Math.abs(dual - neutral * 1.5) <= 1, `水打火飞 ${dual} vs ${neutral}`);
  ok('Damage uses the dual multiplier');

  console.log(JSON.stringify({passed: results.length, results}, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
