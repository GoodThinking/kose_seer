'use strict';
// Build the boss notes release from a captured live root (client/ and app/):
// - Server: the six newbie bosses get a starter mechanic and every other boss without a description gets one, from
//   compat/server-patches/boss-locks/notes.json; afterwards every boss in boss_abilities.json has a hint.
// - Core (assets and overlay copies): FightInviteManager shows every boss's mechanic before the challenge (the dark
//   portal doors keep theirs in DarkPortalModel).
// - SptPanel (先锋队终端): the boss list is generated from boss_abilities.json and the Core's own map tables, with level, HP,
//   location, galaxy and the mechanic; both client tables must equal what this build generates.
// Usage: node build-boss-notes.cjs --baseline <live root> --out <dir> --java <java> --ffdec <ffdec.jar>
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
function only(list, label) {
  assert.equal(list.length, 1, 'Expected one ' + label);
  return list[0];
}
function encode(source, rawTags) {
  const body = Buffer.concat([source.header, ...rawTags]);
  const head = Buffer.from(source.raw.subarray(0, 8));
  head.writeUInt32LE(body.length + 8, 4);
  return Buffer.concat([head, zlib.deflateSync(body, {level: 9})]);
}

const dir = path.join(root, 'compat/server-patches/boss-locks');
const read = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
const notes = read('notes.json');
const {gates} = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/train-door/gates.json'), 'utf8'));

// ==================== BOSS 配置：新手机制与说明 ====================
const bossRel = 'app/config/data/json/boss_abilities.json';
const bossText = fs.readFileSync(path.join(baseline, bossRel), 'utf8');
const bosses = JSON.parse(bossText);
assert.equal(JSON.stringify(bosses, null, 2) + '\n', bossText, 'boss_abilities.json formatting changed');
const find = key => {
  const [mapId, param2] = key.split('/').map(Number);
  const list = bosses.bossConfigs.filter(b => b.mapId === mapId && b.param2 === param2);
  assert.equal(list.length, 1, 'One boss at ' + key);
  return list[0];
};
for (const note of [...notes.mechanics, ...notes.describe]) {
  const boss = find(note.boss);
  assert.equal(boss.petName, note.petName, 'Boss at ' + note.boss);
  assert.ok(!boss.hint, 'Boss already described: ' + note.boss);
  boss.hint = note.hint;
  if (note.mechanics) boss.mechanics = {...(boss.mechanics || {}), ...note.mechanics};
  if (note.customHP) boss.customHP = note.customHP;
}
const missing = bosses.bossConfigs.filter(b => !b.hint).map(b => `${b.mapId}/${b.param2} ${b.petName}`);
assert.deepEqual(missing, [], 'Every boss needs a mechanic description');
put(bossRel, JSON.stringify(bosses, null, 2) + '\n');

