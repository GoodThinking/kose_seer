'use strict';
// Build the pet battle-resource release from a captured live root (client/ and app/):
// - client/overlay: the battle (and two head) files the client lacked, downloaded from the XIN site by exact path
//   (compat/client-patches/pet-battle-resources/resources.json records size and SHA-256 of each).
// - The laboratory daily sign-in pool (server whitelist and the Core MapProcess_5 menu) gains the dex pets that
//   had no source only because these files were missing; the catalog is compat/server-patches/acquisition-expansion.
// Usage: node build-pet-resources.cjs --baseline <live root> --resources <download root> --out <dir> --java <java> --ffdec <ffdec.jar>
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const names = ['baseline', 'resources', 'out', 'java', 'ffdec'];
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

// ==================== SWF 标签 ====================
function tagStream(body, offset, end) {
  const tags = [];
  while (offset < end) {
    const start = offset, short = body.readUInt16LE(offset); offset += 2;
    const code = short >> 6;
    let size = short & 63;
    if (size === 63) { size = body.readUInt32LE(offset); offset += 4; }
    const payload = body.subarray(offset, offset + size); offset += size;
    tags.push({code, payload, name: code === 82 ? payload.subarray(4, payload.indexOf(0, 4)).toString() : null, raw: body.subarray(start, offset)});
    if (!code) break;
  }
  return {tags, offset};
}
function parse(raw) {
  const signature = raw.subarray(0, 3).toString();
  assert.ok(signature === 'CWS' || signature === 'FWS', 'Expected a SWF file');
  const body = signature === 'CWS' ? zlib.inflateSync(raw.subarray(8)) : raw.subarray(8);
  assert.equal(body.length + 8, raw.readUInt32LE(4), 'Invalid SWF length');
  const headerEnd = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const {tags, offset} = tagStream(body, headerEnd, body.length);
  assert.equal(offset, body.length, 'Invalid SWF tag stream');
  return {raw, header: body.subarray(0, headerEnd), tags};
}
function symbols(tags) {
  const list = [];
  for (const tag of tags.filter(t => t.code === 76)) {
    let offset = 2;
    for (let i = 0; i < tag.payload.readUInt16LE(0); i++) {
      offset += 2;
      const end = tag.payload.indexOf(0, offset);
      list.push(tag.payload.subarray(offset, end).toString());
      offset = end + 1;
    }
  }
  return list;
}
function frameLabels(tags, found = new Set()) {
  for (const tag of tags) {
    if (tag.code === 43) found.add(tag.payload.subarray(0, tag.payload.indexOf(0)).toString());
    else if (tag.code === 39) frameLabels(tagStream(tag.payload, 4, tag.payload.length).tags, found);
  }
  return found;
}

// ==================== 战斗与头像资源 ====================
const catalogFile = JSON.parse(fs.readFileSync(path.join(root, 'compat/client-patches/pet-battle-resources/resources.json'), 'utf8'));
for (const entry of catalogFile.files) {
  const bytes = fs.readFileSync(path.join(path.resolve(v.resources), entry.path));
  assert.equal(bytes.length, entry.bytes, 'Size mismatch: ' + entry.path);
  assert.equal(sha(bytes), entry.sha256, 'Hash mismatch: ' + entry.path);
  const {tags} = parse(bytes);
  if (entry.kind === 'battle') {
    assert.ok(symbols(tags).includes('pet'), 'Battle file without pet symbol: ' + entry.path);
    const labels = frameLabels(tags);
    for (const label of ['attack', 'cp', 'hited', 'sa']) assert.ok(labels.has(label), `Battle file without ${label}: ${entry.path}`);
  } else {
    assert.ok(symbols(tags).includes('item'), 'Head file without item symbol: ' + entry.path);
  }
  const rel = 'client/overlay/' + entry.path;
  assert.ok(!fs.existsSync(path.join(baseline, rel)) && !fs.existsSync(path.join(baseline, 'client/assets', entry.path)), 'Resource already present: ' + entry.path);
  put(rel, bytes);
}

