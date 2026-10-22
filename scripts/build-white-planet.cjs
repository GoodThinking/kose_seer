'use strict';
// Build the 裂空星系 boss-entrance release from a captured live root (client/ and app/):
// - Core (assets and overlay copies): link 怀特星 484 ↔ 炫彩山山脚 445 ↔ 炫彩山 449 (new) ↔ 山神圣殿 450, and add map scripts
//   for 318 朱雀空间, 445, 449, 450 山神圣殿 and 486 怀特矿场 so 菲尼克斯, 卡修斯, 迪符特 and 德拉萨 can be challenged.
//   FFDec only recompiles classes that already exist, so renamed copies of MapProcess_340 are inserted first as stubs.
// - Server: 卡修斯, 德拉萨, 迪符特 move from 484/0–2 to their original maps (445/0, 486/0, 450/0; SPT ids unchanged);
//   粉粉 and 灵灵 also appear at 445 as the handbook says.
// Usage: node build-white-planet.cjs --baseline <live root> --out <dir> --java <java> --ffdec <ffdec.jar>
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
function encode(source, tags) {
  const body = Buffer.concat([source.header, ...tags]);
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
  const out = [];
  do { let b = n & 0x7f; n = Math.floor(n / 128); if (n) b |= 0x80; out.push(b); } while (n);
  return Buffer.from(out);
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

// ==================== 地图表 ====================
const WHITE_PLANET_OLD = `<map id="484" name="怀特星" x="500" y="360" super="41" sound="BGM_051">
    <Entries/>
    <changeMapComp>
      <component name="door_0" hit="comp_0" targetID="486"/>
    </changeMapComp>
    <funComp/>
  </map>`;
const WHITE_PLANET_NEW = `<map id="484" name="怀特星" x="500" y="360" super="41" sound="BGM_051">
    <Entries>
      <Entry FromMap="445" PosX="116" PosY="520"/>
    </Entries>
    <changeMapComp>
      <component name="door_0" hit="comp_0" targetID="486"/>
      <component name="door_1" hit="comp_1" targetID="445"/>
    </changeMapComp>
    <funComp/>
  </map>`;
// SPT 终端那次已按后期官方地图表登记了 445，门通往这版没有的 479、446；改成接回 484 怀特星和 449 炫彩山
const FOOT_OLD = `<map id="445" name="炫彩山山脚" x="900" y="400" super="484" sound="BGM_10108">
		<Entries>
			<Entry FromMap="479" PosX="900" PosY="397" />
			<Entry FromMap="446" PosX="680" PosY="112" />
		</Entries>
		<changeMapComp>
			<component name="door_0" hit="comp_0" targetID="479" />
			<component name="nextMapHit" hit="comp_2" targetID="446" />
		</changeMapComp>`;
const FOOT_NEW = `<map id="445" name="炫彩山山脚" x="900" y="400" super="484" sound="BGM_10108">
		<Entries>
			<Entry FromMap="484" PosX="900" PosY="397" />
			<Entry FromMap="449" PosX="680" PosY="112" />
		</Entries>
		<changeMapComp>
			<component name="door_0" hit="comp_0" targetID="484" />
			<component name="nextMapHit" hit="comp_2" targetID="449" />
		</changeMapComp>`;
const MOUNTAIN = `  <map id="449" name="炫彩山" x="100" y="460" super="484" sound="BGM_10108">
    <Entries>
      <Entry FromMap="445" PosX="80" PosY="464"/>
      <Entry FromMap="450" PosX="640" PosY="300"/>
    </Entries>
    <changeMapComp>
      <component name="lastMapHit" hit="comp_1" targetID="445"/>
    </changeMapComp>
    <funComp/>
  </map>
`;
function mapTable(source) {
  const ids = [];
  for (const tag of source.tags.filter(t => t.code === 76)) {
    let offset = 2;
    for (let i = 0; i < tag.payload.readUInt16LE(0); i++) {
      const id = tag.payload.readUInt16LE(offset); offset += 2;
      const end = tag.payload.indexOf(0, offset);
      if (tag.payload.subarray(offset, end).toString() === 'com.robot.core.manager.map.config.MapConfig_xmlCls') ids.push(id);
      offset = end + 1;
    }
  }
  const id = only(ids, 'MapConfig symbol');
  const tag = only(source.tags.filter(t => t.code === 87 && t.payload.readUInt16LE(0) === id), 'MapConfig table');
  let xml = tag.payload.subarray(6).toString('utf8');
  assert.equal(xml.split(WHITE_PLANET_OLD).length, 2, '怀特星 entry changed; reconcile before building');
  assert.equal(xml.split(FOOT_OLD).length, 2, '炫彩山山脚 entry changed; reconcile before building');
  assert.ok(!xml.includes('<map id="449"'), 'Map already registered: 449');
  for (const id of [450, 486, 318]) assert.ok(xml.includes(`<map id="${id}"`), 'Map not registered: ' + id);
  xml = xml.replace(WHITE_PLANET_OLD, WHITE_PLANET_NEW).replace(FOOT_OLD, FOOT_NEW);
  const closing = /<\/Maps>\s*$/;
  assert.ok(closing.test(xml), 'Missing </Maps>');
  xml = xml.replace(closing, MOUNTAIN + '$&');
  return {tag, raw: longTag(87, Buffer.concat([tag.payload.subarray(0, 6), Buffer.from(xml, 'utf8')]))};
}

// ==================== Core ====================
const coreRel = 'client/assets/dll/NieoCore.swf', overlayCoreRel = 'client/overlay/dll/NieoCore.swf';
const coreRaw = fs.readFileSync(path.join(baseline, coreRel));
assert.ok(coreRaw.equals(fs.readFileSync(path.join(baseline, overlayCoreRel))), 'Overlay Core differs from assets; resolve baseline first');
const core = parse(coreRaw);
const MAPS = [318, 445, 449, 450, 486];
const keyOf = id => 'com/robot/app/mapProcess/MapProcess_' + id;
const TEMPLATE = keyOf(340);
for (const id of MAPS) assert.ok(!core.tags.some(t => t.name === keyOf(id)), `MapProcess_${id} already in Core`);
const template = only(core.tags.filter(t => t.name === TEMPLATE), TEMPLATE);
const at = core.tags.indexOf(template) + 1;
const stubTags = core.tags.map(t => t.raw);
stubTags.splice(at, 0, ...MAPS.map(id => stubFrom(template, 'MapProcess_340', 'MapProcess_' + id)));
const compiler = path.join(out, 'compiler');
for (const id of MAPS) {
  const target = path.join(compiler, 'import/scripts', keyOf(id) + '.as');
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(path.join(root, `compat/client-patches/white-planet/MapProcess_${id}.as`), target);
}
fs.writeFileSync(path.join(compiler, 'stub.swf'), encode(core, stubTags));
execFileSync(v.java, ['-Djava.awt.headless=true', '-jar', v.ffdec, '-onerror', 'abort', '-importScript',
  path.join(compiler, 'stub.swf'), path.join(compiler, 'compiled.swf'), path.join(compiler, 'import')], {stdio: 'inherit', timeout: 120000});
const compiled = parse(fs.readFileSync(path.join(compiler, 'compiled.swf')));
assert.equal(compiled.tags.length, stubTags.length, 'Compiled Core tag count changed');
const classTags = [];
compiled.tags.forEach((t, i) => {
  if (i >= at && i < at + MAPS.length) {
    assert.equal(t.name, keyOf(MAPS[i - at]), 'Compiled class order');
    assert.ok(!t.raw.equals(stubTags[i]), `${t.name} was not compiled`);
    classTags.push(t.raw);
  } else assert.ok(t.raw.equals(stubTags[i]), 'Unrelated Core tag changed: ' + (t.name || t.code));
});
const maps = mapTable(core);
const finalTags = core.tags.map(t => t === maps.tag ? maps.raw : t.raw);
finalTags.splice(at, 0, ...classTags);
const coreBytes = encode(core, finalTags);
assert.equal(parse(coreBytes).tags.length, core.tags.length + MAPS.length, 'Final Core tag count');
put(coreRel, coreBytes);
put(overlayCoreRel, coreBytes);

// ==================== 服务端：BOSS 回到原版地图，445 加粉粉、灵灵 ====================
const bossRel = 'app/config/data/json/boss_abilities.json';
const bossConfig = JSON.parse(fs.readFileSync(path.join(baseline, bossRel), 'utf8'));
for (const [from, to, petId] of [[[484, 0], [445, 0], 798], [[484, 1], [486, 0], 715], [[484, 2], [450, 0], 804]]) {
  const boss = only(bossConfig.bossConfigs.filter(b => b.mapId === from[0] && b.param2 === from[1]), `boss ${from}`);
  assert.equal(boss.petId, petId, `boss ${from} species`);
  assert.ok(!bossConfig.bossConfigs.some(b => b.mapId === to[0]), `map ${to[0]} already has a boss`);
  [boss.mapId, boss.param2] = to;
}
put(bossRel, JSON.stringify(bossConfig, null, 2) + '\n');
const ogreRel = 'app/config/data/json/map-ogres.json';
const ogres = JSON.parse(fs.readFileSync(path.join(baseline, ogreRel), 'utf8'));
const foot = ogres.maps['445'];
assert.equal(foot?.name, '炫彩山山脚', '445 spawn entry');
assert.deepEqual(foot.ogres.map(o => o.petId), [766, 767], '445 spawns changed; reconcile before building');
for (const petId of [775, 776]) {
  const sample = only(ogres.maps['484'].ogres.filter(o => o.petId === petId), `484 spawn ${petId}`);
  foot.ogres.push({...JSON.parse(JSON.stringify(sample)), slot: foot.ogres.length, minLevel: 60, maxLevel: 63});
}
put(ogreRel, JSON.stringify(ogres, null, 2) + '\n');

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, restartWeb: false, databaseMigration: false,
  newCoreClasses: MAPS.map(keyOf), changedEmbeddedTables: ['MapConfig'], unrelatedCoreTagsPreserved: true,
  guards: 'SWF tags checked; verify before SHA256 at deployment'}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length}));
