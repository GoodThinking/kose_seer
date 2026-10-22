'use strict';
// Build the 克洛斯星的湿地 (精灵捕捉场, simplified) and wild-position release from a captured live root (client/ and app/):
// - Core (assets and overlay copies):
//   - MapConfig gains map 550; OgreXMLInfo gains wild-pet positions for 550 and for the 16 maps whose server pools had
//     none, so their pets never showed (compat/client-patches/wild-positions/positions.json, scripts/pick-ogre-positions.py);
//   - new MapProcess_550 (stub from MapProcess_340, then compiled) hides the safari objects, scrolls with CameraController
//     and has a button back to 克洛斯星; LevelManager (no horizontal scroll on 550), MapProcess_10 (entrance button) and
//     MapProcess_5 (sign-in menu) are recompiled in place.
// - Server: the 550 pool (compat/server-patches/safari/wetland-pool.json); the sign-in pool gains the 40 pets whose only
//   wild pools are on maps the client does not register (compat/server-patches/safari/sign-in-additions.json).
// Usage: node build-safari.cjs --baseline <live root> --out <dir> --java <java> --ffdec <ffdec.jar>
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const names = ['baseline', 'out', 'java', 'ffdec'];
const {values: v} = parseArgs({options: Object.fromEntries(names.map(n => [n, {type: 'string'}]))});
for (const n of names) if (!v[n]) throw Error('Missing --' + n);
const baseline = path.resolve(v.baseline), out = path.resolve(v.out), root = path.resolve(__dirname, '..');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const readJson = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const files = [];

function put(rel, bytes) {
  const src = path.join(baseline, rel), dst = path.join(out, rel);
  fs.mkdirSync(path.dirname(dst), {recursive: true});
  fs.writeFileSync(dst, bytes);
  files.push({path: rel, before: fs.existsSync(src) ? sha(fs.readFileSync(src)) : null, after: sha(Buffer.from(bytes))});
}

// ==================== SWF 标签 ====================
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
function longTag(code, payload) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE((code << 6) | 63);
  head.writeUInt32LE(payload.length, 2);
  return Buffer.concat([head, payload]);
}
const only = (list, label) => { assert.equal(list.length, 1, 'Expected one ' + label); return list[0]; };

// ==================== ABC 字符串改名（做桩） ====================
function readU30(buf, pos) {
  let value = 0;
  for (let i = 0, shift = 0; i < 5; i++, shift += 7) {
    const b = buf[pos++];
    value += (b & 0x7f) * 2 ** shift;
    if (!(b & 0x80)) break;
  }
  return [value, pos];
}
function writeU30(n) {
  const bytes = [];
  do { let b = n & 0x7f; n = Math.floor(n / 128); if (n) b |= 0x80; bytes.push(b); } while (n);
  return Buffer.from(bytes);
}
function renamedAbcTag(tag, from, to) {
  const nameEnd = tag.payload.indexOf(0, 4), abc = tag.payload.subarray(nameEnd + 1);
  let pos = 4, count;
  [count, pos] = readU30(abc, pos); for (let i = 1; i < count; i++) [, pos] = readU30(abc, pos); // int
  [count, pos] = readU30(abc, pos); for (let i = 1; i < count; i++) [, pos] = readU30(abc, pos); // uint
  [count, pos] = readU30(abc, pos); pos += 8 * Math.max(0, count - 1); // double
  const parts = [abc.subarray(0, pos)];
  [count, pos] = readU30(abc, pos);
  parts.push(writeU30(count));
  let renamed = 0;
  for (let i = 1; i < count; i++) {
    let length;
    [length, pos] = readU30(abc, pos);
    let text = abc.subarray(pos, pos + length).toString('utf8'); pos += length;
    if (text.includes(from)) { text = text.split(from).join(to); renamed++; }
    const bytes = Buffer.from(text, 'utf8');
    parts.push(writeU30(bytes.length), bytes);
  }
  parts.push(abc.subarray(pos));
  assert.ok(renamed > 0, 'ABC rename found nothing');
  return longTag(82, Buffer.concat([tag.payload.subarray(0, 4), Buffer.from(tag.name.split(from).join(to) + '\0'), ...parts]));
}

