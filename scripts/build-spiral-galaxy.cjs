'use strict';
// Build the 螺旋星系 release (巨石星 and 艾伦星) from a captured live root (client/ and app/):
// - client/overlay/resource/worldMap.swf: the world map gains galaxy_5, a green copy of 卡兰星系's spiral without its planets.
// - client/overlay/module/.../subMap/Galaxy_5.swf: XIN's fifth-galaxy module (user-approved download) with its document
//   class renamed Galaxy_5 and rewritten for this client; the bundled XIN Core classes are pruned.
// - Core (assets and overlay copies): galaxy 5 in the galaxy table, the planets' hover entries, 14 maps in the map table,
//   and 12 map scripts that hide story objects (stubs from MapProcess_340, then recompiled).
// - Server: the existing 巨石岛 702 and 浅滩海岛 29 pools move to the post-story maps 925 and 926; the handbook's
//   巨石星 and 艾伦星 pets join or get pools.
// Usage: node build-spiral-galaxy.cjs --baseline <live root> --galaxy <XIN Galaxy_5.swf> --out <dir> --java <java> --ffdec <ffdec.jar>
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const names = ['baseline', 'galaxy', 'out', 'java', 'ffdec'];
const {values: v} = parseArgs({options: Object.fromEntries(names.map(n => [n, {type: 'string'}]))});
for (const n of names) if (!v[n]) throw Error('Missing --' + n);
const baseline = path.resolve(v.baseline), out = path.resolve(v.out), root = path.resolve(__dirname, '..');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const GALAXY_SHA = '9d79eeda6c61a27cac3d4d1c0793fd13f29ef1c8893472a98333b84af78feecb';
const files = [];
const compiler = path.join(out, 'compiler');
const ffdec = (...args) => execFileSync(v.java, ['-Djava.awt.headless=true', '-jar', v.ffdec, ...args], {stdio: 'inherit', timeout: 300000});

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
const charId = tag => tag.payload.readUInt16LE(0);

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
function renamedAbcTag(tag, from, to) {
  const nameEnd = tag.payload.indexOf(0, 4);
  const {abc, renamed} = renameInAbc(tag.payload.subarray(nameEnd + 1), from, to);
  assert.ok(renamed > 0, 'ABC rename found nothing');
  const name = Buffer.from(tag.name.split(from).join(to) + '\0');
  return longTag(82, Buffer.concat([tag.payload.subarray(0, 4), name, abc]));
}
function renamedSymbolTag(tag, from, to) {
  const entries = [];
  let offset = 2;
  for (let i = 0; i < tag.payload.readUInt16LE(0); i++) {
    const id = tag.payload.readUInt16LE(offset); offset += 2;
    const end = tag.payload.indexOf(0, offset);
    entries.push([id, tag.payload.subarray(offset, end).toString().split(from).join(to)]);
    offset = end + 1;
  }
  const count = Buffer.alloc(2); count.writeUInt16LE(entries.length);
  return longTag(76, Buffer.concat([count, ...entries.map(([id, name]) => {
    const b = Buffer.alloc(2); b.writeUInt16LE(id); return Buffer.concat([b, Buffer.from(name + '\0')]);
  })]));
}

// ==================== 地图表、星球说明、星系表 ====================
const entry = ({id, name, x, y, planet, sound, from, doors}) => [
  `  <map id="${id}" name="${name}" x="${x}" y="${y}" super="${planet}" sound="${sound}">`,
  '    <Entries>', ...from.map(([map, px, py]) => `      <Entry FromMap="${map}" PosX="${px}" PosY="${py}"/>`), '    </Entries>',
  '    <changeMapComp>', ...doors.map(([door, target]) => `      <component name="door_${door}" hit="hit_${door}" targetID="${target}"/>`), '    </changeMapComp>',
  '    <funComp/>', '  </map>', ''].join('\n');
