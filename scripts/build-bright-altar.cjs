'use strict';
// Build the 光明圣坛 release from a captured live root (client/ and app/):
// - Core (assets and overlay copies): name the SPT terminal's placeholder map 9507 光明圣坛 with a walkable spawn point,
//   and add MapProcess_9507 (click 布莱克 → dialog → 1v1 boss fight).
//   FFDec only recompiles classes that already exist, so a renamed copy of MapProcess_340 is inserted first as a stub.
// - client/overlay/resource/map/9507.swf: the 光明圣坛 map downloaded from the XIN site (user-approved, 2026-10-20).
// - Server: 布莱克 boss at 9507/0 and the 光明圣坛 wild pets; BattleManager (dist only) enforces the one-pet duel.
// Usage: node build-bright-altar.cjs --baseline <live root> --map <9507.swf> --out <dir> --context <ts> --java <java> --ffdec <ffdec.jar>
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const names = ['baseline', 'map', 'out', 'context', 'java', 'ffdec'];
const {values: v} = parseArgs({options: Object.fromEntries(names.map(n => [n, {type: 'string'}]))});
for (const n of names) if (!v[n]) throw Error('Missing --' + n);
const baseline = path.resolve(v.baseline), out = path.resolve(v.out), root = path.resolve(__dirname, '..');
const ts = require(path.join(path.resolve(v.context), 'node_modules/typescript'));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const MAP_SHA = '0c8c4e3e61efdcaee6af6b7d87e5621a2cdf0dc77dc9be44dd71c8911f543842';
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

// ==================== 地图表：SPT 终端已登记的占位条目改成光明圣坛 ====================
const PLACEHOLDER = '<map id="9507" name="地图9507" x="400" y="400" sound="BGM_055">';
const ALTAR = '<map id="9507" name="光明圣坛" x="560" y="470" sound="BGM_055">';
function renameMap(source) {
  let symbolIds = [];
  for (const tag of source.tags.filter(t => t.code === 76)) {
    let offset = 2;
    for (let i = 0; i < tag.payload.readUInt16LE(0); i++) {
      const id = tag.payload.readUInt16LE(offset); offset += 2;
      const end = tag.payload.indexOf(0, offset);
      if (tag.payload.subarray(offset, end).toString() === 'com.robot.core.manager.map.config.MapConfig_xmlCls') symbolIds.push(id);
      offset = end + 1;
    }
  }
  const id = only(symbolIds, 'MapConfig symbol');
  const tag = only(source.tags.filter(t => t.code === 87 && t.payload.readUInt16LE(0) === id), 'MapConfig table');
  const xml = tag.payload.subarray(6).toString('utf8');
  assert.equal(xml.split(PLACEHOLDER).length, 2, 'Map 9507 is not the SPT terminal placeholder; reconcile before building');
  return {tag, raw: longTag(87, Buffer.concat([tag.payload.subarray(0, 6), Buffer.from(xml.replace(PLACEHOLDER, ALTAR), 'utf8')]))};
}

// ==================== Core ====================
const coreRel = 'client/assets/dll/NieoCore.swf', overlayCoreRel = 'client/overlay/dll/NieoCore.swf';
const coreRaw = fs.readFileSync(path.join(baseline, coreRel));
assert.ok(coreRaw.equals(fs.readFileSync(path.join(baseline, overlayCoreRel))), 'Overlay Core differs from assets; resolve baseline first');
const core = parse(coreRaw);
const KEY = 'com/robot/app/mapProcess/MapProcess_9507', TEMPLATE = 'com/robot/app/mapProcess/MapProcess_340';
assert.ok(!core.tags.some(t => t.name === KEY), 'MapProcess_9507 already in Core');
const template = only(core.tags.filter(t => t.name === TEMPLATE), TEMPLATE);
const at = core.tags.indexOf(template) + 1;
const stubTags = core.tags.map(t => t.raw);
stubTags.splice(at, 0, stubFrom(template, 'MapProcess_340', 'MapProcess_9507'));
const compiler = path.join(out, 'compiler');
const imports = path.join(compiler, 'import/scripts', KEY + '.as');
fs.mkdirSync(path.dirname(imports), {recursive: true});
fs.copyFileSync(path.join(root, 'compat/client-patches/bright-altar/MapProcess_9507.as'), imports);
fs.writeFileSync(path.join(compiler, 'stub.swf'), encode(core, stubTags));
execFileSync(v.java, ['-Djava.awt.headless=true', '-jar', v.ffdec, '-onerror', 'abort', '-importScript',
  path.join(compiler, 'stub.swf'), path.join(compiler, 'compiled.swf'), path.join(compiler, 'import')], {stdio: 'inherit', timeout: 120000});
