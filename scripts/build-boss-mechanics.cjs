'use strict';
// Build the boss-mechanics release from a captured live app: rewrite BossSpecialRules, add guarded
// hooks to the battle flow (dist and its TS mirror), and apply the boss/Puni configuration spec.
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
// Patched dist files keep their source map file, but its mappings no longer match.
function blankMap(rel) {
  const mapRel = rel + '.map';
  if (!fs.existsSync(path.join(baseline, mapRel))) return;
  const map = JSON.parse(fs.readFileSync(path.join(baseline, mapRel), 'utf8'));
  map.mappings = '';
  put(mapRel, JSON.stringify(map));
}
function indentOf(text, pos) {
  const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
  return /^[ \t]*/.exec(text.slice(lineStart))[0];
}
// Apply AST-located edits; `expected` maps edit tags to their required counts.
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
  return result;
}
const name = (n, a) => n.name ? n.name.getText(a) : '';
const inClassMethod = (n, a, cls, method) => {
  let p = n;
  while (p && !(ts.isMethodDeclaration(p) && name(p, a) === method)) p = p.parent;
  if (!p) return false;
  while (p && !ts.isClassDeclaration(p)) p = p.parent;
  return !!p && name(p, a) === cls;
};
const insertAfter = (edits, node, text, a, tag, body) => {
  const indent = indentOf(text, node.getStart(a));
  edits.push({start: node.end, end: node.end, text: body.split('\n').map(l => '\n' + indent + l).join(''), tag});
};

