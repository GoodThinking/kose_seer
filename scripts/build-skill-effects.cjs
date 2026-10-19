'use strict';
// Build the classic skill-effect release from a captured live app (already carrying the boss-mechanics
// release): add SkillEffectRuntime, refresh BossSpecialRules, and hook the battle flow (dist + TS mirror).
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {parseArgs} = require('node:util');
const {values: v} = parseArgs({options: Object.fromEntries(['context', 'baseline', 'out'].map(n => [n, {type: 'string'}]))});
for (const n of ['context', 'baseline', 'out']) if (!v[n]) throw Error('Missing --' + n);
const baseline = path.resolve(v.baseline), out = path.resolve(v.out), root = path.resolve(__dirname, '..');
const ts = require(path.join(path.resolve(v.context), 'node_modules/typescript'));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const files = [];

function put(rel, bytes) {
  const src = path.join(baseline, rel), dst = path.join(out, rel);
  fs.mkdirSync(path.dirname(dst), {recursive: true});
  fs.writeFileSync(dst, bytes);
  files.push({path: rel, before: fs.existsSync(src) ? sha(fs.readFileSync(src)) : null, after: sha(Buffer.from(bytes))});
}
function blankMap(rel) {
  const mapRel = rel + '.map';
  if (!fs.existsSync(path.join(baseline, mapRel))) return;
  const map = JSON.parse(fs.readFileSync(path.join(baseline, mapRel), 'utf8'));
  map.mappings = '';
  put(mapRel, JSON.stringify(map));
}
const indentOf = (text, pos) => /^[ \t]*/.exec(text.slice(text.lastIndexOf('\n', pos - 1) + 1))[0];
function patch(rel, visitor, expected) {
  const text = fs.readFileSync(path.join(baseline, rel), 'utf8');
  const ast = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true);
  const edits = [];
  (function walk(n) { visitor(n, ast, edits, text); ts.forEachChild(n, walk); })(ast);
  const counts = {};
  for (const e of edits) counts[e.tag] = (counts[e.tag] || 0) + 1;
  assert.deepEqual(counts, expected, `${rel}: unexpected edit points`);
  let result = text;
  for (const e of edits.sort((a, b) => b.start - a.start)) result = result.slice(0, e.start) + e.text + result.slice(e.end);
  const check = ts.createSourceFile(rel, result, ts.ScriptTarget.Latest, true);
  if (check.parseDiagnostics.length) throw Error('Syntax: ' + rel + ' ' + check.parseDiagnostics[0].messageText);
  put(rel, result);
  if (rel.endsWith('.js')) blankMap(rel);
}
const name = (n, a) => n.name ? n.name.getText(a) : '';
const inMethod = (n, a, cls, method) => {
  let p = n;
  while (p && !(ts.isMethodDeclaration(p) && name(p, a) === method)) p = p.parent;
  if (!p) return false;
  while (p && !ts.isClassDeclaration(p)) p = p.parent;
  return !!p && name(p, a) === cls;
};
const after = (edits, node, text, a, tag, body) => {
  const indent = indentOf(text, node.getStart(a));
  edits.push({start: node.end, end: node.end, text: body.split('\n').map(l => '\n' + indent + l).join(''), tag});
};
const remove = (edits, node, tag) => edits.push({start: node.getFullStart(), end: node.end, text: '', tag});