const compiled = parse(fs.readFileSync(path.join(compiler, 'compiled.swf')));
assert.equal(compiled.tags.length, stubTags.length, 'Compiled Core tag count changed');
compiled.tags.forEach((t, i) => { if (i !== at) assert.ok(t.raw.equals(stubTags[i]), 'Unrelated Core tag changed: ' + (t.name || t.code)); });
const classTag = compiled.tags[at];
assert.equal(classTag.name, KEY, 'Compiled class missing');
assert.ok(!classTag.raw.equals(stubTags[at]), 'MapProcess_9507 was not compiled');
const maps = renameMap(core);
const finalTags = core.tags.map(t => t === maps.tag ? maps.raw : t.raw);
finalTags.splice(at, 0, classTag.raw);
const coreBytes = encode(core, finalTags);
const check = parse(coreBytes);
assert.equal(check.tags.length, core.tags.length + 1, 'Final Core tag count');
put(coreRel, coreBytes);
put(overlayCoreRel, coreBytes);

// ==================== 地图资源 ====================
const mapRel = 'client/overlay/resource/map/9507.swf';
assert.ok(!fs.existsSync(path.join(baseline, mapRel)) && !fs.existsSync(path.join(baseline, 'client/assets/resource/map/9507.swf')), 'Map 9507 already on the baseline');
const mapBytes = fs.readFileSync(path.resolve(v.map));
assert.equal(sha(mapBytes), MAP_SHA, 'Downloaded 光明圣坛 map changed');
put(mapRel, mapBytes);

// ==================== 服务端配置 ====================
const spec = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/bright-altar/bright-altar.json'), 'utf8'));
const bossRel = 'app/config/data/json/boss_abilities.json';
const bossConfig = JSON.parse(fs.readFileSync(path.join(baseline, bossRel), 'utf8'));
assert.ok(!bossConfig.bossConfigs.some(b => b.mapId === spec.boss.mapId), 'Boss map 9507 already configured');
assert.ok(!bossConfig.bossConfigs.some(b => b.spt?.sptId === spec.boss.spt.sptId), 'SPT id taken');
// 线上斯普林特、缪斯两条缺 abilities，BossAbilityConfig.Load 遍历到它们就抛错，之后的条目（包括这里新加的布莱克）都不会登记
const missingAbilities = bossConfig.bossConfigs.filter(b => !Array.isArray(b.abilities));
assert.deepEqual(missingAbilities.map(b => `${b.mapId}/${b.param2}`), ['495/0', '932/0'], 'Unexpected boss entries without abilities');
for (const b of missingAbilities) b.abilities = [];
bossConfig.bossConfigs.push(spec.boss);
put(bossRel, JSON.stringify(bossConfig, null, 2) + '\n');
const ogreRel = 'app/config/data/json/map-ogres.json';
const ogres = JSON.parse(fs.readFileSync(path.join(baseline, ogreRel), 'utf8'));
for (const [id, entry] of Object.entries(spec.mapOgres)) {
  assert.ok(!ogres.maps[id], 'Map ogres already set: ' + id);
  ogres.maps[id] = entry;
}
put(ogreRel, JSON.stringify(ogres, null, 2) + '\n');

