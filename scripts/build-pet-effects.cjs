'use strict';
// Build the pet-effect release from a captured live app: battle pets carry their individual value (average of the six,
// as shown on the panel) and switching resets the runtime effect states; atomic "first/second strike" conditions use the
// actual move order recorded by SkillEffectRuntime. BattleInitService/ConditionalCheck: dist + TS mirror.
// BattleManager: dist only (its TS mirror predates the live file). SkillEffectRuntime comes from build-boss-designs.cjs.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {parseArgs} = require('node:util');
const {values: v} = parseArgs({options: Object.fromEntries(['context', 'baseline', 'out'].map(n => [n, {type: 'string'}]))});
for (const n of ['context', 'baseline', 'out']) if (!v[n]) throw Error('Missing --' + n);
const baseline = path.resolve(v.baseline), out = path.resolve(v.out);
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
const methodOf = (n, a) => {
  let p = n;
  while (p && !ts.isMethodDeclaration(p)) p = p.parent;
  return p ? name(p, a) : '';
};
// TS mirror uses 2-space indentation, dist uses 4
const lines = (list, indent, js) => list.map(l => l ? indent + (js ? l : l.replace(/^ {2,}/, sp => ' '.repeat(sp.length / 2))) : '').join('\n');

const AVG_DV = pet => `Math.floor((${pet}.dvHp + ${pet}.dvAtk + ${pet}.dvDef + ${pet}.dvSpAtk + ${pet}.dvSpDef + ${pet}.dvSpeed) / 6)`;

// ==================== BattleInitService：玩家战斗精灵带个体值 ====================
for (const [dir, ext] of [['src', '.ts'], ['dist', '.js']]) {
  const js = ext === '.js';
  patch(`app/${dir}/GameServer/Game/Battle/services/BattleInitService${ext}`, (n, a, e, text) => {
    if (!ts.isExpressionStatement(n) || methodOf(n, a) !== 'BuildPlayerBattlePet') return;
    if (!/^\(?battlePet( as any\))?\)?\.effectList = /.test(n.getText(a))) return;
    const indent = indentOf(text, n.getStart(a));
    e.push({start: n.end, end: n.end, tag: 'dv', text: '\n' + lines([
      '// 个体值取六项平均，与面板一致（按个体计算威力的技能使用）',
      `${js ? 'battlePet' : '(battlePet as any)'}.dv = ${AVG_DV('playerData.pet')};`,
    ], indent, js)});
  }, {dv: 1});
}

// ==================== BattleManager（dist）：换上的精灵带个体值，不继承上一只的技能效果状态 ====================
patch('app/dist/GameServer/Game/Battle/BattleManager.js', (n, a, e, text) => {
  if (!ts.isMethodDeclaration(n) || name(n, a) !== 'UpdateBattlePet') return;
  const last = n.body.statements[n.body.statements.length - 1];
  assert.equal(last.getText(a), 'battlePet.effectCounters = {};', 'Unknown end of UpdateBattlePet');
  const indent = indentOf(text, last.getStart(a));
  e.push({start: last.end, end: last.end, tag: 'switchState', text: '\n' + lines([
    'battlePet.effectStates = {};',
    '// 个体值取六项平均，与面板一致（按个体计算威力的技能使用）',
    `battlePet.dv = ${AVG_DV('newPet')};`,
  ], indent, true)});
}, {switchState: 1});

// ==================== ConditionalCheck：先手/后手按本回合实际出手顺序 ====================
for (const [dir, ext] of [['src', '.ts'], ['dist', '.js']]) {
  const js = ext === '.js';
  const first = `${js ? 'context.attacker' : '(context.attacker as any)'}.effectStates?._first`;
  patch(`app/${dir}/GameServer/Game/Battle/effects/atomic/core/ConditionalCheck${ext}`, (n, a, e) => {
    if (!ts.isReturnStatement(n) || methodOf(n, a) !== 'checkCondition') return;
    const body = n.expression?.getText(a);
    if (body === 'context.attacker.speed > context.defender.speed')
      e.push({start: n.expression.getStart(a), end: n.expression.end, tag: 'order',
        text: `${first} ?? context.attacker.speed > context.defender.speed`});
    if (body === 'context.attacker.speed <= context.defender.speed')
      e.push({start: n.expression.getStart(a), end: n.expression.end, tag: 'order',
        text: `!(${first} ?? context.attacker.speed > context.defender.speed)`});
  }, {order: 2});
}

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, databaseMigration: false,
  guards: 'AST edit points counted per file; verify before SHA256 at deployment'}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length}));