for (const [dir, ext] of [['src', '.ts'], ['dist', '.js']]) {
  const js = ext === '.js', B = js ? 'BossSpecialRules_1.BossSpecialRules' : 'BossSpecialRules';
  const enemyMechanics = js ? 'battle.enemy.bossMechanics' : '(battle.enemy as any).bossMechanics';
  const base = `app/${dir}/GameServer/Game/Battle/`;

  patch(base + 'BattleTurnExecutor' + ext, (n, a, e, t) => {
    if (ts.isVariableStatement(n)) {
      const id = n.declarationList.declarations[0].name.getText(a);
      if (id === 'turnStartResults' || id === 'afterAttackEndResults') insertAfter(e, n, t, a, 'settle', `${B}.SettleBossHp(battle, 'dot');`);
      if (id === 'turnEndResults') insertAfter(e, n, t, a, 'turnEnd', `${B}.OnTurnEnd(battle);\n${B}.SettleBossHp(battle, 'dot');`);
    }
    if (ts.isVariableDeclaration(n) && name(n, a) === 'pet2Skill') {
      (function find(c) {
        if (ts.isConditionalExpression(c) && c.condition.getText(a) === 'isPvp')
          e.push({start: c.condition.getStart(a), end: c.condition.end, text: `(isPvp || ${enemyMechanics})`, tag: 'idleSkill'});
        ts.forEachChild(c, find);
      })(n.initializer);
    }
    if (ts.isVariableDeclaration(n) && name(n, a) === 'pet2CanAct') {
      const cond = n.initializer.condition;
      assert.equal(cond.getText(a), '(isPvp && pet2SkillId === 0)');
      e.push({start: cond.getStart(a), end: cond.end, text: `((isPvp || ${enemyMechanics}) && pet2SkillId === 0)`, tag: 'idleAct'});
    }
    if (ts.isIfStatement(n) && n.expression.getText(a) === '!canAct.canAct' && inClassMethod(n, a, 'BattleTurnExecutor', 'ExecuteAttack'))
      insertAfter(e, n, t, a, 'spendPP', `${B}.SpendBossPP(battle, attacker, skill);`);
    if (ts.isIfStatement(n) && n.expression.getText(a) === '!hit') {
      const log = n.thenStatement.statements[0];
      assert.ok(log.getText(a).includes('未命中'), 'Unknown miss branch');
      insertAfter(e, log, t, a, 'miss', `${B}.OnAttackMissed(defender, skill);`);
    }
    if (ts.isIfStatement(n) && n.expression.getText(a) === 'instantKillResult && instantKillResult.value') {
      const last = n.thenStatement.statements[n.thenStatement.statements.length - 1];
      insertAfter(e, last, t, a, 'ohko', `damage = ${B}.ModifyDamageToBoss(battle, attacker, defender, skill, damage, 'ohko');`);
    }
    if (ts.isIfStatement(n) && n.expression.getText(a) === 'fixedDamageResult && fixedDamageResult.value') {
      const then = n.thenStatement.statements;
      // 百分比削血附在攻击技能上时是额外伤害（圣灵魔闪光：威力160并降低对方1/8体力）。
      const core = js ? 'BattleCore_1.BattleCore' : 'BattleCore';
      insertAfter(e, then[then.length - 1], t, a, 'fixed', [
        `if (fixedDamageResult.data?.mode === 'percent' && skill.power > 0)`,
        `    damage += ${core}.CalculateDamage(attacker, defender, skill, isCrit, skill.power).damage;`,
        `damage = ${B}.ModifyDamageToBoss(battle, attacker, defender, skill, damage, 'fixed', { mode: fixedDamageResult.data?.mode });`].join('\n'));
      // The old boss rules in the normal branch become one unified call.
      const list = n.elseStatement.statements;
      const first = list.findIndex(s => s.getText(a).includes('ApplySequentialTypeBreak'));
      const old = list.slice(first).filter(s => /ApplySequentialTypeBreak|sequentialBreakResult|ApplySpecialKillCondition|specialKillResult|ModifyPuniDamage/.test(s.getText(a)));
      assert.equal(old.length, js ? 5 : 4, 'Unknown boss rule block');
      const indent = indentOf(t, old[0].getStart(a));
      e.push({start: old[0].getFullStart(), end: old[old.length - 1].end, tag: 'attack',
        text: `\n${indent}// BOSS规则（顺序破防、破防/击杀条件、封印、减伤等）\n${indent}damage = ${B}.ModifyDamageToBoss(battle, attacker, defender, skill, damage, 'attack', { effectiveness: damageResult.effectiveness });`});
    }
    if (ts.isExpressionStatement(n) && n.getText(a) === 'defender.hp = Math.max(0, defender.hp - actualDamage);')
      insertAfter(e, n, t, a, 'damaged', `${B}.AfterBossDamaged(battle, attacker, defender, skill, actualDamage);`);
  }, {settle: 2, turnEnd: 1, idleSkill: 1, idleAct: 1, spendPP: 1, miss: 1, ohko: 1, fixed: 1, attack: 1, damaged: 1});

  patch(base + 'BattleCore' + ext, (n, a, e, t) => {
    if (ts.isVariableStatement(n) && n.declarationList.declarations[0].name.getText(a) === 'accuracy' && inClassMethod(n, a, 'BattleCore', 'CheckHit')) {
      const indent = indentOf(t, n.getStart(a));
      e.push({start: n.getFullStart(), end: n.getFullStart(), tag: 'hit',
        text: `\n${indent}// 3.5 BOSS闪避与谱尼虚无（必中技能已在上方放行）\n${indent}const bossHit = require("./BossSpecialRules").BossSpecialRules.CheckBossHit(defender, skill);\n${indent}if (bossHit !== undefined) return bossHit;`});
    }
  }, {hit: 1});

  patch(base + 'services/BattleTurnService' + ext, (n, a, e) => {
    if (ts.isCallExpression(n) && n.expression.getText(a).endsWith('AISelectSkill') && n.arguments[0]?.getText(a) === 'battle.enemy')
      e.push({start: n.getStart(a), end: n.end, text: `require("../BossSpecialRules").BossSpecialRules.SelectBossSkill(battle, ${n.getText(a)})`, tag: 'pp'});
  }, {pp: 2});

  patch(base + 'PassiveAbilitySystem' + ext, (n, a, e) => {
    if (ts.isCallExpression(n) && n.getText(a).endsWith('GetAbilityEntries(pet.petId)'))
      e.push({start: n.getStart(a), end: n.end, text: js ? '(pet.bossAbilityEntries || [])' : '((pet as any).bossAbilityEntries || [])', tag: 'entries'});
    if (js && ts.isVariableStatement(n) && n.getText(a) === 'const BossAbilityConfig_1 = require("./BossAbility/BossAbilityConfig");')
      e.push({start: n.getFullStart(), end: n.end, text: '', tag: 'import'});
    if (!js && ts.isImportDeclaration(n) && n.getText(a) === "import { BossAbilityConfig } from './BossAbility/BossAbilityConfig';")
      e.push({start: n.getFullStart(), end: n.end, text: '', tag: 'import'});
  }, {entries: 1, import: 1});

  patch(base + 'services/BattleInitService' + ext, (n, a, e) => {
    if (ts.isReturnStatement(n) && inClassMethod(n, a, 'BattleInitService', 'BuildBossBattlePet'))
      e.push({start: n.expression.getStart(a), end: n.expression.end, tag: 'decorate',
        text: `require("../BossSpecialRules").BossSpecialRules.DecorateBoss(${n.expression.getText(a)}, bossConfig)`});
  }, {decorate: 1});

  patch(base + 'effects/atomic/status/StatusEffects' + ext, (n, a, e, t) => {
    if (ts.isIfStatement(n) && n.expression.getText(a) === '!target' && inClassMethod(n, a, 'StatusInflictor', 'execute'))
      insertAfter(e, n, t, a, 'status', [
        `if (require("../../../BossSpecialRules").BossSpecialRules.IsStatusImmune(target, this.params.status, context.skillId)) {`,
        `    this.log(\`目标免疫异常状态\${this.params.status}\`, 'info');`,
        `    results.push(this.createResult(false, this.params.target === 'self' ? 'attacker' : 'defender', 'status', '目标免疫异常状态', 0));`,
        `    return results;`,
        `}`].join('\n'));
  }, {status: 1});

  patch(base + 'effects/atomic/stat/StatEffects' + ext, (n, a, e, t) => {
    if (ts.isIfStatement(n) && n.expression.getText(a) === '!target' && inClassMethod(n, a, 'StatModifier', 'execute'))
      insertAfter(e, n, t, a, 'statDown', [
        `if (this.params.mode === 'level' && this.params.change < 0 && require("../../../BossSpecialRules").BossSpecialRules.IsStatDownImmune(target)) {`,
        `    this.log('目标免疫能力下降', 'info');`,
        `    results.push(this.createResult(false, this.params.target === 'self' ? 'attacker' : 'defender', 'stat_modifier', '目标免疫能力下降', 0));`,
        `    return results;`,
        `}`].join('\n'));
  }, {statDown: 1});

  patch(base + 'EffectApplicator' + ext, (n, a, e, t) => {
    if (ts.isCallExpression(n) && n.expression.getText(a).endsWith('IsSameLifeDeathImmune'))
      e.push({start: n.arguments[0].getStart(a), end: n.arguments[0].end, text: 'defender', tag: 'sameLife'});
    if (ts.isMethodDeclaration(n) && name(n, a) === 'IsImmune') {
      const indent = indentOf(t, n.getStart(a)), i2 = indent + (js ? '    ' : '  ');
      const body = js
        ? `{\n${i2}if (result.type === 'status' && ${B}.IsStatusImmune(target, result.data?.status))\n${i2}    return true;\n${i2}if (result.type === 'stat_change' && result.data?.stages < 0 && ${B}.IsStatDownImmune(target))\n${i2}    return true;\n${i2}return false;\n${indent}}`
        : `{\n${i2}if (result.type === 'status' && ${B}.IsStatusImmune(target, result.data?.status)) return true;\n${i2}if (result.type === 'stat_change' && result.data?.stages < 0 && ${B}.IsStatDownImmune(target)) return true;\n${i2}return false;\n${indent}}`;
      e.push({start: n.body.getStart(a), end: n.body.end, text: body, tag: 'immune'});
    }
  }, {sameLife: 1, immune: 1});

  patch(base + 'effects/atomic/special/HpEffects' + ext, (n, a, e) => {
    if (ts.isCallExpression(n) && n.expression.getText(a).endsWith('IsSameLifeDeathImmune'))
      e.push({start: n.arguments[0].getStart(a), end: n.arguments[0].end, text: 'defender', tag: 'sameLife'});
  }, {sameLife: 1});

  patch(base + 'effects/atomic/damage/DamageEffects' + ext, (n, a, e) => {
    if (ts.isCallExpression(n) && n.expression.getText(a) === 'this.createResult' && n.arguments[2]?.getText(a) === "'fixed_damage'" &&
        inClassMethod(n, a, 'FixedDamageEffect', 'execute')) {
      assert.equal(n.arguments.length, 5);
      e.push({start: n.arguments[4].end, end: n.arguments[4].end, text: ', { mode: this.params.mode }', tag: 'mode'});
    }
    // 效果28“降低对方1/n的体力”把n作为divisor传入；原实现按value=50计算成最大体力的50倍。
    if (ts.isExpressionStatement(n) && n.getText(a) === 'damage = Math.floor(context.defender.maxHp * (this.params.value || 0));' &&
        inClassMethod(n, a, 'FixedDamageEffect', 'execute')) {
      const divisor = js ? 'this.params.divisor' : '(this.params as any).divisor';
      e.push({start: n.getStart(a), end: n.end, tag: 'divisor',
        text: `damage = ${divisor} > 0 ? Math.floor(context.defender.maxHp / ${divisor}) : Math.floor(context.defender.maxHp * (this.params.value || 0));`});
    }
  }, {mode: 1, divisor: 1});

  patch(base + 'BattleManager' + ext, (n, a, e) => {
    if (ts.isExpressionStatement(n) && n.getText(a).includes('ResetBattleState('))
      e.push({start: n.getFullStart(), end: n.end, text: '', tag: 'reset'});
    if (js && ts.isVariableStatement(n) && n.getText(a) === 'const BossSpecialRules_1 = require("./BossSpecialRules");')
      e.push({start: n.getFullStart(), end: n.end, text: '', tag: 'import'});
    if (!js && ts.isImportDeclaration(n) && n.getText(a) === "import { BossSpecialRules } from './BossSpecialRules';")
      e.push({start: n.getFullStart(), end: n.end, text: '', tag: 'import'});
  }, {reset: 1, import: 1});
}

