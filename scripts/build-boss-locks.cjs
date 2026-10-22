'use strict';
// Build the boss-lock release (一锁一钥) from a captured live root (client/ and app/):
// - Server (dist only, like the other boss rules): BossSpecialRules gains onlyTypes, the 属性护盾 — only listed skill types
//   damage the boss, for direct, fixed, percent and one-hit-kill damage; SkillEffectRuntime applies it to effect damage
//   over time. boss_abilities.json takes level, EV, HP, mechanics and the hint from compat/server-patches/boss-locks/locks.json.
// - Core (assets and overlay copies): FightInviteManager shows the lock as a confirm dialog before each locked challenge;
//   its hint table must equal locks.json.
// Usage: node build-boss-locks.cjs --baseline <live root> --out <dir> --java <java> --ffdec <ffdec.jar>
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
  assert.equal(text.split(from).length, 2, 'Anchor not found exactly once: ' + label);
  return text.replace(from, to);
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

const {locks} = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/boss-locks/locks.json'), 'utf8'));

// ==================== 服务端规则 ====================
const rulesRel = 'app/dist/GameServer/Game/Battle/BossSpecialRules.js';
let rules = fs.readFileSync(path.join(baseline, rulesRel), 'utf8');
assert.ok(!rules.includes('onlyTypes'), 'BossSpecialRules already has onlyTypes');
rules = replaceOnce(rules, `        const mechanics = this.Mechanics(defender);
        if (!mechanics || defender !== battle.enemy || damage <= 0)
            return damage;
        if (kind === 'fixed') {`, `        const mechanics = this.Mechanics(defender);
        if (!mechanics || defender !== battle.enemy || damage <= 0)
            return damage;
        // 属性护盾：只受指定属性技能的伤害（直接、固定、比例和秒杀都算）
        if (mechanics.onlyTypes?.length && !mechanics.onlyTypes.includes(skill.type || 8)) {
            utils_1.Logger.Info(\`[BossSpecialRules] \${defender.name} 只受属性\${mechanics.onlyTypes.join('/')}的伤害, 技能属性=\${skill.type || 8}, 伤害归零\`);
            return 0;
        }
        if (kind === 'fixed') {`, 'ModifyDamageToBoss');
put(rulesRel, rules);

const effectsRel = 'app/dist/GameServer/Game/Battle/SkillEffectRuntime.js';
let effects = fs.readFileSync(path.join(baseline, effectsRel), 'utf8');
effects = replaceOnce(effects, `    static Lose(battle, source, pet, amount, skill, kind, mode = 'fixed') {
        amount = Math.floor(amount);
        if (amount <= 0 || pet.hp <= 0)
            return;
`, `    static Lose(battle, source, pet, amount, skill, kind, mode = 'fixed') {
        amount = Math.floor(amount);
        if (amount <= 0 || pet.hp <= 0)
            return;
        // 持续伤害同样受BOSS属性护盾限制：技能属性不在其中就不扣血
        const onlyTypes = battle?.enemy === pet ? pet.bossMechanics?.onlyTypes : undefined;
        if (kind === 'dot' && onlyTypes?.length && !onlyTypes.includes(skill?.type || 8))
            return;
`, 'SkillEffectRuntime.Lose');
put(effectsRel, effects);

// ==================== BOSS 配置 ====================
const bossRel = 'app/config/data/json/boss_abilities.json';
const bossText = fs.readFileSync(path.join(baseline, bossRel), 'utf8');
const bosses = JSON.parse(bossText);
assert.equal(JSON.stringify(bosses, null, 2) + '\n', bossText, 'boss_abilities.json formatting changed');
for (const lock of locks) {
  const [mapId, param2] = lock.boss.split('/').map(Number);
  const matches = bosses.bossConfigs.filter(b => b.mapId === mapId && b.param2 === param2);
  assert.equal(matches.length, 1, 'One boss at ' + lock.boss);
  const boss = matches[0];
  assert.equal(boss.petName, lock.petName, 'Boss at ' + lock.boss);
  assert.ok(!boss.mechanics?.onlyTypes && !boss.hint, 'Boss already locked: ' + lock.boss);
  Object.assign(boss, {level: lock.level, ev: lock.ev, customHP: lock.customHP, hint: lock.hint,
    mechanics: {...(boss.mechanics || {}), onlyTypes: lock.onlyTypes, statusImmune: true}});
}
put(bossRel, JSON.stringify(bosses, null, 2) + '\n');

// ==================== Core：挑战前提示 ====================
const coreRel = 'client/assets/dll/NieoCore.swf', overlayCoreRel = 'client/overlay/dll/NieoCore.swf';
const coreRaw = fs.readFileSync(path.join(baseline, coreRel));
assert.ok(coreRaw.equals(fs.readFileSync(path.join(baseline, overlayCoreRel))), 'Overlay Core differs from assets; resolve baseline first');
const core = parse(coreRaw);
const KEY = 'com/robot/app/fightNote/FightInviteManager', SOURCE = 'compat/client-patches/boss-locks/FightInviteManager.as';
const table = '{' + locks.map(l => `"${l.boss}":"${l.hint}"`).join(',') + '}';
assert.ok(fs.readFileSync(path.join(root, SOURCE), 'utf8').includes(`private static const BOSS_HINTS:Object = ${table};`), 'Client hint table differs from locks.json');
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
  recompiledCoreClasses: [KEY], locks: locks.map(l => [l.boss, l.petName, l.onlyTypes, l.level, l.customHP]),
  unrelatedCoreTagsPreserved: true}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length, locks: locks.length}));
