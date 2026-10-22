'use strict';
// Build the 训练师之门 panel release from a captured live root (client/ and app/):
// - Module (new overlay file): XIN's official TrainDoorEnterPanel art with our panel class
//   (compat/client-patches/train-door/TrainDoorEnterPanel.as); only that class's DoABC tag is replaced. Its gate table
//   must equal gates.json, locks.json and the essence names in items.xml, and its type names must give the lock hints.
// - Core (assets and overlay copies): MapProcess_102 turns the ring hatch at the lower right of 精灵太空站 into the
//   entrance that opens the panel; the drawn button and the dialog menu are removed.
// Usage: node build-train-door-panel.cjs --baseline <live root> --xin <XIN TrainDoorEnterPanel.swf> --out <dir> --java <java> --ffdec <ffdec.jar>
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const names = ['baseline', 'xin', 'out', 'java', 'ffdec'];
const {values: v} = parseArgs({options: Object.fromEntries(names.map(n => [n, {type: 'string'}]))});
for (const n of names) if (!v[n]) throw Error('Missing --' + n);
const baseline = path.resolve(v.baseline), out = path.resolve(v.out), root = path.resolve(__dirname, '..');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const files = [];
// XIN 站按客户端引用路径（module/com/robot/module/app/TrainDoorEnterPanel.swf）下载的官方模块
const XIN_SHA = 'c397fb86ba7ae2d5696a4026230d5c437f5b0aed7ae26f1a092d196bd86705fe';

function put(rel, bytes) {
  const src = path.join(baseline, rel), dst = path.join(out, rel);
  fs.mkdirSync(path.dirname(dst), {recursive: true});
  fs.writeFileSync(dst, bytes);
  files.push({path: rel, before: fs.existsSync(src) ? sha(fs.readFileSync(src)) : null, after: sha(Buffer.from(bytes))});
}
function only(list, label) {
  assert.equal(list.length, 1, 'Expected one ' + label);
  return list[0];
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
// 把一个类的源码编进 SWF，只允许这个类的 DoABC 标签变化
function recompile(swf, key, source, dir) {
  const original = parse(swf);
  only(original.tags.filter(t => t.name === key), key);
  const target = path.join(dir, 'import/scripts', key + '.as');
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

// ==================== 面板的门表 ====================
const PANEL_SOURCE = 'compat/client-patches/train-door/TrainDoorEnterPanel.as';
const panelSource = fs.readFileSync(path.join(root, PANEL_SOURCE), 'utf8');
const {gates} = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/train-door/gates.json'), 'utf8'));
const {locks} = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/boss-locks/locks.json'), 'utf8'));
const items = fs.readFileSync(path.join(baseline, 'app/config/data/xml/items.xml'), 'utf8');
// 卡片顺序同官方面板：草 火 超能 水 飞行 地面 机械 暗影 冰 光 龙 普通 战斗 电 迷之门；没有战斗系之门，迷之门放超能冰系
const CARDS = ['草', '火', '超能', '水', '飞行', '地面', '机械', '暗影', '冰', '光', '龙', '普通', null, '电', '超能冰'];
assert.equal(CARDS.filter(Boolean).length, gates.length, 'Every gate needs a card');
const typeNames = JSON.parse(only([...panelSource.matchAll(/private static const TYPE_NAMES:Array = (\[.*?\]);/g)], 'TYPE_NAMES')[1]);
const rows = CARDS.map(type => {
  if (!type) return 'null';
  const gate = only(gates.filter(g => g.type === type), 'gate ' + type);
  const lock = only(locks.filter(l => l.boss === '102/' + gate.param2), 'lock 102/' + gate.param2);
  assert.equal(lock.petName, gate.petName, 'Lock and gate differ at 102/' + gate.param2);
  assert.equal(lock.hint, `【属性护盾】${gate.petName}只受${lock.onlyTypes.map(t => typeNames[t] + '系').join('、')}技能的伤害，也不会陷入异常状态。`,
    'Panel type names do not give the hint of 102/' + gate.param2);
  const essence = only([...items.matchAll(new RegExp(`<Item ID="${gate.essence}" Name="([^"]+)"`, 'g'))], 'essence ' + gate.essence)[1];
  return JSON.stringify([gate.type, gate.petName, gate.param2, lock.level, lock.onlyTypes, essence]);
});
assert.ok(panelSource.includes(`private static const DOORS:Array = [${rows.join(',')}];`), 'Panel gate table differs from gates.json, locks.json and items.xml');

// ==================== 面板模块 ====================
const xinRaw = fs.readFileSync(path.resolve(v.xin));
assert.equal(sha(xinRaw), XIN_SHA, 'Unexpected XIN TrainDoorEnterPanel module');
const compiler = path.join(out, 'compiler');
put('client/overlay/module/com/robot/module/app/TrainDoorEnterPanel.swf',
  recompile(xinRaw, 'com/robot/module/app/TrainDoorEnterPanel', PANEL_SOURCE, path.join(compiler, 'module')));

// ==================== Core：精灵太空站入口 ====================
const coreRel = 'client/assets/dll/NieoCore.swf', overlayCoreRel = 'client/overlay/dll/NieoCore.swf';
const coreRaw = fs.readFileSync(path.join(baseline, coreRel));
assert.ok(coreRaw.equals(fs.readFileSync(path.join(baseline, overlayCoreRel))), 'Overlay Core differs from assets; resolve baseline first');
const STATION = 'com/robot/app/mapProcess/MapProcess_102';
const coreBytes = recompile(coreRaw, STATION, 'compat/client-patches/train-door/MapProcess_102.as', path.join(compiler, 'core'));
put(coreRel, coreBytes);
put(overlayCoreRel, coreBytes);

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: false, restartWeb: false, databaseMigration: false,
  recompiledCoreClasses: [STATION], module: {source: 'XIN TrainDoorEnterPanel.swf', sha256: XIN_SHA, recompiledClass: 'com/robot/module/app/TrainDoorEnterPanel'},
  cards: CARDS.map((type, i) => [i + 1, type]), unrelatedTagsPreserved: true}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length, gates: gates.length}));
