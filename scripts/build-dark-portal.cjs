'use strict';
// Build the 暗黑门 doors 9–12 release from a captured live root (client/ and app/):
// - Core (assets and overlay copies): the door-9 room 511 gets the dark-room script it lacked; rooms 10–12 moved off
//   512–514 (拜伦号精灵舱, 地下室, 勇者之塔 in this client) to new local maps 5110–5112 with the same script.
//   DarkPortalModel.enterMap is recompiled with that mapping; new classes are stubs from MapProcess_340, then recompiled.
// - client/overlay/resource/map/5110–5112.swf: copies of the door-9 room 511.swf (no other room art in this client).
// - Server: the three door-10 bosses (slots 54–56) from compat/server-patches/dark-portal/door10.json.
// Usage: node build-dark-portal.cjs --baseline <live root> --out <dir> --java <java> --ffdec <ffdec.jar>
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
function renameInAbc(abc, from, to) {
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
  return {abc: Buffer.concat(parts), renamed};
}
function stubFrom(tag, from, to) {
  const nameEnd = tag.payload.indexOf(0, 4);
  const {abc, renamed} = renameInAbc(tag.payload.subarray(nameEnd + 1), from, to);
  assert.ok(renamed > 0, 'Stub rename found nothing');
  const name = Buffer.from(tag.name.replace(from, to) + '\0');
  return longTag(82, Buffer.concat([tag.payload.subarray(0, 4), name, abc]));
}

// ==================== 地图表：第十到第十二门的房间 ====================
const DOOR9 = '<map id="511" name="暗黑武斗场第九扇门" x="480" y="330" isLocal="1" sound="BGM_015B">';
const ROOMS = [[5110, '暗黑武斗场第十扇门'], [5111, '暗黑武斗场第十一扇门'], [5112, '暗黑武斗场第十二扇门']];
const room = ([id, name]) => `  <map id="${id}" name="${name}" x="480" y="330" isLocal="1" sound="BGM_015B">
    <changeMapComp/>
    <funComp>
      <component name="door_0" hit="comp_0" fun="onLeaveHandler"/>
    </funComp>
  </map>
`;
function mapTable(core) {
  const ids = [];
  for (const tag of core.tags.filter(t => t.code === 76)) {
    let offset = 2;
    for (let i = 0; i < tag.payload.readUInt16LE(0); i++) {
      const id = tag.payload.readUInt16LE(offset); offset += 2;
      const end = tag.payload.indexOf(0, offset);
      if (tag.payload.subarray(offset, end).toString() === 'com.robot.core.manager.map.config.MapConfig_xmlCls') ids.push(id);
      offset = end + 1;
    }
  }
  const id = only(ids, 'MapConfig symbol');
  const tag = only(core.tags.filter(t => t.code === 87 && t.payload.readUInt16LE(0) === id), 'MapConfig table');
  let xml = tag.payload.subarray(6).toString('utf8');
  assert.equal(xml.split(DOOR9).length, 2, 'Door-9 room entry changed; reconcile before building');
  for (const [mapId] of ROOMS) assert.ok(!xml.includes(`<map id="${mapId}"`), 'Map already registered: ' + mapId);
  assert.equal(xml.split('</Maps>').length, 2, 'Map table end');
  xml = xml.replace('</Maps>', ROOMS.map(room).join('') + '</Maps>');
  return {tag, raw: longTag(87, Buffer.concat([tag.payload.subarray(0, 6), Buffer.from(xml, 'utf8')]))};
}

// ==================== Core ====================
const coreRel = 'client/assets/dll/NieoCore.swf', overlayCoreRel = 'client/overlay/dll/NieoCore.swf';
const coreRaw = fs.readFileSync(path.join(baseline, coreRel));
assert.ok(coreRaw.equals(fs.readFileSync(path.join(baseline, overlayCoreRel))), 'Overlay Core differs from assets; resolve baseline first');
const core = parse(coreRaw);
const SCRIPTS = [511, 5110, 5111, 5112];
const keyOf = id => 'com/robot/app/mapProcess/MapProcess_' + id;
const MODEL = 'com/robot/app/darkPortal/DarkPortalModel';
for (const id of SCRIPTS) assert.ok(!core.tags.some(t => t.name === keyOf(id)), `MapProcess_${id} already in Core`);
only(core.tags.filter(t => t.name === MODEL), MODEL);
const template = only(core.tags.filter(t => t.name === keyOf(340)), 'MapProcess_340');
const at = core.tags.indexOf(template) + 1;
const stubTags = core.tags.map(t => t.raw);
stubTags.splice(at, 0, ...SCRIPTS.map(id => stubFrom(template, 'MapProcess_340', 'MapProcess_' + id)));
const compiler = path.join(out, 'compiler');
const sources = [...SCRIPTS.map(id => [keyOf(id), `MapProcess_${id}.as`]), [MODEL, 'DarkPortalModel.as']];
for (const [key, file] of sources) {
  const target = path.join(compiler, 'import/scripts', key + '.as');
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(path.join(root, 'compat/client-patches/dark-portal', file), target);
}
fs.writeFileSync(path.join(compiler, 'stub.swf'), encode(core, stubTags));
execFileSync(v.java, ['-Djava.awt.headless=true', '-jar', v.ffdec, '-onerror', 'abort', '-importScript',
  path.join(compiler, 'stub.swf'), path.join(compiler, 'compiled.swf'), path.join(compiler, 'import')], {stdio: 'inherit', timeout: 300000});
