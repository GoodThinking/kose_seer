'use strict';
// Build the simplified 训练师之门 release from a captured live root (client/ and app/):
// - Core (assets and overlay copies): MapProcess_102 (精灵太空站) gains the 训练师之门 button and gate dialogs;
//   MapProcess_5 moves the 北斗七星殿 button above the toolbar. Both classes are recompiled in place.
// - Server: one boss per gate at 102/201–214 from compat/server-patches/train-door/gates.json, first win gives the
//   gate pet's essence through SPT.
// Usage: node build-train-door.cjs --baseline <live root> --out <dir> --java <java> --ffdec <ffdec.jar>
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const names = ['baseline', 'out', 'java', 'ffdec'];
const {values: v} = parseArgs({options: Object.fromEntries(names.map(n => [n, {type: 'string'}]))});
for (const n of names) if (!v[n]) throw Error('Missing --' + n);
const baseline = path.resolve(v.baseline), out = path.resolve(v.out), root = path.resolve(__dirname, '..');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const files = [];

function put(rel, bytes) {
  const src = path.join(baseline, rel), dst = path.join(out, rel);
  fs.mkdirSync(path.dirname(dst), {recursive: true});
  fs.writeFileSync(dst, bytes);
  files.push({path: rel, before: fs.existsSync(src) ? sha(fs.readFileSync(src)) : null, after: sha(Buffer.from(bytes))});
}
function parse(raw) {
  assert.equal(raw.subarray(0, 3).toString(), 'CWS', 'Expected compressed SWF');
  const body = zlib.inflateSync(raw.subarray(8));
  assert.equal(body.length + 8, raw.readUInt32LE(4), 'Invalid SWF length');
  let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0, offset), tags = [];
  while (offset < body.length) {
    const start = offset, short = body.readUInt16LE(offset); offset += 2;
    const code = short >> 6;
    let size = short & 63;
    if (size === 63) { size = body.readUInt32LE(offset); offset += 4; }
    const payload = body.subarray(offset, offset + size); offset += size;
    tags.push({code, payload, name: code === 82 ? payload.subarray(4, payload.indexOf(0, 4)).toString() : null, raw: body.subarray(start, offset)});
    if (!code) break;
  }
  assert.equal(offset, body.length, 'Invalid SWF tag stream');
  return {raw, header, tags};
}
function encode(source, rawTags) {
  const body = Buffer.concat([source.header, ...rawTags]);
  const head = Buffer.from(source.raw.subarray(0, 8));
  head.writeUInt32LE(body.length + 8, 4);
  return Buffer.concat([head, zlib.deflateSync(body, {level: 9})]);
}

const doc = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/train-door/gates.json'), 'utf8'));

// ==================== Core ====================
const coreRel = 'client/assets/dll/NieoCore.swf', overlayCoreRel = 'client/overlay/dll/NieoCore.swf';
const coreRaw = fs.readFileSync(path.join(baseline, coreRel));
assert.ok(coreRaw.equals(fs.readFileSync(path.join(baseline, overlayCoreRel))), 'Overlay Core differs from assets; resolve baseline first');
const core = parse(coreRaw);
const STATION = 'com/robot/app/mapProcess/MapProcess_102', LAB = 'com/robot/app/mapProcess/MapProcess_5';
const sources = [[STATION, 'compat/client-patches/train-door/MapProcess_102.as'], [LAB, 'compat/client-patches/acquisition-restoration/MapProcess_5.as']];
const stationSource = fs.readFileSync(path.join(root, sources[0][1]), 'utf8');
const doors = '[' + doc.gates.map(g => `["${g.type}","${g.petName}",${g.param2}]`).join(',') + ']';
assert.ok(stationSource.includes(`private const trainDoors:Array = ${doors};`), 'Station gate list differs from gates.json');
const compiler = path.join(out, 'compiler');
for (const [key, source] of sources) {
  assert.equal(core.tags.filter(t => t.name === key).length, 1, 'Expected one ' + key);
  const target = path.join(compiler, 'import/scripts', key + '.as');
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(path.join(root, source), target);
}
execFileSync(v.java, ['-Djava.awt.headless=true', '-jar', v.ffdec, '-onerror', 'abort', '-importScript',
  path.join(baseline, coreRel), path.join(compiler, 'compiled.swf'), path.join(compiler, 'import')], {stdio: 'inherit', timeout: 300000});
const compiled = parse(fs.readFileSync(path.join(compiler, 'compiled.swf')));
assert.equal(compiled.tags.length, core.tags.length, 'Compiled Core tag count changed');
const changed = new Map();
compiled.tags.forEach((t, i) => {
  if (t.name === STATION || t.name === LAB) {
    assert.ok(!t.raw.equals(core.tags[i].raw), t.name + ' was not recompiled');
    changed.set(core.tags[i], t.raw);
  } else assert.ok(t.raw.equals(core.tags[i].raw), 'Unrelated Core tag changed: ' + (t.name || t.code));
});
assert.equal(changed.size, 2, 'Expected two recompiled classes');
const coreBytes = encode(core, core.tags.map(t => changed.get(t) || t.raw));
put(coreRel, coreBytes);
put(overlayCoreRel, coreBytes);

// ==================== 服务端：每门一只 BOSS ====================
const bossRel = 'app/config/data/json/boss_abilities.json';
const bossText = fs.readFileSync(path.join(baseline, bossRel), 'utf8');
const bosses = JSON.parse(bossText);
assert.equal(JSON.stringify(bosses, null, 2) + '\n', bossText, 'boss_abilities.json formatting changed');
const usedSpt = new Set(bosses.bossConfigs.filter(b => b.spt).map(b => b.spt.sptId));
for (const g of doc.gates) {
  assert.ok(!bosses.bossConfigs.some(b => b.mapId === 102 && b.param2 === g.param2), 'Boss slot exists: 102/' + g.param2);
  assert.ok(!usedSpt.has(g.sptId), 'SPT id in use: ' + g.sptId);
  bosses.bossConfigs.push({mapId: 102, param2: g.param2, petId: g.petId, petName: g.petName, level: doc.level, dv: 31, ev: 0, nature: 0,
    abilities: [], skills: g.skills, customHP: doc.customHP, drops: [], rewards: {exp: 4000, coins: 2000},
    spt: {sptId: g.sptId, rewardItemId: g.essence, noStand: true},
    comment: `训练师之门·${g.type}系之门守护精灵${g.petName}，首胜得${g.petName}的精元（简化版）。`});
}
put(bossRel, JSON.stringify(bosses, null, 2) + '\n');

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, restartWeb: false, databaseMigration: false,
  recompiledCoreClasses: [STATION, LAB], gates: doc.gates.map(g => [g.type, g.petName, g.param2, g.essence, g.sptId]),
  unrelatedCoreTagsPreserved: true}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length, gates: doc.gates.length}));