// ==================== 地图表与野怪位置表 ====================
const positions = readJson('compat/client-patches/wild-positions/positions.json');
const WETLAND = `  <map id="550" name="克洛斯星的湿地" x="200" y="1018" super="11" sound="BGM_081">
    <Entries>
    </Entries>
    <changeMapComp/>
    <funComp/>
  </map>
`;
function tableTags(core) {
  const symbolIds = {};
  for (const tag of core.tags.filter(t => t.code === 76)) {
    let offset = 2;
    for (let i = 0; i < tag.payload.readUInt16LE(0); i++) {
      const id = tag.payload.readUInt16LE(offset); offset += 2;
      const end = tag.payload.indexOf(0, offset);
      symbolIds[tag.payload.subarray(offset, end).toString()] = id;
      offset = end + 1;
    }
  }
  const edit = (symbol, change) => {
    const tag = only(core.tags.filter(t => t.code === 87 && t.payload.readUInt16LE(0) === symbolIds[symbol]), symbol);
    const text = change(tag.payload.subarray(6).toString('utf8'));
    return [tag, longTag(87, Buffer.concat([tag.payload.subarray(0, 6), Buffer.from(text, 'utf8')]))];
  };
  // 从湿地回来站在克洛斯星上方的湿地按钮下（可走区，原版野怪位置 470,110 旁边）
  const FROM_CLOTH = '\t\t\t<Entry FromMap="11" PosX="76" PosY="420" />\r\n';
  const maps = edit('com.robot.core.manager.map.config.MapConfig_xmlCls', xml => {
    assert.ok(!xml.includes('<map id="550"'), 'Map 550 already registered');
    assert.equal(xml.split('</Maps>').length, 2, 'Map table end');
    assert.equal(xml.split(FROM_CLOTH).length, 2, '克洛斯星 entries changed');
    return xml.replace(FROM_CLOTH, FROM_CLOTH + '\t\t\t<Entry FromMap="550" PosX="480" PosY="115" />\r\n')
      .replace('</Maps>', WETLAND + '</Maps>');
  });
  // 客户端只在这张表的位置上画野怪：第 i 个槽位站在 pList[i]，服务端随机占 0–8 号槽
  const ogres = edit('com.robot.core.config.xml.OgreXMLInfo_xmlClass', xml => {
    const section = xml.slice(xml.indexOf('<ogre>'), xml.indexOf('</ogre>'));
    for (const id of Object.keys(positions)) assert.ok(!section.includes(`<item id="${id}" `), 'Wild positions exist: ' + id);
    assert.equal(xml.split('  </ogre>\r\n').length, 2, 'Wild position table end');
    const items = Object.entries(positions).map(([id, p]) => {
      assert.equal(p.positions.length, 9, 'Nine positions for ' + id);
      return `    <item id="${id}" pList="${p.positions.map(([x, y]) => x + ',' + y).join('|')}"></item>\r\n`;
    });
    return xml.replace('  </ogre>\r\n', items.join('') + '  </ogre>\r\n');
  });
  return new Map([maps, ogres]);
}

// ==================== Core ====================
const coreRel = 'client/assets/dll/NieoCore.swf', overlayCoreRel = 'client/overlay/dll/NieoCore.swf';
const coreRaw = fs.readFileSync(path.join(baseline, coreRel));
assert.ok(coreRaw.equals(fs.readFileSync(path.join(baseline, overlayCoreRel))), 'Overlay Core differs from assets; resolve baseline first');
const core = parse(coreRaw);
const WETLAND_KEY = 'com/robot/app/mapProcess/MapProcess_550';
const RECOMPILED = {
  'com/robot/core/manager/LevelManager': 'compat/client-patches/safari/LevelManager.as',
  'com/robot/app/mapProcess/MapProcess_10': 'compat/client-patches/safari/MapProcess_10.as',
  'com/robot/app/mapProcess/MapProcess_5': 'compat/client-patches/acquisition-restoration/MapProcess_5.as',
};
assert.ok(!core.tags.some(t => t.name === WETLAND_KEY), 'MapProcess_550 already in Core');
for (const key of Object.keys(RECOMPILED)) only(core.tags.filter(t => t.name === key), key);
const exchange = readJson('compat/server-patches/acquisition-expansion/exchange-groups.json');
const labGroups = '[' + exchange.groups.map(g => `["${g.type}",[${g.petIds.join(',')}]]`).join(',') + ']';
assert.ok(fs.readFileSync(path.join(root, RECOMPILED['com/robot/app/mapProcess/MapProcess_5']), 'utf8')
  .includes(`private const exchangeGroups:Array = ${labGroups};`), 'Lab menu catalog differs from exchange-groups.json');