// ==================== 客户端数据 ====================
const coreRel = 'client/assets/dll/NieoCore.swf', overlayCoreRel = 'client/overlay/dll/NieoCore.swf';
const coreRaw = fs.readFileSync(path.join(baseline, coreRel));
assert.ok(coreRaw.equals(fs.readFileSync(path.join(baseline, overlayCoreRel))), 'Overlay Core differs from assets; resolve baseline first');
const core = parse(coreRaw);
// Core 内嵌的地图表：地图名、所属星球；星球表：星系
const binary = name => {
  const symbols = only(core.tags.filter(t => t.code === 76), 'SymbolClass').payload;
  let at = 2, id;
  for (let i = 0, n = symbols.readUInt16LE(0); i < n; i++) {
    const cid = symbols.readUInt16LE(at), end = symbols.indexOf(0, at + 2);
    if (symbols.subarray(at + 2, end).toString() === name) id = cid;
    at = end + 1;
  }
  return only(core.tags.filter(t => t.code === 87 && t.payload.readUInt16LE(0) === id), name).payload.subarray(6).toString('utf8');
};
const attrs = text => Object.fromEntries([...text.matchAll(/(\w+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
const maps = new Map([...binary('com.robot.core.config.xml.MapXMLInfo_xmlClass').matchAll(/<map ([^>]*)>/g)].map(m => attrs(m[1])).map(a => [+a.id, a]));
const planets = new Map([...binary('com.robot.core.config.xml.SuperMapXMLInfo_xmlClass').matchAll(/<maps ([^>]*)\/>/g)].map(m => attrs(m[1])).map(a => [+a.id, a]));
// 分组沿用终端原有的星系标签；其余按地图所属星球的星系
const GALAXIES = ['帕诺星系', '卡兰星系', '罗格星系', '裂空星系', '神兽空间', '太空站挑战', '暗黑武斗场'];
const GALAXY_OF_MAP = {110: '暗黑武斗场', 102: '太空站挑战', 405: '太空站挑战', 502: '太空站挑战', 514: '神兽空间', 401: '神兽空间', 318: '神兽空间',
  // 星球表里没有星系的地图
  733: '帕诺星系', 9507: '裂空星系', 932: '卡兰星系', 445: '裂空星系', 450: '裂空星系', 495: '卡兰星系'};
// 勇者之塔神秘领域是本地地图，从太空站左翼的勇者之塔进入
const TRAVEL = {514: 108};
const alias = new Set(Object.keys(bosses.mapAlias || {}).map(Number));
const schedule = (bosses.specialRules?.weekdaySchedule || []).map(r => [r.petId, new Set(r.schedules.map(s => s.mapId))]);
const sptBosses = [];
for (const b of bosses.bossConfigs) {
  if (alias.has(b.mapId)) continue;
  if (schedule.some(([pet, at]) => pet === b.petId && !at.has(b.mapId))) continue;
  const map = maps.get(b.mapId);
  assert.ok(map, 'Client map table lacks ' + b.mapId);
  const planet = planets.get(+map.super);
  const galaxy = GALAXY_OF_MAP[b.mapId] || ['', '帕诺星系', '卡兰星系', '罗格星系', '裂空星系'][+planet?.galaxy || 0];
  assert.ok(GALAXIES.includes(galaxy), `No galaxy for ${b.mapId}/${b.param2}`);
  // 地图名不以星球名开头时补上星球名（只比较首字：星球表把云霄星写成了“云宵星”）
  let loc = planet && map.name[0] !== planet.name[0] ? planet.name + '·' + map.name : map.name;
  if (b.mapId === 110 && b.param2 >= 1000) loc = `暗黑武斗场·第${Math.floor((b.param2 - 1000) / 6) + 1}门`;
  if (b.mapId === 102) loc = `训练师之门（${only(gates.filter(g => g.param2 === b.param2), 'gate ' + b.param2).type}系）`;
  if (b.mapId === 514) loc = b.param2 === 8 ? '勇者之塔神秘领域·谱尼真身' : `勇者之塔神秘领域·第${b.param2}封印`;
  sptBosses.push({galaxy, door: b.mapId === 110 ? b.param2 : 0, entry: {id: b.petId, name: b.petName, galaxy, loc, mapId: TRAVEL[b.mapId] || b.mapId, lv: b.level, hp: b.customHP || 0, sptId: b.spt?.sptId || 0, mech: b.hint}});
}
sptBosses.sort((p, q) => GALAXIES.indexOf(p.galaxy) - GALAXIES.indexOf(q.galaxy) || p.door - q.door);
const sptLiteral = '[' + sptBosses.map(x => JSON.stringify(x.entry)).join(', ') + ']';
const doors = read('dark-portal.json').locks.filter(l => l.boss.startsWith('110/10')).map(l => l.boss);
const inviteHints = bosses.bossConfigs.filter(b => !doors.includes(`${b.mapId}/${b.param2}`)).map(b => `"${b.mapId}/${b.param2}":"${b.hint}"`);
const inviteTable = '{' + inviteHints.join(',') + '}';
const sources = {
  invite: 'compat/client-patches/boss-locks/FightInviteManager.as',
  spt: 'compat/client-patches/spt-all-bosses/SptPanel.as'
};
const expect = {invite: `private static const BOSS_HINTS:Object = ${inviteTable};`, spt: `private const BOSSES:Array = ${sptLiteral};`};
assert.ok(fs.readFileSync(path.join(root, sources.spt), 'utf8').includes(`private const GALAXIES:Array = ${JSON.stringify(['全部', ...GALAXIES])};`), 'SptPanel tabs differ from GALAXIES');
fs.mkdirSync(out, {recursive: true});
const stale = Object.keys(expect).filter(k => !fs.readFileSync(path.join(root, sources[k]), 'utf8').includes(expect[k]));
for (const k of stale) fs.writeFileSync(path.join(out, `expected-${k}.txt`), expect[k] + '\n');
assert.deepEqual(stale.map(k => sources[k]), [], `Client tables differ from the boss table; expected lines written to ${out}/expected-*.txt`);

// ==================== 编译 ====================
// key：要替换的 DoABC 名称（Core 每个类一个 DoABC，模块 SWF 只有一个无名 DoABC）；cls：导入脚本的类路径
function recompile(swf, key, cls, source, dir) {
  const original = parse(swf);
  only(original.tags.filter(t => t.name === key), 'DoABC ' + key);
  const target = path.join(dir, 'import/scripts', cls + '.as');
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(path.join(root, source), target);
  fs.writeFileSync(path.join(dir, 'original.swf'), swf);
  execFileSync(v.java, ['-Djava.awt.headless=true', '-jar', v.ffdec, '-onerror', 'abort', '-importScript',
    path.join(dir, 'original.swf'), path.join(dir, 'compiled.swf'), path.join(dir, 'import')], {stdio: 'inherit', timeout: 300000});
  const compiled = parse(fs.readFileSync(path.join(dir, 'compiled.swf')));
  assert.equal(compiled.tags.length, original.tags.length, 'Compiled tag count changed: ' + key);
  compiled.tags.forEach((t, i) => {
    if (t.name === key) assert.ok(!t.raw.equals(original.tags[i].raw), key + ' was not recompiled');
    else assert.ok(t.raw.equals(original.tags[i].raw), 'Unrelated tag changed: ' + (t.name || t.code));
  });
  return encode(original, compiled.tags.map(t => t.raw));
}
const compiler = path.join(out, 'compiler');
const invite = 'com/robot/app/fightNote/FightInviteManager';
const coreBytes = recompile(coreRaw, invite, invite, sources.invite, path.join(compiler, 'core'));
put(coreRel, coreBytes);
put(overlayCoreRel, coreBytes);
const sptRel = 'client/assets/module/com/robot/module/app/SptPanel.swf';
put(sptRel, recompile(fs.readFileSync(path.join(baseline, sptRel)), '', 'com/robot/module/app/SptPanel', sources.spt, path.join(compiler, 'spt')));

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, restartWeb: false, databaseMigration: false,
  recompiled: ['com/robot/app/fightNote/FightInviteManager', 'com/robot/module/app/SptPanel'],
  newbieMechanics: notes.mechanics.map(n => [n.boss, n.petName]), sptBosses: sptBosses.length, unrelatedTagsPreserved: true}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length, sptBosses: sptBosses.length, hints: inviteHints.length}));
