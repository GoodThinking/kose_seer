'use strict';
// Build the third lock-and-key release (一锁一钥第三批) from a captured live root (client/ and app/):
// - Server: boss_abilities.json takes level, HP, mechanics, abilities and the hint from
//   compat/server-patches/boss-locks/remaining.json (the other SPT, legendary and new bosses, plus light locks on early
//   bosses). The lock rules themselves shipped with the 暗黑武斗场 release; this build checks they are live.
// - Core (assets and overlay copies): FightInviteManager shows these locks before each challenge; its hint table must
//   equal locks.json, the arena boss of dark-portal.json and remaining.json.
// Usage: node build-boss-locks-remaining.cjs --baseline <live root> --out <dir> --java <java> --ffdec <ffdec.jar>
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

const dir = path.join(root, 'compat/server-patches/boss-locks');
const {locks} = JSON.parse(fs.readFileSync(path.join(dir, 'remaining.json'), 'utf8'));
const earlier = JSON.parse(fs.readFileSync(path.join(dir, 'locks.json'), 'utf8')).locks;
const arena = JSON.parse(fs.readFileSync(path.join(dir, 'dark-portal.json'), 'utf8')).locks.filter(l => !l.boss.startsWith('110/10'));

// ==================== 服务端规则已上线 ====================
const rules = fs.readFileSync(path.join(baseline, 'app/dist/GameServer/Game/Battle/BossSpecialRules.js'), 'utf8');
for (const rule of ['armorBreak', 'mechanics.layers', 'boostOnHit', 'ohkoImmune', 'keyGuard', '?.typeSequence'])
  assert.ok(rules.includes(rule), 'Live BossSpecialRules lacks ' + rule + '; deploy the 暗黑武斗场 release first');

// ==================== BOSS 配置 ====================
const KNOWN = new Set(['onlyTypes', 'statusImmune', 'immune', 'reviveUnlessStatus', 'extraLives', 'onlyMustHit', 'layers', 'armorBreak',
  'startStages', 'boostOnHit', 'statDownImmune', 'ohkoImmune', 'typeSequence', 'onPhysicalHitStatus', 'lowHpCritPercent', 'singlePet']);
const bossRel = 'app/config/data/json/boss_abilities.json';
const bossText = fs.readFileSync(path.join(baseline, bossRel), 'utf8');
const bosses = JSON.parse(bossText);
assert.equal(JSON.stringify(bosses, null, 2) + '\n', bossText, 'boss_abilities.json formatting changed');
assert.equal(new Set(locks.map(l => l.boss)).size, locks.length, 'Duplicate lock');
for (const lock of locks) {
  const [mapId, param2] = lock.boss.split('/').map(Number);
  const boss = bosses.bossConfigs.filter(b => b.mapId === mapId && b.param2 === param2);
  assert.equal(boss.length, 1, 'One boss at ' + lock.boss);
  assert.equal(boss[0].petName, lock.petName, 'Boss at ' + lock.boss);
  assert.ok(!boss[0].hint, 'Boss already locked: ' + lock.boss);
  for (const k of Object.keys(lock.mechanics)) assert.ok(KNOWN.has(k), `Unknown mechanic ${k} at ${lock.boss}`);
  Object.assign(boss[0], {level: lock.level, customHP: lock.customHP, hint: lock.hint, mechanics: lock.mechanics});
  if (lock.abilities) boss[0].abilities = lock.abilities;
}
put(bossRel, JSON.stringify(bosses, null, 2) + '\n');

// ==================== Core：挑战前提示 ====================
const coreRel = 'client/assets/dll/NieoCore.swf', overlayCoreRel = 'client/overlay/dll/NieoCore.swf';
const coreRaw = fs.readFileSync(path.join(baseline, coreRel));
assert.ok(coreRaw.equals(fs.readFileSync(path.join(baseline, overlayCoreRel))), 'Overlay Core differs from assets; resolve baseline first');
const core = parse(coreRaw);
const KEY = 'com/robot/app/fightNote/FightInviteManager', SOURCE = 'compat/client-patches/boss-locks/FightInviteManager.as';
const table = '{' + [...earlier, ...arena, ...locks].map(l => `"${l.boss}":"${l.hint}"`).join(',') + '}';
assert.ok(fs.readFileSync(path.join(root, SOURCE), 'utf8').includes(`private static const BOSS_HINTS:Object = ${table};`), 'Challenge hint table differs from the lock data');
assert.equal(core.tags.filter(t => t.name === KEY).length, 1, 'Expected one ' + KEY);
const compiler = path.join(out, 'compiler');
const target = path.join(compiler, 'import/scripts', KEY + '.as');
fs.mkdirSync(path.dirname(target), {recursive: true});
fs.copyFileSync(path.join(root, SOURCE), target);
execFileSync(v.java, ['-Djava.awt.headless=true', '-jar', v.ffdec, '-onerror', 'abort', '-importScript',
  path.join(baseline, coreRel), path.join(compiler, 'compiled.swf'), path.join(compiler, 'import')], {stdio: 'inherit', timeout: 300000});
const compiled = parse(fs.readFileSync(path.join(compiler, 'compiled.swf')));
assert.equal(compiled.tags.length, core.tags.length, 'Compiled Core tag count changed');
compiled.tags.forEach((t, i) => {
  if (t.name === KEY) assert.ok(!t.raw.equals(core.tags[i].raw), KEY + ' was not recompiled');
  else assert.ok(t.raw.equals(core.tags[i].raw), 'Unrelated Core tag changed: ' + (t.name || t.code));
});
const coreBytes = encode(core, compiled.tags.map(t => t.raw));
put(coreRel, coreBytes);
put(overlayCoreRel, coreBytes);

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, restartWeb: false, databaseMigration: false,
  recompiledCoreClasses: [KEY], locks: locks.map(l => [l.boss, l.petName, l.lock, l.level, l.customHP]),
  unrelatedCoreTagsPreserved: true}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length, locks: locks.length}));