// ==================== BattleManager（dist）：一对一 ====================
const indentOf = (text, pos) => /^[ \t]*/.exec(text.slice(text.lastIndexOf('\n', pos - 1) + 1))[0];
const name = (n, a) => n.name ? n.name.getText(a) : '';
const methodOf = (n, a) => { let p = n; while (p && !ts.isMethodDeclaration(p)) p = p.parent; return p ? name(p, a) : ''; };
const managerRel = 'app/dist/GameServer/Game/Battle/BattleManager.js';
{
  const text = fs.readFileSync(path.join(baseline, managerRel), 'utf8');
  const ast = ts.createSourceFile(managerRel, text, ts.ScriptTarget.Latest, true);
  const edits = [];
  (function walk(n) {
    if (ts.isVariableDeclaration(n) && name(n, ast) === 'hasHealthyPet' && methodOf(n, ast) === 'CheckPlayerPetDeath') {
      const statement = n.parent.parent, indent = indentOf(text, statement.getStart(ast));
      edits.push({start: statement.getStart(ast), end: statement.getStart(ast), tag: 'singleFaint',
        text: `// 一对一的BOSS（布莱克）：出战精灵倒下即失败\n${indent}`});
      edits.push({start: n.initializer.getStart(ast), end: n.initializer.getStart(ast), tag: 'singleFaint',
        text: '!this._currentBattle.enemy.bossMechanics?.singlePet && '});
    }
    if (ts.isVariableStatement(n) && methodOf(n, ast) === 'ChangePet' && /^const oldPetId = /.test(n.getText(ast))) {
      const indent = indentOf(text, n.getStart(ast));
      edits.push({start: n.getStart(ast), end: n.getStart(ast), tag: 'singleSwitch', text: [
        '// 一对一的BOSS（布莱克）不能换精灵',
        'if (this._currentBattle.enemy.bossMechanics?.singlePet) {',
        "    const message = Buffer.from(`${this._currentBattle.enemy.name}只接受一对一的决斗，不能更换精灵！`, 'utf8');",
        '    const body = Buffer.concat([Buffer.alloc(4), message]);',
        '    body.writeUInt32BE(message.length, 0);',
        '    await this.Player.SendPacket({ getCmdId: () => CommandID_1.CommandID.ALERT, getResult: () => 0, serialize: () => body });',
        '    await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.CHANGE_PET).setResult(900));',
        '    return;',
        '}',
        '',
      ].map(l => l ? indent + l : '').join('\n').slice(indent.length) + indent});
    }
    ts.forEachChild(n, walk);
  })(ast);
  const counts = {};
  for (const e of edits) counts[e.tag] = (counts[e.tag] || 0) + 1;
  assert.deepEqual(counts, {singleFaint: 2, singleSwitch: 1}, 'BattleManager edit points');
  let result = text;
  for (const e of edits.sort((a, b) => b.start - a.start)) result = result.slice(0, e.start) + e.text + result.slice(e.end);
  assert.equal(ts.createSourceFile(managerRel, result, ts.ScriptTarget.Latest, true).parseDiagnostics.length, 0, 'BattleManager syntax');
  put(managerRel, result);
  const mapFile = managerRel + '.map';
  if (fs.existsSync(path.join(baseline, mapFile))) {
    const map = JSON.parse(fs.readFileSync(path.join(baseline, mapFile), 'utf8'));
    if (map.mappings !== '') { map.mappings = ''; put(mapFile, JSON.stringify(map)); }
  }
}

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, restartWeb: false, databaseMigration: false,
  newCoreClasses: [KEY], changedEmbeddedTables: ['MapConfig'], unrelatedCoreTagsPreserved: true,
  guards: 'SWF tags and AST edit points checked; verify before SHA256 at deployment; new files must not exist'}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length}));
