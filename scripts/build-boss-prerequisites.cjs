'use strict';
// Build the boss-prerequisite release from a captured live app: a boss config may list bosses (by SPT id) that must be
// beaten first (朱雀 needs 德拉萨, 卡修斯 and 迪符特). The challenge is refused with an in-game alert naming the missing ones.
// BattleManager: dist only (its TS mirror predates the live file). boss_abilities.json comes from build-boss-designs.cjs.
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

// ==================== BattleManager（dist）：挑战前检查前置BOSS ====================
patch('app/dist/GameServer/Game/Battle/BattleManager.js', (n, a, e, text) => {
  // 只取 try 块里那一层“if (bossConfig) … else …”，不取 else 分支里回退 param2=0 的那个
  if (!ts.isIfStatement(n) || methodOf(n, a) !== 'ChallengeBoss' || n.expression.getText(a) !== 'bossConfig' || !ts.isTryStatement(n.parent.parent)) return;
  const indent = indentOf(text, n.getStart(a));
  e.push({start: n.end, end: n.end, tag: 'prerequisite', text: '\n' + lines([
    '// 前置BOSS：例如朱雀须先打败德拉萨、卡修斯、迪符特',
    'const missing = (bossConfig?.requiredBosses || []).filter(boss => !this.Player.ChallengeProgressManager.HasDefeatedSPTBoss(boss.sptId));',
    'if (missing.length > 0) {',
    "    const message = Buffer.from(`必须先打败${missing.map(boss => boss.name).join('、')}，才能挑战${bossConfig.petName}。`, 'utf8');",
    '    const body = Buffer.concat([Buffer.alloc(4), message]);',
    '    body.writeUInt32BE(message.length, 0);',
    '    // 客户端 ALERT（80002）：长度 + UTF-8 文本，直接弹窗',
    '    await this.Player.SendPacket({ getCmdId: () => CommandID_1.CommandID.ALERT, getResult: () => 0, serialize: () => body });',
    '    // 900 及以下的错误码客户端不弹窗，只显示上面的提示',
    '    await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.CHALLENGE_BOSS).setResult(900));',
    '    return;',
    '}',
  ], indent, true)});
}, {prerequisite: 1});

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, databaseMigration: false,
  guards: 'AST edit points counted per file; verify before SHA256 at deployment'}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length}));
