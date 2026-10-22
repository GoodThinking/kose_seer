'use strict';
// Build the 北斗七星殿 release from a captured live root (client/ and app/):
// - Core (assets and overlay copies): 733 北斗七星殿 in the map table, MapProcess_733 (the seven-star seals; stub from
//   MapProcess_340, then recompiled) and the laboratory button that leads there (MapProcess_5 recompiled).
// - Server (dist only): Game/Map/BeidouSeals.js for the seals 贪狼, 巨门 and 文曲 (2313/2311 group 900003), routed from
//   PetCollectHandler; BattleManager gains requiredClaim so 芙洛, the 禄存 guardian at 733/0, waits for 巨门.
// Usage: node build-beidou.cjs --baseline <live root> --out <dir> --java <java> --ffdec <ffdec.jar>
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
function replaceOnce(text, from, to, label) {
  assert.equal(text.split(from).length, 2, label + ' baseline changed; reconcile before building');
  return text.replace(from, () => to);
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

// ==================== 地图表 ====================
const PALACE = `  <map id="733" name="北斗七星殿" x="470" y="305" sound="BGM_065">
    <Entries>
      <Entry FromMap="5" PosX="470" PosY="305"/>
    </Entries>
    <changeMapComp/>
    <funComp/>
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
  assert.ok(!xml.includes('<map id="733"'), 'Map already registered: 733');
  xml = replaceOnce(xml, '</Maps>', PALACE + '</Maps>', 'Map table end');
  return {tag, raw: longTag(87, Buffer.concat([tag.payload.subarray(0, 6), Buffer.from(xml, 'utf8')]))};
}

// ==================== Core ====================
const coreRel = 'client/assets/dll/NieoCore.swf', overlayCoreRel = 'client/overlay/dll/NieoCore.swf';
const coreRaw = fs.readFileSync(path.join(baseline, coreRel));
assert.ok(coreRaw.equals(fs.readFileSync(path.join(baseline, overlayCoreRel))), 'Overlay Core differs from assets; resolve baseline first');
const core = parse(coreRaw);
const PALACE_KEY = 'com/robot/app/mapProcess/MapProcess_733', LAB_KEY = 'com/robot/app/mapProcess/MapProcess_5';
assert.ok(!core.tags.some(t => t.name === PALACE_KEY), 'MapProcess_733 already in Core');
only(core.tags.filter(t => t.name === LAB_KEY), LAB_KEY);
const template = only(core.tags.filter(t => t.name === 'com/robot/app/mapProcess/MapProcess_340'), 'MapProcess_340');
const at = core.tags.indexOf(template) + 1;
const stubTags = core.tags.map(t => t.raw);
stubTags.splice(at, 0, stubFrom(template, 'MapProcess_340', 'MapProcess_733'));
const compiler = path.join(out, 'compiler');
for (const [key, source] of [[PALACE_KEY, 'compat/client-patches/beidou/MapProcess_733.as'], [LAB_KEY, 'compat/client-patches/acquisition-restoration/MapProcess_5.as']]) {
  const target = path.join(compiler, 'import/scripts', key + '.as');
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(path.join(root, source), target);
}
fs.writeFileSync(path.join(compiler, 'stub.swf'), encode(core, stubTags));
execFileSync(v.java, ['-Djava.awt.headless=true', '-jar', v.ffdec, '-onerror', 'abort', '-importScript',
  path.join(compiler, 'stub.swf'), path.join(compiler, 'compiled.swf'), path.join(compiler, 'import')], {stdio: 'inherit', timeout: 300000});
const compiled = parse(fs.readFileSync(path.join(compiler, 'compiled.swf')));
assert.equal(compiled.tags.length, stubTags.length, 'Compiled Core tag count changed');
let palace, lab;
compiled.tags.forEach((t, i) => {
  if (i === at) {
    assert.equal(t.name, PALACE_KEY, 'Compiled class order');
    assert.ok(!t.raw.equals(stubTags[i]), 'MapProcess_733 was not compiled');
    palace = t.raw;
  } else if (t.name === LAB_KEY) {
    assert.ok(!t.raw.equals(stubTags[i]), 'Laboratory class was not recompiled');
    lab = t.raw;
  } else assert.ok(t.raw.equals(stubTags[i]), 'Unrelated Core tag changed: ' + (t.name || t.code));
});
const maps = mapTable(core);
const coreTags = core.tags.map(t => t === maps.tag ? maps.raw : t.name === LAB_KEY ? lab : t.raw);
coreTags.splice(at, 0, palace);
const coreBytes = encode(core, coreTags);
assert.equal(parse(coreBytes).tags.length, core.tags.length + 1, 'Final Core tag count');
put(coreRel, coreBytes);
put(overlayCoreRel, coreBytes);

// ==================== 服务端 ====================
const sealsRel = 'app/dist/GameServer/Game/Map/BeidouSeals.js';
assert.ok(!fs.existsSync(path.join(baseline, sealsRel)), 'BeidouSeals already deployed');
put(sealsRel, fs.readFileSync(path.join(root, 'compat/server-patches/beidou/BeidouSeals.js')));

const collectRel = 'app/dist/GameServer/Server/Packet/Recv/Pet/PetCollectHandler.js';
let collect = fs.readFileSync(path.join(baseline, collectRel), 'utf8');
const statusLine = '        if (groupId === 900001)\n            return require("../../../../Game/Pet/PermanentPetExchange").HandleSignInStatus(player);\n';
collect = replaceOnce(collect, statusLine, statusLine +
  '        if (groupId === 900003)\n            return require("../../../../Game/Map/BeidouSeals").HandleStatus(player);\n', 'IsCollectHandler');
const actionLine = '        if (body.length >= 4 && body.readUInt32BE(0) === 900002) return require("../../../../Game/Pet/Countermarks").Handle(player, body);\n';
collect = replaceOnce(collect, actionLine, actionLine +
  '        if (body.length >= 8 && body.readUInt32BE(0) === 900003) return require("../../../../Game/Map/BeidouSeals").HandleAction(player, body.readUInt32BE(4));\n', 'PetCollectHandler');
put(collectRel, collect);

const battleRel = 'app/dist/GameServer/Game/Battle/BattleManager.js';
let battle = fs.readFileSync(path.join(baseline, battleRel), 'utf8');
const gateEnd = `                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.CHALLENGE_BOSS).setResult(900));
                return;
            }
            // 使用CreateBossBattle方法`;