// ==================== 签到兜底名单 ====================
const exchange = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/acquisition-expansion/exchange-groups.json'), 'utf8'));
const pool = exchange.groups.flatMap(group => group.petIds);
assert.equal(new Set(pool).size, pool.length, 'Duplicate pet in the exchange catalog');
const acquisitionPath = 'app/config/data/json/pet-acquisition.json';
const acquisitionText = fs.readFileSync(path.join(baseline, acquisitionPath), 'utf8');
const acquisition = JSON.parse(acquisitionText);
assert.equal(JSON.stringify(acquisition, null, 2) + '\n', acquisitionText, 'pet-acquisition.json formatting changed');
assert.equal(acquisition.exchange.groupId, 900001, 'Unknown exchange group');
assert.ok(acquisition.exchange.petIds.every(id => pool.includes(id)), 'Catalog would drop a pet from the live pool');
const added = pool.filter(id => !acquisition.exchange.petIds.includes(id));
const withResources = new Set(catalogFile.files.map(f => f.petId));
assert.ok(added.every(id => withResources.has(id)), 'Added pet without a downloaded battle file');
acquisition.exchange.petIds = pool;
put(acquisitionPath, JSON.stringify(acquisition, null, 2) + '\n');

// ==================== Core：实验室签到菜单 ====================
const coreRel = 'client/assets/dll/NieoCore.swf', overlayCoreRel = 'client/overlay/dll/NieoCore.swf';
const coreBytes = fs.readFileSync(path.join(baseline, coreRel));
assert.ok(coreBytes.equals(fs.readFileSync(path.join(baseline, overlayCoreRel))), 'Core copies differ; reconcile before building');
const core = parse(coreBytes);
const labSource = fs.readFileSync(path.join(root, 'compat/client-patches/acquisition-restoration/MapProcess_5.as'), 'utf8');
const labGroups = '[' + exchange.groups.map(g => `["${g.type}",[${g.petIds.join(',')}]]`).join(',') + ']';
assert.ok(labSource.includes(`private const exchangeGroups:Array = ${labGroups};`), 'Lab menu catalog differs from exchange-groups.json');
const importDir = path.join(out, 'compiler/import/scripts/com/robot/app/mapProcess');
fs.mkdirSync(importDir, {recursive: true});
fs.writeFileSync(path.join(importDir, 'MapProcess_5.as'), labSource);
const compiled = path.join(out, 'compiler/output.swf');
execFileSync(v.java, ['-Djava.awt.headless=true', '-jar', v.ffdec, '-onerror', 'abort', '-importScript',
  path.join(baseline, coreRel), compiled, path.join(out, 'compiler/import')], {stdio: 'inherit', timeout: 300000});
const key = 'com/robot/app/mapProcess/MapProcess_5';
const replacement = parse(fs.readFileSync(compiled)).tags.filter(t => t.code === 82 && t.name === key);
assert.equal(core.tags.filter(t => t.code === 82 && t.name === key).length, 1, 'Expected one laboratory class');
assert.equal(replacement.length, 1, 'Laboratory class was not rebuilt');
const body = Buffer.concat([core.header, ...core.tags.map(t => t.name === key ? replacement[0].raw : t.raw)]);
const head = Buffer.from(core.raw.subarray(0, 8));
head.writeUInt32LE(body.length + 8, 4);
const finalCore = Buffer.concat([head, zlib.deflateSync(body, {level: 9})]);
const check = parse(finalCore);
assert.ok(check.tags.length === core.tags.length && check.tags.every((t, i) => t.name === key || t.raw.equals(core.tags[i].raw)), 'Unrelated Core tag changed');
put(coreRel, finalCore);
put(overlayCoreRel, finalCore);

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, restartWeb: false, noDatabaseMigration: true,
  changedNativeClasses: [key], unrelatedNativeTagsPreserved: true, newResources: catalogFile.files.length, addedPoolPets: added,
  poolPets: pool.length}, null, 2) + '\n');
console.log(JSON.stringify({files: files.length, newResources: catalogFile.files.length, addedPoolPets: added.length, poolPets: pool.length, out}));