for (const [dir, ext] of [['src', '.ts'], ['dist', '.js']]) {
  const js = ext === '.js';
  const R = js ? 'SkillEffectRuntime_1.SkillEffectRuntime' : 'SkillEffectRuntime';
  const B = js ? 'BossSpecialRules_1.BossSpecialRules' : 'BossSpecialRules';
  const CORE = js ? 'BattleCore_1.BattleCore' : 'BattleCore';
  const TYPE = js ? 'BattleStatusType' : 'BattleStatusType';
  const base = `app/${dir}/GameServer/Game/Battle/`;

  patch(base + 'BattleTurnExecutor' + ext, (n, a, e, t) => {
    if (js && ts.isVariableStatement(n) && n.getText(a) === 'const BossSpecialRules_1 = require("./BossSpecialRules");')
      after(e, n, t, a, 'import', 'const SkillEffectRuntime_1 = require("./SkillEffectRuntime");');
    if (!js && ts.isImportDeclaration(n) && n.getText(a) === "import { BossSpecialRules } from './BossSpecialRules';")
      after(e, n, t, a, 'import', "import { SkillEffectRuntime } from './SkillEffectRuntime';");
    // 行动判定改到各自出手时进行：先手施加的控制类异常当回合即令后手无法行动
    if (ts.isVariableDeclaration(n) && ['pet1CanAct', 'pet2CanAct'].includes(name(n, a))) {
      const [pet, skill] = name(n, a) === 'pet1CanAct' ? ['battle.player', 'pet1Skill'] : ['battle.enemy', 'pet2Skill'];
      e.push({start: n.initializer.getStart(a), end: n.initializer.end, tag: 'lazyAct',
        text: `() => ${R}.CanAct(battle, ${pet}, ${skill}) ?? (${n.initializer.getText(a)})`});
    }
    if (ts.isIdentifier(n) && ['pet1CanAct', 'pet2CanAct'].includes(n.text) && ts.isCallExpression(n.parent) &&
        n.parent.expression.getText(a).endsWith('ExecuteAttack'))
      e.push({start: n.getStart(a), end: n.end, text: n.text + '()', tag: 'callAct'});
    if (ts.isPropertyAssignment(n) && ['pet1PriorityMod', 'pet2PriorityMod'].includes(name(n, a))) {
      const [pet, skill] = name(n, a) === 'pet1PriorityMod' ? ['battle.player', 'pet1Skill'] : ['battle.enemy', 'pet2Skill'];
      e.push({start: n.initializer.end, end: n.initializer.end, text: ` + ${R}.Priority(${pet}, ${skill})`, tag: 'priority'});
    }
    if (ts.isVariableStatement(n) && n.declarationList.declarations[0].name.getText(a) === 'turnStartResults')
      after(e, n, t, a, 'entry', `${R}.OnEntry(battle);`);
    if (ts.isExpressionStatement(n) && n.getText(a) === `${B}.OnTurnEnd(battle);`)
      after(e, n, t, a, 'turnEnd', `${R}.TurnEnd(battle);`);
    if (ts.isVariableDeclaration(n) && name(n, a) === 'hit' && inMethod(n, a, 'BattleTurnExecutor', 'ExecuteAttack'))
      e.push({start: n.initializer.getStart(a), end: n.initializer.end, tag: 'hit',
        text: `${R}.ResolveHit(battle, attacker, defender, skill, isFirst, () => ${n.initializer.getText(a)})`});
    if (ts.isExpressionStatement(n) && n.getText(a) === `${B}.OnAttackMissed(defender, skill);`)
      after(e, n, t, a, 'miss', `${R}.OnMiss(battle, attacker, defender, skill);`);
    // 未命中的技能不再触发“使用技能后”的特效（原代码会让落空的鸣叫等照样降能力）；落空类效果由运行时处理
    if (ts.isVariableStatement(n) && n.declarationList.declarations[0].name.getText(a) === 'missEffects') {
      const next = n.parent.statements[n.parent.statements.indexOf(n) + 1];
      assert.ok(ts.isExpressionStatement(next) && next.getText(a).includes('ApplyEffectResults(missEffects'), 'Unknown miss effect block');
      e.push({start: n.getFullStart(), end: n.end, tag: 'missEffects',
        text: `\n${indentOf(t, n.getStart(a))}// 未命中的技能不触发技能特效（落空类效果由技能效果运行时处理）`});
      remove(e, next, 'missEffects');
    }
    if (ts.isExpressionStatement(n) && /^isCrit = .*CheckCrit\(attacker, defender, skill, isFirst\);$/.test(n.getText(a)))
      e.push({start: n.expression.right.getStart(a), end: n.expression.right.end, tag: 'crit',
        text: `${R}.Crit(battle, attacker, defender, skill, () => ${n.expression.right.getText(a)})`});
    if (ts.isIfStatement(n) && n.getText(a).startsWith("if (typeof powerResult?.value === 'number')"))
      after(e, n, t, a, 'power', `skillPower = ${R}.Power(attacker, defender, skill, skillPower);`);
    if (ts.isCallExpression(n) && n.expression.getText(a) === `${B}.ModifyDamageToBoss`) {
      const kind = n.arguments[5].getText(a);
      e.push({start: n.arguments[4].getStart(a), end: n.arguments[4].end, tag: 'damage',
        text: `${R}.Damage(battle, attacker, defender, skill, damage, ${kind}, isFirst)`});
    }
    if (ts.isExpressionStatement(n) && n.getText(a) === `${B}.AfterBossDamaged(battle, attacker, defender, skill, actualDamage);`)
      after(e, n, t, a, 'after', `${R}.AfterAttack(battle, attacker, defender, skill, actualDamage, isFirst);`);
    // 原代码在攻击方出手时清除攻击方自己的睡眠；睡眠改为被攻击技能命中后解除（在运行时处理）
    if (ts.isVariableStatement(n) && n.getText(a) === 'const attackerStatusDurations = attacker.statusDurations || [];' &&
        inMethod(n, a, 'BattleTurnExecutor', 'ExecuteAttack')) {
      const next = n.parent.statements[n.parent.statements.indexOf(n) + 1];
      assert.ok(ts.isIfStatement(next) && next.expression.getText(a).includes('SLEEP'), 'Unknown sleep block');
      remove(e, n, 'sleep');
      remove(e, next, 'sleep');
    }
    if (ts.isPropertyAssignment(n) && name(n, a) === 'atkTimes' && n.initializer.getText(a) === 'multiHitCount')
      e.push({start: n.initializer.getStart(a), end: n.initializer.end, text: `${R}.AtkTimes(attacker, multiHitCount)`, tag: 'atkTimes'});
  }, {import: 1, lazyAct: 2, callAct: 4, priority: 2, entry: 1, turnEnd: 1, hit: 1, miss: 1, missEffects: 2, crit: 1, power: 1,
      damage: 3, after: 1, sleep: 2, atkTimes: 1});

  patch(base + 'BattleCore' + ext, (n, a, e, t) => {
    if (ts.isIfStatement(n) && n.expression.getText(a) === 'pet.fatigueTurns && pet.fatigueTurns > 0' && inMethod(n, a, 'BattleCore', 'CanAct'))
      after(e, n, t, a, 'fatigue', [
        `// 疲惫（异常7）无法行动`,
        `if (pet.statusDurations[${TYPE}.FATIGUE] > 0) {`,
        `${js ? '    ' : '  '}pet.statusDurations[${TYPE}.FATIGUE]--;`,
        `${js ? '    ' : '  '}return { canAct: false, reason: "fatigue" };`,
        `}`].join('\n'));
    // 混乱不是控制类异常：命中率降低80%（命中判定中处理），不应令精灵无法行动
    if (ts.isIfStatement(n) && n.expression.getText(a) === `pet.statusDurations[${TYPE}.CONFUSION] > 0` && inMethod(n, a, 'BattleCore', 'CanAct'))
      remove(e, n, 'confusion');
    // 混乱时命中率降低80%：满命中技能也不能跳过命中计算
    if (ts.isIfStatement(n) && n.expression.getText(a).startsWith('accuracy >= 100') && inMethod(n, a, 'BattleCore', 'CheckHit')) {
      e.push({start: n.getStart(a), end: n.getStart(a), tag: 'confusionHit', text: `// 混乱时命中率降低80%，满命中技能也要计算命中\n${indentOf(t, n.getStart(a))}`});
      e.push({start: n.expression.getStart(a), end: n.expression.end, tag: 'confusionHit',
        text: `${n.expression.getText(a)} && !(((attacker.statusDurations || [])[${TYPE}.CONFUSION] || 0) > 0)`});
    }
    if (ts.isExpressionStatement(n) && n.getText(a) === 'statusDamage += Math.floor(pet.maxHp / 16);' && inMethod(n, a, 'BattleCore', 'ProcessStatusEffects')) {
      let p = n.parent;
      while (p && !ts.isIfStatement(p)) p = p.parent;
      if (p.expression.getText(a).includes('FREEZE'))
        e.push({start: n.getStart(a), end: n.end, text: 'statusDamage += Math.floor(pet.maxHp / 8);', tag: 'freeze'});
    }
  }, {fatigue: 1, confusion: 1, confusionHit: 2, freeze: 1});

  patch(base + 'BattleEffectIntegration' + ext, (n, a, e, t) => {
    // 中毒、烧伤、冻伤等扣血改在回合结束时结算
    if (ts.isExpressionStatement(n) && /^this\.ApplyTurnStartStatusDamage\(battle\.(player|enemy)\);$/.test(n.getText(a)) &&
        inMethod(n, a, 'BattleEffectIntegration', 'OnTurnStart'))
      remove(e, n, 'turnStartDot');
    if (ts.isMethodDeclaration(n) && name(n, a) === 'OnTurnEnd') {
      const first = n.body.statements[0];
      const indent = indentOf(t, first.getStart(a));
      e.push({start: first.getFullStart(), end: first.getFullStart(), tag: 'turnEndDot',
        text: `\n${indent}// 异常状态扣血（回合结束时）\n${indent}this.ApplyTurnStartStatusDamage(battle.player);\n${indent}this.ApplyTurnStartStatusDamage(battle.enemy);`});
    }
    if (ts.isNewExpression(n) && n.expression.getText(a) === 'Set' && n.parent && ts.isVariableDeclaration(n.parent) &&
        name(n.parent, a) === 'coreManagedStatuses') {
      const list = n.arguments[0];
      const last = list.elements[list.elements.length - 1];
      e.push({start: last.end, end: last.end, tag: 'fatigueManaged', text: `,\n${indentOf(t, last.getStart(a))}${js ? 'BattleCore_1.' : ''}BattleStatusType.FATIGUE`});
    }
  }, {turnStartDot: 2, turnEndDot: 1, fatigueManaged: 1});

  patch(base + 'EffectTrigger' + ext, (n, a, e, t) => {
    if (js && ts.isVariableStatement(n) && n.getText(a) === 'const EffectApplicator_1 = require("./EffectApplicator");')
      after(e, n, t, a, 'import', 'const SkillEffectRuntime_1 = require("./SkillEffectRuntime");');
    if (!js && ts.isImportDeclaration(n) && n.getText(a) === "import { EffectApplicator } from './EffectApplicator';")
      after(e, n, t, a, 'import', "import { SkillEffectRuntime } from './SkillEffectRuntime';");
    // 由运行时实现的效果不再走原子效果；多效果技能按官方参数个数切分参数
    if (ts.isVariableStatement(n) && n.declarationList.declarations[0].name.getText(a) === 'effectId' &&
        inMethod(n, a, 'EffectTrigger', 'TriggerSingleSkillEffect'))
      after(e, n, t, a, 'single', [`if (${R}.Handles(effectId, skill))`, `${js ? '    ' : '  '}return [];`].join('\n'));
    if (ts.isVariableStatement(n) && n.declarationList.declarations[0].name.getText(a) === 'effectId' &&
        inMethod(n, a, 'EffectTrigger', 'TriggerMultipleSkillEffects')) {
      after(e, n, t, a, 'multi', [`if (${R}.Handles(effectId, skill)) {`, `${js ? '    ' : '  '}argOffset += ${R}.ArgCount(effectId) ?? 0;`,
        `${js ? '    ' : '  '}continue;`, `}`].join('\n'));
    }
    if (ts.isIfStatement(n) && n.expression.getText(a) === '!effectConfig' && inMethod(n, a, 'EffectTrigger', 'TriggerMultipleSkillEffects')) {
      const block = n.thenStatement;
      const cont = block.statements[block.statements.length - 1];
      assert.ok(ts.isContinueStatement(cont), 'Unknown missing-config branch');
      e.push({start: cont.getStart(a), end: cont.getStart(a), tag: 'missingOffset', text: `argOffset += ${R}.ArgCount(effectId) ?? 0;\n${indentOf(t, cont.getStart(a))}`});
    }
    if (ts.isVariableDeclaration(n) && name(n, a) === 'argsNum' && inMethod(n, a, 'EffectTrigger', 'TriggerMultipleSkillEffects'))
      e.push({start: n.initializer.getStart(a), end: n.initializer.end, tag: 'argsNum', text: `${R}.ArgCount(effectId) ?? (${n.initializer.getText(a)})`});
  }, {import: 1, single: 1, multi: 1, missingOffset: 1, argsNum: 1});

  patch(base + 'effects/atomic/core/ConditionalCheck' + ext, (n, a, e, t) => {
    // 概率条件读技能参数里的概率（参数映射写在 probability 上），没有时才用配置默认值
    if (ts.isCaseClause(n) && n.expression.getText(a).endsWith('ConditionType.PROBABILITY')) {
      const ret = n.statements[0];
      assert.ok(ts.isReturnStatement(ret) && /checkProbability\(this\.params\.value( as number)? \|\| 50\)/.test(ret.getText(a)), 'Unknown probability branch');
      const arg = ret.expression.arguments[0];
      e.push({start: arg.getStart(a), end: arg.end, tag: 'probability',
        text: js ? 'Number(this.params.probability ?? (this.params.value || 50))' : 'Number((this.params as any).probability ?? (this.params.value || 50))'});
    }
  }, {probability: 1});

  patch(base + 'services/BattleTurnService' + ext, (n, a, e, t) => {
    // 道具/捕捉失败后的敌方回合改走完整出手流程（效果、BOSS规则、PP、异常判定）
    if (ts.isVariableStatement(n) && n.declarationList.declarations[0].name.getText(a) === 'enemyCanAct' &&
        inMethod(n, a, 'BattleTurnService', 'ExecuteEnemyTurn')) {
      const statements = n.parent.statements;
      const from = statements.indexOf(n), last = statements[statements.length - 1];
      assert.ok(ts.isReturnStatement(last), 'Unknown enemy turn tail');
      const indent = indentOf(t, n.getStart(a));
      const turnExecutor = js ? 'BattleTurnExecutor_1.BattleTurnExecutor' : '(BattleTurnExecutor as any)'; // ExecuteAttack 在TS里是私有方法
      e.push({start: statements[from].getFullStart(), end: last.end, tag: 'enemyTurn',
        text: `\n${indent}const enemyCanAct = require("../SkillEffectRuntime").SkillEffectRuntime.CanAct(battle, battle.enemy, enemySkill) ?? ${CORE}.CanAct(battle.enemy);\n${indent}return ${turnExecutor}.ExecuteAttack(battle, battle.enemy, battle.player, enemySkill, 0, enemyCanAct, false);`});
    }
  }, {enemyTurn: 1});
}

