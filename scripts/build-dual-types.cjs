'use strict';
// Build the dual-type release from a captured live app: add the client's dual-type table to elements.json and make
// ElementSystem resolve dual types for effectiveness and same-type bonus (dist + TS mirror).
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
const inMethod = (n, a, method) => {
  let p = n;
  while (p && !(ts.isMethodDeclaration(p) && name(p, a) === method)) p = p.parent;
  return !!p;
};
const block = (lines, indent) => lines.map(l => l ? indent + l : '').join('\n');

// ==================== 属性表 ====================
const clientTypes = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/dual-types/client-types.json'), 'utf8')).types;
const elementsRel = 'app/config/data/json/elements.json';
const elements = JSON.parse(fs.readFileSync(path.join(baseline, elementsRel), 'utf8'));
assert.ok(!elements.dualTypes && !elements.typeAliases, 'Dual types already on the baseline');
const chartId = Object.fromEntries(elements.types.map(t => [t.name, t.id]));
const dualTypes = {}, typeAliases = {};
for (const {id, cn} of clientTypes) {
  const parts = cn.split(' ');
  if (parts.length === 2) {
    dualTypes[id] = parts.map(p => { assert.ok(chartId[p], `Unknown component ${p} of ${id}`); return chartId[p]; });
  } else if (id > 200) {
    // 客户端用221–226表示王、混沌、神灵、轮回、虫、虚空，克制表里是21–26
    assert.equal(chartId[cn], id - 200, `Client type ${id} ${cn}`);
    typeAliases[id] = id - 200;
  } else {
    assert.equal(chartId[cn], id, `Client single type ${id} ${cn}`);
  }
}
assert.equal(Object.keys(dualTypes).length, 107, 'dual type count');
elements.dualTypes = dualTypes;
elements.typeAliases = typeAliases;
const elementsText = JSON.stringify(elements, null, 2) + '\n';
put(elementsRel, elementsText);

// ==================== ElementSystem ====================
for (const [dir, ext] of [['src', '.ts'], ['dist', '.js']]) {
  const js = ext === '.js';
  const GC = js ? 'GameConfig_1.GameConfig' : 'GameConfig';
  const pub = js ? 'static ' : 'public static ';
  const t = (s, typed) => js ? s : typed;
  patch(`app/${dir}/GameServer/Game/Battle/ElementSystem${ext}`, (n, a, e, text) => {
    if (ts.isMethodDeclaration(n) && name(n, a) === 'GetEffectiveness') {
      // 原单属性查表改名，新的 GetEffectiveness 先拆双属性再查表
      e.push({start: n.name.getStart(a), end: n.name.end, text: 'GetSingleEffectiveness', tag: 'rename'});
      const indent = indentOf(text, n.getStart(a));
      e.push({start: n.end, end: n.end, tag: 'insert', text: '\n\n' + block([
        '/**',
        ' * 属性的组成：双属性拆成两个单属性，客户端221–226（王、混沌、神灵、轮回、虫、虚空）对应克制表的21–26',
        ' */',
        `${pub}Components(typeId${t('', ': number')})${t('', ': number[]')} {`,
        `    const config${t('', ': any')} = ${GC}.GetElementConfig();`,
        '    const alias = config?.typeAliases?.[typeId];',
        '    if (alias)',
        '        return [alias];',
        '    return config?.dualTypes?.[typeId] || [typeId];',
        '}',
        '',
        '/**',
        ' * 克制倍率（单属性、双属性都适用，双属性按拆分公式）',
        ' */',
        `${pub}GetEffectiveness(atkType${t('', ': number')}, defType${t('', ': number')})${t('', ': number')} {`,
        '    if (!atkType || !defType)',
        '        return 1.0;',
        '    const [atk1, atk2] = this.Components(atkType);',
        '    const [def1, def2] = this.Components(defType);',
        '    return this.CalcDualVsDual(atk1, atk2, def1, def2);',
        '}',
      ].map(l => js ? l : l.replace(/^ {2,}/, sp => ' '.repeat(sp.length / 2))), indent)});
    }
    if (ts.isCallExpression(n) && n.expression.getText(a) === 'this.GetEffectiveness' &&
        (inMethod(n, a, 'CalcSingleVsDual') || inMethod(n, a, 'CalcDualVsSingle')))
      e.push({start: n.expression.getStart(a), end: n.expression.end, text: 'this.GetSingleEffectiveness', tag: 'singleCalls'});
    if (ts.isMethodDeclaration(n) && name(n, a) === 'GetSTABMultiplier') {
      const ret = n.body.statements[0];
      assert.ok(n.body.statements.length === 1 && ts.isReturnStatement(ret), 'Unknown STAB body');
      const indent = indentOf(text, ret.getStart(a));
      e.push({start: ret.getStart(a), end: ret.getStart(a), tag: 'stab',
        text: `if (petType2 === undefined && skillType2 === undefined)\n${indent}${js ? '    ' : '  '}return this.IsSameType(petType1, skillType1) ? 1.5 : 1.0;\n${indent}`});
      const methodIndent = indentOf(text, n.getStart(a));
      // 插在上一个成员之后，保留 GetSTABMultiplier 自己的注释
      e.push({start: n.getFullStart(), end: n.getFullStart(), tag: 'stab', text: '\n\n' + block([
        '/**',
        ' * 本系：技能属性与精灵属性相同；双属性精灵使用其中一个属性的单属性技能也算',
        ' */',
        `${pub}IsSameType(petType${t('', ': number')}, skillType${t('', ': number')})${t('', ': boolean')} {`,
        '    if (!petType || !skillType)',
        '        return false;',
        '    if (petType === skillType)',
        '        return true;',
        '    const pet = this.Components(petType), skill = this.Components(skillType);',
        '    return pet.length === 2 && skill.length === 1 && pet.includes(skill[0]);',
        '}',
      ].map(l => js ? l : l.replace(/^ {2,}/, sp => ' '.repeat(sp.length / 2))), methodIndent)});
    }
  }, {rename: 1, insert: 1, singleCalls: 6, stab: 2});
}

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, databaseMigration: false,
  guards: 'AST edit points counted per file; verify before SHA256 at deployment'}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length}));
