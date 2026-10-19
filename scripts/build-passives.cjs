'use strict';
// Build the passive-trait release from a captured live app (already carrying the skill-effects release):
// add PassiveRuntime, refresh SkillEffectRuntime, and hook the passive runner (dist + TS mirror).
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
  if (map.mappings === '') return;
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
const before = (edits, node, text, a, tag, body) => {
  const indent = indentOf(text, node.getStart(a));
  edits.push({start: node.getStart(a), end: node.getStart(a), text: body.split('\n').map(l => l + '\n' + indent).join(''), tag});
};

for (const [dir, ext] of [['src', '.ts'], ['dist', '.js']]) {
  const js = ext === '.js';
  const R = js ? 'SkillEffectRuntime_1.SkillEffectRuntime' : 'SkillEffectRuntime';
  const base = `app/${dir}/GameServer/Game/Battle/`;

  // 先制修正需要回合数（特性2098）
  patch(base + 'BattleTurnExecutor' + ext, (n, a, e) => {
    if (ts.isCallExpression(n) && n.expression.getText(a) === `${R}.Priority`) {
      assert.equal(n.arguments.length, 2, 'Priority already takes the battle');
      e.push({start: n.arguments[0].getStart(a), end: n.arguments[0].getStart(a), text: 'battle, ', tag: 'priority'});
    }
  }, {priority: 2});

  patch(base + 'PassiveEffectRunner' + ext, (n, a, e, t) => {
    // 由被动特性运行时实现的特性不再执行原子效果
    if (ts.isForOfStatement(n) && n.initializer.getText(a).endsWith('passive') && n.expression.getText(a) === 'passives' &&
        inMethod(n, a, 'PassiveEffectRunner', 'TriggerAtTiming'))
      before(e, n.statement.statements[0], t, a, 'skip', `if (require("./PassiveRuntime").PassiveRuntime.Handles(passive.effectId))\n${js ? '    ' : '  '}continue;`);
    // 显式传入的参数按参数名覆盖原子字段（配置写的是默认值而不是 $argN 占位时以前不生效）
    if (ts.isPropertyAssignment(n) || ts.isShorthandPropertyAssignment(n)) {
      if (name(n, a) === 'argValues' && inMethod(n, a, 'PassiveEffectRunner', 'BuildPassiveFromConfig'))
        e.push({start: n.end, end: n.end, tag: 'argNames',
          text: `,\n${indentOf(t, n.getStart(a))}argNames: (config.args || []).slice(0, overrideArgs?.length || 0).map((arg${js ? '' : ': any'}) => arg.name)`});
    }
    if (ts.isReturnStatement(n) && n.expression && n.expression.getText(a) === 'resolved' && inMethod(n, a, 'PassiveEffectRunner', 'ApplyArgValues'))
      before(e, n, t, a, 'byName', [
        '// 按参数名覆盖：配置里写的是默认值而不是 $argN 占位时，显式传入的参数也要生效',
        `(passive.argNames || []).forEach((name${js ? '' : ': string'}, index${js ? '' : ': number'}) => {`,
        `${js ? '    ' : '  '}const original = (atomConfig${js ? '' : ' as any'})[name];`,
        `${js ? '    ' : '  '}if (name && name in resolved && !(typeof original === 'string' && original.startsWith('$arg')))`,
        `${js ? '        ' : '    '}(resolved${js ? '' : ' as any'})[name] = passive.argValues[index];`,
        '});'].join('\n'));
    if (!js && ts.isPropertySignature(n) && name(n, a) === 'argValues' && ts.isInterfaceDeclaration(n.parent) && name(n.parent, a) === 'IRegisteredPassive')
      e.push({start: n.end, end: n.end, tag: 'interface', text: `\n${indentOf(t, n.getStart(a))}argNames?: string[];  // 显式传入参数对应的参数名`});
  }, js ? {skip: 1, argNames: 1, byName: 1} : {skip: 1, argNames: 1, byName: 1, interface: 1});

  // 防守方特性免疫的效果（2050免疫特效、2185免疫指定技能特效）不再触发
  patch(base + 'EffectTrigger' + ext, (n, a, e) => {
    if (ts.isIfStatement(n) && n.expression.getText(a) === `${R}.Handles(effectId, skill)` &&
        (inMethod(n, a, 'EffectTrigger', 'TriggerSingleSkillEffect') || inMethod(n, a, 'EffectTrigger', 'TriggerMultipleSkillEffects')))
      e.push({start: n.expression.end, end: n.expression.end, text: ` || ${R}.EffectBlocked(defender, effectId, skill)`, tag: 'blocked'});
  }, {blocked: 2});
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
assert.ok(fs.existsSync(path.join(baseline, 'app/dist/GameServer/Game/Battle/SkillEffectRuntime.js')), 'Skill effects release not on the baseline');
assert.ok(!fs.existsSync(path.join(baseline, 'app/dist/GameServer/Game/Battle/PassiveRuntime.js')), 'Passive runtime already deployed');
const dir = path.join(root, 'compat/server-patches/skill-effects');
module('PassiveRuntime', fs.readFileSync(path.join(dir, 'PassiveRuntime.ts'), 'utf8'));
module('SkillEffectRuntime', fs.readFileSync(path.join(dir, 'SkillEffectRuntime.ts'), 'utf8'));

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, databaseMigration: false,
  guards: 'AST edit points counted per file; verify before SHA256 at deployment'}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length}));