// New and replaced modules: strict semantic check against their narrow imports, then transpile.
function module(rel, source) {
  const virtualSource = '/m/' + rel + '.ts', virtualTypes = '/m/runtime.d.ts';
  const runtimeTypes = 'export declare const Logger: any;\nexport declare const BossAbilityConfig: any;\nexport declare const GameConfig: any;\n' +
    'declare global { function require(id: string): any; }';
  const options = {noEmit: true, strict: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, types: []};
  const host = ts.createCompilerHost(options), readFile = host.readFile, fileExists = host.fileExists;
  host.readFile = f => f === virtualSource ? source : f === virtualTypes ? runtimeTypes : readFile(f);
  host.fileExists = f => f === virtualSource || f === virtualTypes || fileExists(f);
  host.resolveModuleNames = names => names.map(() => ({resolvedFileName: virtualTypes, extension: ts.Extension.Dts}));
  const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([virtualSource, virtualTypes], options, host));
  if (diagnostics.length) throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {getCanonicalFileName: f => f, getCurrentDirectory: () => root, getNewLine: () => '\n'}));
  const emitted = ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS}}).outputText;
  put(`app/src/GameServer/Game/Battle/${rel}.ts`, source);
  put(`app/dist/GameServer/Game/Battle/${rel}.js`, emitted);
  blankMap(`app/dist/GameServer/Game/Battle/${rel}.js`);
}
assert.ok(!fs.existsSync(path.join(baseline, 'app/dist/GameServer/Game/Battle/SkillEffectRuntime.js')), 'Runtime already deployed');
module('SkillEffectRuntime', fs.readFileSync(path.join(root, 'compat/server-patches/skill-effects/SkillEffectRuntime.ts'), 'utf8'));
// BossSpecialRules must still be the boss-mechanics release before it is replaced.
const bossRelease = fs.readFileSync(path.join(baseline, 'app/src/GameServer/Game/Battle/BossSpecialRules.ts'), 'utf8');
assert.ok(bossRelease.includes('public static DecorateBoss('), 'Boss mechanics release not on the baseline');
module('BossSpecialRules', fs.readFileSync(path.join(root, 'compat/server-patches/boss-mechanics/BossSpecialRules.ts'), 'utf8'));

// Boss configuration: re-apply the boss spec onto the live config (same rule as build-boss-mechanics.cjs).
const spec = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/boss-mechanics/boss-mechanics.json'), 'utf8'));
const bossRel = 'app/config/data/json/boss_abilities.json';
const bossConfig = JSON.parse(fs.readFileSync(path.join(baseline, bossRel), 'utf8'));
for (const item of spec.bosses) {
  const hits = bossConfig.bossConfigs.filter(b => b.mapId === item.mapId && b.param2 === item.param2);
  assert.equal(hits.length, 1, `Boss ${item.mapId}/${item.param2} not unique`);
  assert.equal(hits[0].petId, item.petId, `Boss ${item.mapId}/${item.param2} changed species`);
  Object.assign(hits[0], item.set);
}
put(bossRel, JSON.stringify(bossConfig, null, 2) + '\n');

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, databaseMigration: false,
  guards: 'AST edit points counted per file; verify before SHA256 at deployment'}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length}));