// Puni seal state lived in effectCounters, which the turn loop decrements as durations: the second
// 轮回 bar was lost after one turn and 真身 kept respawning on its second life. Keep it separate.
{
  const rel = 'app/dist/GameServer/Game/Battle/PuniSealBattle.js';
  let text = fs.readFileSync(path.join(baseline, rel), 'utf8');
  for (const [from, to] of [
    ['    if (!battle.enemy.effectCounters) battle.enemy.effectCounters = {};\n    const counters = battle.enemy.effectCounters;\n',
     '    const counters = battle.enemy.puniState = {};\n'],
    ['    if (!seal || !defender.effectCounters) return;\n    const counters = defender.effectCounters;\n',
     '    if (!seal || !defender.puniState) return;\n    const counters = defender.puniState;\n']]) {
    assert.equal(text.split(from).length, 2, 'Unknown Puni state baseline');
    text = text.replace(from, to);
  }
  assert.ok(!text.includes('effectCounters'), 'Puni state still in effectCounters');
  put(rel, text);
}

// BossSpecialRules is replaced as a whole: strict semantic check against its narrow imports, then transpile.
const rulesSource = fs.readFileSync(path.join(root, 'compat/server-patches/boss-mechanics/BossSpecialRules.ts'), 'utf8');
const virtualSource = '/boss/BossSpecialRules.ts', virtualTypes = '/boss/runtime.d.ts';
const runtimeTypes = 'export declare const Logger: any;\nexport declare const BossAbilityConfig: any;\nexport declare const GameConfig: any;\n' +
  'declare global { function require(id: string): any; }';