battle = replaceOnce(battle, gateEnd, `                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.CHALLENGE_BOSS).setResult(900));
                return;
            }
            // 前置封印：例如北斗七星殿的芙洛须先解除巨门封印（receiver_claims 里的记录数）
            const claim = bossConfig?.requiredClaim;
            if (claim && await require("../Map/BeidouSeals").CountClaims(this.Player.Uid, claim.key) < claim.count) {
                const message = Buffer.from(claim.message, 'utf8');
                const body = Buffer.concat([Buffer.alloc(4), message]);
                body.writeUInt32BE(message.length, 0);
                await this.Player.SendPacket({ getCmdId: () => CommandID_1.CommandID.ALERT, getResult: () => 0, serialize: () => body });
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.CHALLENGE_BOSS).setResult(900));
                return;
            }
            // 使用CreateBossBattle方法`, 'BattleManager boss prerequisites');
put(battleRel, battle);

const bossRel = 'app/config/data/json/boss_abilities.json';
const bossText = fs.readFileSync(path.join(baseline, bossRel), 'utf8');
const bosses = JSON.parse(bossText);
assert.equal(JSON.stringify(bosses, null, 2) + '\n', bossText, 'boss_abilities.json formatting changed');
const guardian = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/beidou/lucun-guardian.json'), 'utf8')).bossConfig;
assert.ok(!bosses.bossConfigs.some(b => b.mapId === guardian.mapId), 'Map 733 already has a boss');
assert.ok(!bosses.bossConfigs.some(b => b.spt?.sptId === guardian.spt.sptId), 'SPT id in use: ' + guardian.spt.sptId);
bosses.bossConfigs.push(guardian);
put(bossRel, JSON.stringify(bosses, null, 2) + '\n');

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, restartWeb: false, databaseMigration: false,
  newCoreClasses: [PALACE_KEY], recompiledCoreClasses: [LAB_KEY], changedEmbeddedTables: ['MapConfig'],
  newServerModules: [sealsRel], unrelatedCoreTagsPreserved: true}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length}));