// 名称、出生点、音乐和门按 XIN 地图表；XIN 用剧情脚本开的门改成普通门，没写的进场点取门旁可走的位置（地图碰撞层核对过）。
// 925、926 是剧情结束后的巨石岛、浅滩海岛；麦田村 38 不在任何地图表，名字取自图鉴古古的介绍，音乐沿用烟水迷阵。
const MAPS = [
  {id: 925, name: '巨石岛', x: 110, y: 420, planet: 702, sound: 'BGM_132', from: [[704, 781, 212]], doors: [[1, 704]]},
  {id: 704, name: '熔岩大地', x: 340, y: 370, planet: 702, sound: 'BGM_10018', from: [[925, 209, 411], [705, 189, 205], [706, 850, 220]], doors: [[0, 925], [1, 705], [2, 706]]},
  {id: 705, name: '熔岩地心', x: 100, y: 450, planet: 702, sound: 'BGM_132', from: [[704, 189, 462]], doors: [[0, 704]]},
  {id: 706, name: '石源密林', x: 200, y: 450, planet: 702, sound: 'BGM_10091', from: [[704, 218, 417], [708, 745, 375]], doors: [[0, 704], [1, 708]]},
  {id: 708, name: '黑风崖', x: 230, y: 450, planet: 702, sound: 'BGM_10098', from: [[706, 262, 322], [709, 560, 230]], doors: [[0, 706], [1, 709]]},
  {id: 709, name: '巨石营地', x: 475, y: 450, planet: 702, sound: 'BGM_10098', from: [[708, 574, 432]], doors: [[0, 708]]},
  {id: 926, name: '浅滩海岛', x: 430, y: 470, planet: 29, sound: 'BGM_133', from: [[710, 639, 406]], doors: [[0, 710]]},
  {id: 710, name: '珊瑚海礁', x: 390, y: 480, planet: 29, sound: 'BGM_10084', from: [[926, 417, 432], [712, 435, 305]], doors: [[0, 926], [1, 712]]},
  {id: 712, name: '水月洞壁', x: 430, y: 274, planet: 29, sound: 'BGM_136', from: [[710, 468, 267], [713, 500, 450], [715, 660, 315]], doors: [[0, 710], [1, 713], [2, 715]]},
  {id: 713, name: '烟水迷阵', x: 800, y: 450, planet: 29, sound: 'BGM_10097', from: [[712, 763, 395], [38, 770, 225]], doors: [[0, 712], [1, 38]]},
  {id: 715, name: '幽暗洞穴', x: 45, y: 350, planet: 29, sound: 'BGM_10085', from: [[712, 100, 251], [716, 794, 439]], doors: [[0, 712], [1, 716]]},
  {id: 716, name: '流沙地洞', x: 790, y: 414, planet: 29, sound: 'BGM_10086', from: [[715, 814, 439]], doors: [[1, 715]]},
  {id: 718, name: '翡翠山谷', x: 850, y: 400, planet: 29, sound: 'BGM_095', from: [[38, 767, 393]], doors: [[0, 38]]},
  {id: 38, name: '麦田村', x: 480, y: 400, planet: 29, sound: 'BGM_10097', from: [[713, 235, 375], [718, 523, 189]], doors: [[0, 713], [1, 718]]},
];
const INTRO = `  <map id="925" difficulty="5" level="60以上" des="巨石星">
    <sprite petIDs="吉塔|列特|凯拉|阿凯|森卡尔|安普"/>
  </map>
  <map id="926" difficulty="5" level="30-40" des="艾伦星">
    <sprite petIDs="塔塔|森卡尔|小海牙|海魂|沃沃尔|朵莉|努努"/>
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
  const binary = symbol => only(core.tags.filter(t => t.code === 87 && charId(t) === symbolIds[symbol]), symbol);
  const edit = (symbol, change) => {
    const tag = binary(symbol);
    const text = change(tag.payload.subarray(6).toString('utf8'));
    return [tag, longTag(87, Buffer.concat([tag.payload.subarray(0, 6), Buffer.from(text, 'utf8')]))];
  };
  const maps = edit('com.robot.core.manager.map.config.MapConfig_xmlCls', xml => {
    for (const m of MAPS) assert.ok(!xml.includes(`<map id="${m.id}"`), 'Map already registered: ' + m.id);
    assert.equal(xml.split('</Maps>').length, 2, 'Map table end');
    return xml.replace('</Maps>', MAPS.map(entry).join('') + '</Maps>');
  });
  const intro = edit('com.robot.core.config.xml.MapIntroXMLInfo_xmlClass', xml => {
    assert.ok(!/<map id="92[56]"/.test(xml), 'Planet hover entry exists');
    const end = xml.lastIndexOf('</map>');
    return xml.slice(0, end) + INTRO + xml.slice(end);
  });
  const galaxies = edit('com.robot.core.config.xml.GalaxyXMLInfo_xmlClass', xml => {
    assert.ok(!xml.includes('<galaxy id="5"'), 'Galaxy 5 exists');
    assert.equal(xml.split('</root>').length, 2, 'Galaxy table end');
    return xml.replace('</root>', '\t<galaxy id="5" name="螺旋星系">\r\n\t</galaxy>\r\n</root>');
  });
  return new Map([maps, intro, galaxies]);
}

// ==================== Core ====================
const coreRel = 'client/assets/dll/NieoCore.swf', overlayCoreRel = 'client/overlay/dll/NieoCore.swf';
const coreRaw = fs.readFileSync(path.join(baseline, coreRel));
assert.ok(coreRaw.equals(fs.readFileSync(path.join(baseline, overlayCoreRel))), 'Overlay Core differs from assets; resolve baseline first');
const core = parse(coreRaw);
const SCRIPTS = [704, 705, 706, 708, 709, 710, 712, 713, 715, 718, 38, 926];
const keyOf = id => 'com/robot/app/mapProcess/MapProcess_' + id;
for (const m of MAPS) assert.ok(!core.tags.some(t => t.name === keyOf(m.id)), `MapProcess_${m.id} already in Core`);
const template = only(core.tags.filter(t => t.name === keyOf(340)), 'MapProcess_340');
const at = core.tags.indexOf(template) + 1;
const stubTags = core.tags.map(t => t.raw);
stubTags.splice(at, 0, ...SCRIPTS.map(id => renamedAbcTag(template, 'MapProcess_340', 'MapProcess_' + id)));
for (const id of SCRIPTS) {
  const target = path.join(compiler, 'core/import/scripts', keyOf(id) + '.as');
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(path.join(root, `compat/client-patches/spiral-galaxy/MapProcess_${id}.as`), target);
}
fs.writeFileSync(path.join(compiler, 'core/stub.swf'), encode(core, stubTags));
ffdec('-onerror', 'abort', '-importScript', path.join(compiler, 'core/stub.swf'), path.join(compiler, 'core/compiled.swf'), path.join(compiler, 'core/import'));
const compiled = parse(fs.readFileSync(path.join(compiler, 'core/compiled.swf')));
assert.equal(compiled.tags.length, stubTags.length, 'Compiled Core tag count changed');
const classTags = [];
compiled.tags.forEach((t, i) => {
  if (i >= at && i < at + SCRIPTS.length) {
    assert.equal(t.name, keyOf(SCRIPTS[i - at]), 'Compiled class order');
    assert.ok(!t.raw.equals(stubTags[i]), `${t.name} was not compiled`);
    classTags.push(t.raw);
  } else assert.ok(t.raw.equals(stubTags[i]), 'Unrelated Core tag changed: ' + (t.name || t.code));
});
const tables = tableTags(core);
const coreTags = core.tags.map(t => tables.get(t) || t.raw);
coreTags.splice(at, 0, ...classTags);
const coreBytes = encode(core, coreTags);
assert.equal(parse(coreBytes).tags.length, core.tags.length + SCRIPTS.length, 'Final Core tag count');
put(coreRel, coreBytes);
put(overlayCoreRel, coreBytes);

// ==================== 螺旋星系模块 ====================
const galaxyRaw = fs.readFileSync(path.resolve(v.galaxy));
assert.equal(sha(galaxyRaw), GALAXY_SHA, 'Unexpected XIN Galaxy_5 module');
const galaxy = parse(galaxyRaw);
const galaxyAbc = only(galaxy.tags.filter(t => t.code === 82), 'module ABC');
const galaxySymbols = only(galaxy.tags.filter(t => t.code === 76), 'module symbols');
// XIN 的模块类叫 Galaxy_4；改名后与裂空星系模块区分，再用本仓库源码重编
const renamedModule = encode(galaxy, galaxy.tags.map(t => t === galaxyAbc ? renamedAbcTag(t, 'Galaxy_4', 'Galaxy_5')
  : t === galaxySymbols ? renamedSymbolTag(t, 'Galaxy_4', 'Galaxy_5') : t.raw));
const moduleDir = path.join(compiler, 'module');
fs.mkdirSync(path.join(moduleDir, 'import/scripts/com/robot/module/app/subMap'), {recursive: true});
fs.writeFileSync(path.join(moduleDir, 'renamed.swf'), renamedModule);
fs.copyFileSync(path.join(root, 'compat/client-patches/spiral-galaxy/Galaxy_5.as'), path.join(moduleDir, 'import/scripts/com/robot/module/app/subMap/Galaxy_5.as'));
const m = name => path.join(moduleDir, name);
ffdec('-onerror', 'abort', '-importScript', m('renamed.swf'), m('compiled.swf'), m('import'));
ffdec('-swf2xml', m('compiled.swf'), m('export.xml'));
execFileSync('python3', ['-I', path.join(root, 'scripts/prune-spiral-galaxy-module.py'), m('export.xml'), m('owned.xml')], {stdio: 'inherit', timeout: 120000});
ffdec('-xml2swf', m('owned.xml'), m('owned.swf'));
ffdec('-abcclean', m('owned.swf'), m('cleaned.swf'));
const cleaned = parse(fs.readFileSync(m('cleaned.swf')));
const moduleBytes = encode(galaxy, galaxy.tags.map(t => t === galaxyAbc ? only(cleaned.tags.filter(c => c.code === 82), 'cleaned ABC').raw
  : t === galaxySymbols ? only(cleaned.tags.filter(c => c.code === 76), 'cleaned symbols').raw : t.raw));
const moduleCheck = parse(moduleBytes);
assert.ok(moduleCheck.tags.length === galaxy.tags.length && moduleCheck.tags.every((t, i) =>
  t.code === 82 || t.code === 76 || t.raw.equals(galaxy.tags[i].raw)), 'Only the module code may change');
put('client/overlay/module/com/robot/module/app/subMap/Galaxy_5.swf', moduleBytes);

// ==================== 星图：第五个星系图标 ====================
const worldRel = 'resource/worldMap.swf';
const worldRaw = fs.readFileSync(path.join(baseline, 'client/assets', worldRel));
assert.ok(!fs.existsSync(path.join(baseline, 'client/overlay', worldRel)), 'Overlay world map exists; reconcile before building');
const world = parse(worldRaw);
const worldDir = path.join(compiler, 'world');
fs.mkdirSync(worldDir, {recursive: true});
fs.writeFileSync(path.join(worldDir, 'live.swf'), worldRaw);
ffdec('-swf2xml', path.join(worldDir, 'live.swf'), path.join(worldDir, 'live.xml'));
let worldXml = fs.readFileSync(path.join(worldDir, 'live.xml'), 'utf8');
const DEFINITIONS = new Set([2, 6, 7, 10, 11, 13, 14, 20, 21, 22, 32, 33, 34, 35, 36, 37, 39, 46, 48, 60, 62, 75, 83, 84, 87, 88, 90, 91]);
const newId = Math.max(...world.tags.filter(t => DEFINITIONS.has(t.code)).map(charId)) + 1;
function element(text, start) {
  const token = /<item\b[^>]*?(\/?)>|<\/item>/g;
  token.lastIndex = start;
  let depth = 0, match;
  while ((match = token.exec(text))) {
    if (match[0] === '</item>') depth--;
    else if (!match[1]) depth++;
    if (depth === 0) return text.slice(start, token.lastIndex);
  }
  throw Error('Unclosed XML element');
}
// galaxy_2（卡兰星系）的螺旋：去掉 8 个星球图层，其余保持
const PLANET_LAYERS = new Set([73, 75, 77, 79, 81, 83, 85, 89]);
const spiralStart = worldXml.indexOf('<item type="DefineButton2Tag" buttonId="91"');
assert.ok(spiralStart > 0, 'galaxy_2 button');
const spiral = element(worldXml, spiralStart);
let kept = 0, dropped = 0;
const records = spiral.replace(/\s*<item type="BUTTONRECORD"[^>]*?characterId="(\d+)"[^>]*>[\s\S]*?<\/item>(?=\s*<item type="BUTTONRECORD"|\s*<\/characters>)/g, (record, id) => {
  if (PLANET_LAYERS.has(+id)) { dropped++; return ''; }
  kept++; return record;
});
assert.equal(dropped, PLANET_LAYERS.size, 'Planet layers in galaxy_2');
const fifth = records.replace('buttonId="91"', `buttonId="${newId}"`);
worldXml = worldXml.slice(0, spiralStart + spiral.length) + '\n' + fifth + worldXml.slice(spiralStart + spiral.length);
const galaxyLayer = worldXml.indexOf('spriteId="185"');
assert.ok(galaxyLayer > 0 && worldXml.slice(galaxyLayer, galaxyLayer + 6000).includes('name="galaxy_4"'), 'galaxyMC layer');
const showFrame = worldXml.indexOf('<item type="ShowFrameTag"', galaxyLayer);
// 放在罗格星系与返回按钮之间的空处，缩小一半，偏绿黄色以区别其余四个星系
const placement = `<item type="PlaceObject2Tag" characterId="${newId}" depth="271" forceWriteAsLong="true" name="galaxy_5" placeFlagHasCharacter="true" placeFlagHasClipActions="false" placeFlagHasClipDepth="false" placeFlagHasColorTransform="true" placeFlagHasMatrix="true" placeFlagHasName="true" placeFlagHasRatio="false" placeFlagMove="false">
          <matrix type="MATRIX" hasRotate="false" hasScale="true" nRotateBits="0" nScaleBits="17" nTranslateBits="16" scaleX="0.5" scaleY="0.5" translateX="11620" translateY="840"/>
          <colorTransform type="CXFORMWITHALPHA" alphaAddTerm="0" alphaMultTerm="256" blueAddTerm="0" blueMultTerm="90" greenAddTerm="0" greenMultTerm="256" hasAddTerms="true" hasMultTerms="true" nbits="10" redAddTerm="40" redMultTerm="230"/>
        </item>
        `;
worldXml = worldXml.slice(0, showFrame) + placement + worldXml.slice(showFrame);
fs.writeFileSync(path.join(worldDir, 'fifth.xml'), worldXml);
ffdec('-xml2swf', path.join(worldDir, 'fifth.xml'), path.join(worldDir, 'fifth.swf'));
// FFDec 会重新编码其他形状，只取新按钮和改过的星系层，其余标签保持原字节
const rebuilt = parse(fs.readFileSync(path.join(worldDir, 'fifth.swf')));
const button = only(rebuilt.tags.filter(t => t.code === 34 && charId(t) === newId), 'galaxy_5 button');
const layer = only(rebuilt.tags.filter(t => t.code === 39 && charId(t) === 185), 'galaxyMC layer');
const spiralTag = only(world.tags.filter(t => t.code === 34 && charId(t) === 91), 'galaxy_2 tag');
const oldLayer = only(world.tags.filter(t => t.code === 39 && charId(t) === 185), 'galaxyMC tag');
assert.ok(layer.payload.length > oldLayer.payload.length && layer.payload.includes(Buffer.from('galaxy_5\0')), 'galaxy_5 placement');
const worldTags = [];
for (const t of world.tags) {
  worldTags.push(t === oldLayer ? layer.raw : t.raw);
  if (t === spiralTag) worldTags.push(button.raw);
}
const worldBytes = encode(world, worldTags);
assert.equal(parse(worldBytes).tags.length, world.tags.length + 1, 'World map tag count');
put('client/overlay/' + worldRel, worldBytes);

// ==================== 服务端：野怪 ====================
const ogreRel = 'app/config/data/json/map-ogres.json';
const ogreText = fs.readFileSync(path.join(baseline, ogreRel), 'utf8');
const ogres = JSON.parse(ogreText);
assert.equal(JSON.stringify(ogres, null, 2) + '\n', ogreText, 'map-ogres.json formatting changed');
const pools = ogres.maps;
for (const id of ['925', '926', '706', '709', '712', '713', '718']) assert.ok(!pools[id], 'Pool exists: ' + id);
assert.deepEqual(pools['702'].ogres.map(o => o.petId), [1090, 1091], '巨石岛 pool changed; reconcile before building');
assert.deepEqual(pools['29'].ogres.map(o => o.petId), [1112, 872, 874], '浅滩海岛 pool changed; reconcile before building');
assert.deepEqual(pools['704'].ogres.map(o => o.petId), [1094], '熔岩大地 pool changed; reconcile before building');
// 原有的 702、29 两池原样搬到落地图 925、926（名字按地图表），其余按图鉴：等级、刷新和掉落沿用同星球第一只野怪
const rekey = (from, to, name) => {
  const entries = Object.entries(ogres.maps).map(([k, val]) => k === from ? [to, {...val, name}] : [k, val]);
  ogres.maps = Object.fromEntries(entries);
};
rekey('702', '925', '巨石岛');
rekey('29', '926', '浅滩海岛');
const rock = ogres.maps['704'], sea = ogres.maps['926'];
const add = (pool, template, petId) => {
  const weight = Math.round(pool.ogres.reduce((s, o) => s + o.weight, 0) / pool.ogres.length);
  pool.ogres.push({...structuredClone(template.ogres[0]), slot: pool.ogres.length, petId, shiny: 0, weight});
};
add(rock, rock, 1096); // 凯拉
add(sea, sea, 1128); // 塔塔
const fresh = (template, name, petId) => {
  const {ogres: _, ...settings} = structuredClone(template);
  return {...settings, name, ogres: [{...structuredClone(template.ogres[0]), slot: 0, petId, shiny: 0, weight: 100}]};
};
const NEW_POOLS = [['706', rock, '石源密林', 1100], ['709', rock, '巨石营地', 1118], ['712', sea, '水月洞壁', 1135],
  ['713', sea, '烟水迷阵', 1139], ['718', sea, '翡翠山谷', 1150]];
for (const [id, template, name, petId] of NEW_POOLS) ogres.maps[id] = fresh(template, name, petId);
put(ogreRel, JSON.stringify(ogres, null, 2) + '\n');

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, restartWeb: false, databaseMigration: false,
  newCoreClasses: SCRIPTS.map(keyOf), changedEmbeddedTables: ['MapConfig', 'MapIntroXMLInfo', 'GalaxyXMLInfo'], newMaps: MAPS.map(x => x.id),
  galaxyButton: newId, keptSpiralLayers: kept, unrelatedCoreTagsPreserved: true}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length, newMaps: MAPS.length, scripts: SCRIPTS.length}));