const options = {noEmit: true, strict: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, types: []};
const host = ts.createCompilerHost(options), readFile = host.readFile, fileExists = host.fileExists;
host.readFile = f => f === virtualSource ? rulesSource : f === virtualTypes ? runtimeTypes : readFile(f);
host.fileExists = f => f === virtualSource || f === virtualTypes || fileExists(f);
host.resolveModuleNames = names => names.map(() => ({resolvedFileName: virtualTypes, extension: ts.Extension.Dts}));
const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([virtualSource, virtualTypes], options, host));
if (diagnostics.length) throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {getCanonicalFileName: f => f, getCurrentDirectory: () => root, getNewLine: () => '\n'}));
const emitted = ts.transpileModule(rulesSource, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS}}).outputText;
for (const rel of ['app/src/GameServer/Game/Battle/BossSpecialRules.ts', 'app/dist/GameServer/Game/Battle/BossSpecialRules.js'])
  assert.ok(fs.existsSync(path.join(baseline, rel)), 'Missing baseline ' + rel);
put('app/src/GameServer/Game/Battle/BossSpecialRules.ts', rulesSource);
put('app/dist/GameServer/Game/Battle/BossSpecialRules.js', emitted);
blankMap('app/dist/GameServer/Game/Battle/BossSpecialRules.js');