const compiled = parse(fs.readFileSync(path.join(compiler, 'compiled.swf')));
assert.equal(compiled.tags.length, stubTags.length, 'Compiled Core tag count changed');
const classTags = [];
let model;
compiled.tags.forEach((t, i) => {
  if (i >= at && i < at + SCRIPTS.length) {
    assert.equal(t.name, keyOf(SCRIPTS[i - at]), 'Compiled class order');
    assert.ok(!t.raw.equals(stubTags[i]), `${t.name} was not compiled`);
    classTags.push(t.raw);
  } else if (t.name === MODEL) {
    assert.ok(!t.raw.equals(stubTags[i]), 'DarkPortalModel was not recompiled');
    model = t.raw;
  } else assert.ok(t.raw.equals(stubTags[i]), 'Unrelated Core tag changed: ' + (t.name || t.code));
});
const maps = mapTable(core);
const coreTags = core.tags.map(t => t === maps.tag ? maps.raw : t.name === MODEL ? model : t.raw);
coreTags.splice(at, 0, ...classTags);
const coreBytes = encode(core, coreTags);
assert.equal(parse(coreBytes).tags.length, core.tags.length + SCRIPTS.length, 'Final Core tag count');
put(coreRel, coreBytes);
put(overlayCoreRel, coreBytes);

// ==================== 房间地图：沿用第九门 ====================
const door9Room = fs.readFileSync(path.join(baseline, 'client/assets/resource/map/511.swf'));
parse(door9Room);
const roomBody = zlib.inflateSync(door9Room.subarray(8));
for (const name of ['petMc', 'sMc', 'door_0', 'comp_0']) assert.ok(roomBody.includes(Buffer.from(name + '\0')), 'Door-9 room lacks ' + name);
for (const [mapId] of ROOMS) {
  const rel = `client/overlay/resource/map/${mapId}.swf`;
  assert.ok(!fs.existsSync(path.join(baseline, rel)) && !fs.existsSync(path.join(baseline, `client/assets/resource/map/${mapId}.swf`)), 'Room exists: ' + mapId);
  put(rel, door9Room);
}

// ==================== 服务端：第十门三只 BOSS ====================
const bossRel = 'app/config/data/json/boss_abilities.json';
const bossText = fs.readFileSync(path.join(baseline, bossRel), 'utf8');
const bosses = JSON.parse(bossText);
assert.equal(JSON.stringify(bosses, null, 2) + '\n', bossText, 'boss_abilities.json formatting changed');
const door10 = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/dark-portal/door10.json'), 'utf8')).bossConfigs;
const usedSpt = new Set(bosses.bossConfigs.filter(b => b.spt).map(b => b.spt.sptId));
for (const boss of door10) {
  assert.ok(!bosses.bossConfigs.some(b => b.mapId === boss.mapId && b.param2 === boss.param2), `Boss slot exists: ${boss.param2}`);
  assert.ok(!usedSpt.has(boss.spt.sptId), 'SPT id in use: ' + boss.spt.sptId);
}
const at9 = bosses.bossConfigs.findIndex(b => b.mapId === 110 && b.param2 === 1050);
assert.ok(at9 >= 0, 'Door-9 boss 1050');
bosses.bossConfigs.splice(at9 + 1, 0, ...door10);
put(bossRel, JSON.stringify(bosses, null, 2) + '\n');

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, restartWeb: false, databaseMigration: false,
  newCoreClasses: SCRIPTS.map(keyOf), recompiledCoreClasses: [MODEL], changedEmbeddedTables: ['MapConfig'],
  newRooms: ROOMS.map(r => r[0]), door10Bosses: door10.map(b => b.param2), unrelatedCoreTagsPreserved: true}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length}));