const template = only(core.tags.filter(t => t.name === 'com/robot/app/mapProcess/MapProcess_340'), 'MapProcess_340');
const at = core.tags.indexOf(template) + 1;
const stubTags = core.tags.map(t => t.raw);
stubTags.splice(at, 0, renamedAbcTag(template, 'MapProcess_340', 'MapProcess_550'));
const compiler = path.join(out, 'compiler');
for (const [key, source] of [[WETLAND_KEY, 'compat/client-patches/safari/MapProcess_550.as'], ...Object.entries(RECOMPILED)]) {
  const target = path.join(compiler, 'import/scripts', key + '.as');
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(path.join(root, source), target);
}
fs.writeFileSync(path.join(compiler, 'stub.swf'), encode(core, stubTags));
execFileSync(v.java, ['-Djava.awt.headless=true', '-jar', v.ffdec, '-onerror', 'abort', '-importScript',
  path.join(compiler, 'stub.swf'), path.join(compiler, 'compiled.swf'), path.join(compiler, 'import')], {stdio: 'inherit', timeout: 300000});
const compiled = parse(fs.readFileSync(path.join(compiler, 'compiled.swf')));
assert.equal(compiled.tags.length, stubTags.length, 'Compiled Core tag count changed');
const tables = tableTags(core);
const coreTags = compiled.tags.map((t, i) => {
  if (i === at) {
    assert.equal(t.name, WETLAND_KEY, 'Compiled class order');
    assert.ok(!t.raw.equals(stubTags[i]), 'MapProcess_550 was not compiled');
    return t.raw;
  }
  const original = core.tags[i < at ? i : i - 1];
  if (RECOMPILED[original.name]) {
    assert.ok(!t.raw.equals(original.raw), original.name + ' was not recompiled');
    return t.raw;
  }
  assert.ok(t.raw.equals(original.raw), 'Unrelated Core tag changed: ' + (original.name || original.code));
  return tables.get(original) || original.raw;
});
const coreBytes = encode(core, coreTags);
assert.equal(parse(coreBytes).tags.length, core.tags.length + 1, 'Final Core tag count');
put(coreRel, coreBytes);
put(overlayCoreRel, coreBytes);

// ==================== 服务端：湿地野怪、签到名单 ====================
const ogreRel = 'app/config/data/json/map-ogres.json';
const ogreText = fs.readFileSync(path.join(baseline, ogreRel), 'utf8');
const ogres = JSON.parse(ogreText);
assert.equal(JSON.stringify(ogres, null, 2) + '\n', ogreText, 'map-ogres.json formatting changed');
const pool = readJson('compat/server-patches/safari/wetland-pool.json');
assert.ok(!ogres.maps[pool.mapId], 'Pool exists: ' + pool.mapId);
const petsXml = fs.readFileSync(path.join(baseline, 'app/config/data/xml/pets.xml'), 'utf8');
for (const p of pool.pets) assert.ok(new RegExp(`<Monster\\b[^>]*\\bID="${p.petId}"`).test(petsXml), 'Unknown pet ' + p.petId);
const {ogres: templateOgres, ...settings} = structuredClone(ogres.maps[pool.template]);
ogres.maps[pool.mapId] = {...settings, name: pool.name, ogres: pool.pets.map((p, slot) => ({...structuredClone(templateOgres[0]),
  slot, petId: p.petId, shiny: 0, weight: pool.weight, minLevel: pool.minLevel, maxLevel: pool.maxLevel, dropItems: pool.dropItems}))};
put(ogreRel, JSON.stringify(ogres, null, 2) + '\n');

const acquisitionRel = 'app/config/data/json/pet-acquisition.json';
const acquisitionText = fs.readFileSync(path.join(baseline, acquisitionRel), 'utf8');
const acquisition = JSON.parse(acquisitionText);
assert.equal(JSON.stringify(acquisition, null, 2) + '\n', acquisitionText, 'pet-acquisition.json formatting changed');
const signIn = exchange.groups.flatMap(g => g.petIds);
assert.ok(acquisition.exchange.petIds.every(id => signIn.includes(id)), 'Catalog would drop a pet from the live pool');
const added = signIn.filter(id => !acquisition.exchange.petIds.includes(id));
const additions = readJson('compat/server-patches/safari/sign-in-additions.json').pets.map(p => p.petId);
assert.deepEqual([...added].sort((a, b) => a - b), [...additions].sort((a, b) => a - b), 'Sign-in additions');
acquisition.exchange.petIds = signIn;
put(acquisitionRel, JSON.stringify(acquisition, null, 2) + '\n');

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, restartWeb: false, databaseMigration: false,
  newCoreClasses: [WETLAND_KEY], recompiledCoreClasses: Object.keys(RECOMPILED), changedEmbeddedTables: ['MapConfig', 'OgreXMLInfo'],
  newMaps: [550], wildPositionMaps: Object.keys(positions).map(Number), wetlandPets: pool.pets.map(p => p.petId), signInAdded: added,
  unrelatedCoreTagsPreserved: true}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length, wildPositionMaps: Object.keys(positions).length, wetlandPets: pool.pets.length}));