// Configuration: every targeted boss must still match the captured baseline identity.
const spec = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/boss-mechanics/boss-mechanics.json'), 'utf8'));
const bossRel = 'app/config/data/json/boss_abilities.json';
const bossConfig = JSON.parse(fs.readFileSync(path.join(baseline, bossRel), 'utf8'));
for (const item of spec.bosses) {
  const hits = bossConfig.bossConfigs.filter(b => b.mapId === item.mapId && b.param2 === item.param2);
  assert.equal(hits.length, 1, `Boss ${item.mapId}/${item.param2} not unique`);
  assert.equal(hits[0].petId, item.petId, `Boss ${item.mapId}/${item.param2} changed species`);
  Object.assign(hits[0], item.set);
}
for (const [petId, fields] of Object.entries(spec.specialKillCondition)) {
  const rule = bossConfig.specialRules.specialKillCondition.find(r => r.petId === Number(petId));
  assert.ok(rule, 'Missing special kill rule ' + petId);
  Object.assign(rule, fields);
}
for (const boss of bossConfig.bossConfigs)
  for (const entry of [...boss.abilities, ...Object.values(boss.weekdayAbilities || {}).flat()])
    assert.ok(![2001, 2002].includes(typeof entry === 'number' ? entry : entry.id), `Undefined ability left on ${boss.mapId}/${boss.param2}`);
put(bossRel, JSON.stringify(bossConfig, null, 2) + '\n');

const puniRel = 'app/config/data/json/puni_config.json';
const puni = JSON.parse(fs.readFileSync(path.join(baseline, puniRel), 'utf8'));
for (const [door, fields] of Object.entries(spec.puniSeals)) {
  const seal = puni.puniSeals.find(s => s.doorIndex === Number(door));
  assert.ok(seal, 'Missing Puni seal ' + door);
  for (const key of Object.keys(fields)) assert.ok(key in seal, `Unknown Puni field ${key}`);
  Object.assign(seal, fields);
}
put(puniRel, JSON.stringify(puni, null, 2) + '\n');

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, databaseMigration: false,
  guards: 'AST edit points counted per file; verify before SHA256 at deployment'}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length}));
