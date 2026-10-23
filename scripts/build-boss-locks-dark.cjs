'use strict';
// Build the 暗黑武斗场 lock-and-key release (一锁一钥第二批) from a captured live root (client/ and app/):
// - Server (dist only, like the other boss rules): BossSpecialRules gains the new locks — 异常破绽 (reviveUnlessStatus as a
//   status list; both status paths keep the key status for at least two turns, then it resists it for a turn), 坚甲 (armorBreak), 多层护甲 (layers,
//   read per hit of multi-hit attacks), 强化压制 (boostOnHit, ohkoImmune) and a per-boss typeSequence for 顺序破防. boss_abilities.json takes level, HP, mechanics, abilities and the hint from
//   compat/server-patches/boss-locks/dark-portal.json; moves that inflict a 异常破绽 boss's key status always hit it.
// - Core (assets and overlay copies): the dark portal shows the lock before each fight (DarkPortalModel, keyed by door
//   number) and FightInviteManager gains the arena boss; both hint tables must equal the lock data.
// Usage: node build-boss-locks-dark.cjs --baseline <live root> --out <dir> --java <java> --ffdec <ffdec.jar>
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

const {locks} = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/boss-locks/dark-portal.json'), 'utf8'));

// ==================== 服务端规则 ====================
const rulesRel = 'app/dist/GameServer/Game/Battle/BossSpecialRules.js';
let rules = fs.readFileSync(path.join(baseline, rulesRel), 'utf8');
assert.ok(rules.includes('mechanics.onlyTypes') && !rules.includes('armorBreak'), 'Expected the 训练师之门 rules without the new locks');
rules = replaceOnce(rules, `        if (mechanics.statusImmune === true)
            return true;
`, `        if (mechanics.statusImmune === true)
            return true;
        // 异常破绽：钥匙异常还在时不能续上，刚结束的那一回合也不会再陷入
        if (mechanics.reviveUnlessStatus?.includes?.(status) && (pet.bossState?.keyGuard > 0 || (pet.statusDurations || [])[status] > 0))
            return true;
`, 'IsStatusImmune');
rules = replaceOnce(rules, `        if (!mechanics || Number(skillConfig?.AtkType) === 3)
            return undefined;
`, `        if (!mechanics || Number(skillConfig?.AtkType) === 3)
            return undefined;
        // 异常破绽：能让它陷入钥匙异常的技能必定命中
        const keys = mechanics.reviveUnlessStatus;
        if (Array.isArray(keys) && String(skillConfig?.SideEffect || '').split(/\s+/).some((id) => keys.includes(STATUS_EFFECTS[id]))) {
            utils_1.Logger.Info(\`[BossSpecialRules] \${defender.name} 对\${skill.name}毫无防备, 必定命中\`);
            return true;
        }
`, 'CheckBossHit');
rules = replaceOnce(rules, `const GameConfig_1 = require("../../../shared/config/game/GameConfig");
`, `const GameConfig_1 = require("../../../shared/config/game/GameConfig");
// 技能附加效果 → 让对方陷入的异常（麻痹、中毒、烧伤、冻伤、害怕、睡眠）
const STATUS_EFFECTS = { 10: 0, 11: 1, 12: 2, 14: 5, 15: 6, 16: 8 };
`, 'STATUS_EFFECTS');
rules = replaceOnce(rules, `livesLeft: mechanics.extraLives || 0, phases, phase: 0, opened: false };`,
  `livesLeft: mechanics.extraLives || 0, phases, phase: 0, opened: false, layers: mechanics.layers || 0 };`, 'DecorateBoss');
rules = replaceOnce(rules, `            return 0;
        }
        if (kind === 'fixed') {`, `            return 0;
        }
        // 坚甲：防御或特防（armorBreak 为 both 时两项都）处于下降状态才会受伤
        if (mechanics.armorBreak) {
            const levels = defender.battleLevels || [];
            const broken = mechanics.armorBreak === 'both' ? levels[1] < 0 && levels[3] < 0 : levels[1] < 0 || levels[3] < 0;
            if (!broken) {
                utils_1.Logger.Info(\`[BossSpecialRules] \${defender.name} 防御没有被降低, 伤害归零\`);
                return 0;
            }
        }
        // 多层护甲：每段攻击打掉一层，被挡住的那几段不造成伤害；护甲没打光时固定伤害也无效
        if (mechanics.layers && defender.bossState.layers > 0) {
            if (kind === 'fixed') {
                utils_1.Logger.Info(\`[BossSpecialRules] \${defender.name} 护甲还有\${defender.bossState.layers}层, 固定伤害无效\`);
                return 0;
            }
            const hits = kind === 'attack' ? Math.max(1, attacker.effectStates?._hits || 1) : 1;
            const absorbed = Math.min(defender.bossState.layers, hits);
            defender.bossState.layers -= absorbed;
            damage = Math.floor(damage * (hits - absorbed) / hits);
            utils_1.Logger.Info(\`[BossSpecialRules] \${defender.name} 护甲挡下\${absorbed}段攻击, 还剩\${defender.bossState.layers}层, 伤害=\${damage}\`);
            if (damage <= 0)
                return 0;
        }
        if (kind === 'ohko' && mechanics.ohkoImmune) {
            utils_1.Logger.Info(\`[BossSpecialRules] \${defender.name} 免疫秒杀\`);
            return 0;
        }
        if (kind === 'fixed') {`, 'ModifyDamageToBoss');
rules = replaceOnce(rules, `    static RequiredSequenceType(defender) {
        const rule = BossAbilityConfig_1.BossAbilityConfig.Instance.GetSequentialTypeBreakRule(defender.petId);
        if (!rule?.typeSequence?.length)
            return undefined;
        return rule.typeSequence[defender.bossState.sequencePhase % rule.typeSequence.length];
    }`, `    static RequiredSequenceType(defender) {
        // BOSS 自己配了 typeSequence 时优先：同一只精灵在不同 BOSS 位可以不同
        const sequence = this.Mechanics(defender)?.typeSequence || BossAbilityConfig_1.BossAbilityConfig.Instance.GetSequentialTypeBreakRule(defender.petId)?.typeSequence;
        if (!sequence?.length)
            return undefined;
        return sequence[defender.bossState.sequencePhase % sequence.length];
    }`, 'RequiredSequenceType');
rules = replaceOnce(rules, `        const attack = skill.category === 1 || skill.category === 2;
`, `        const attack = skill.category === 1 || skill.category === 2;
        // 强化压制：每受到一次攻击伤害，指定能力再提升一级
        const boost = mechanics.boostOnHit;
        if (boost && attack && damage > 0 && defender.hp > 0) {
            for (const stat of boost.stats)
                defender.battleLevels[stat] = Math.min(boost.max || 6, (defender.battleLevels[stat] || 0) + 1);
            utils_1.Logger.Info(\`[BossSpecialRules] \${defender.name} 受到攻击, 能力等级=\${JSON.stringify([...defender.battleLevels])}\`);
        }
`, 'AfterBossDamaged');
rules = replaceOnce(rules, `        if (mechanics.reviveUnlessStatus && !(boss.statusDurations || []).some((turns) => turns > 0)) {
            boss.hp = boss.maxHp;
            utils_1.Logger.Info(\`[BossSpecialRules] \${boss.name} 没有异常状态，体力回满\`);
        }`, `        // 异常破绽：为数组时只认这几种异常，不处在其中任何一种时被击倒就回满
        const revive = mechanics.reviveUnlessStatus;
        const durations = boss.statusDurations || [];
        if (revive && !(Array.isArray(revive) ? revive.some((status) => durations[status] > 0) : durations.some((turns) => turns > 0))) {
            boss.hp = boss.maxHp;
            utils_1.Logger.Info(\`[BossSpecialRules] \${boss.name} 没有\${Array.isArray(revive) ? '指定的' : ''}异常状态，体力回满\`);
        }`, 'SettleBossHp');
rules = replaceOnce(rules, `    static OnTurnEnd(battle) {
        if (this.Mechanics(battle?.enemy))
            require('./PuniSealBattle').HealPuniLifeSeal(battle);
    }`, `    static OnTurnEnd(battle) {
        const boss = battle?.enemy, mechanics = this.Mechanics(boss);
        if (mechanics)
            require('./PuniSealBattle').HealPuniLifeSeal(battle);
        // 多层护甲：每回合结束恢复一层
        if (mechanics?.layers && boss.hp > 0 && boss.bossState.layers < mechanics.layers) {
            boss.bossState.layers++;
            utils_1.Logger.Info(\`[BossSpecialRules] \${boss.name} 护甲恢复到\${boss.bossState.layers}层\`);
        }
        // 异常破绽：钥匙异常结束后，下一回合它不会再陷入这种异常
        const keys = mechanics?.reviveUnlessStatus;
        if (Array.isArray(keys) && boss.hp > 0) {
            const state = boss.bossState, active = keys.some((status) => (boss.statusDurations || [])[status] > 0);
            if (state.keyGuard > 0)
                state.keyGuard--;
            else if (state.keyActive && !active) {
                state.keyGuard = 1;
                utils_1.Logger.Info(\`[BossSpecialRules] \${boss.name} 从异常中恢复，下一回合不会再陷入\`);
            }
            state.keyActive = active;
        }
    }`, 'OnTurnEnd');
put(rulesRel, rules);

const effectsRel = 'app/dist/GameServer/Game/Battle/SkillEffectRuntime.js';
let effects = fs.readFileSync(path.join(baseline, effectsRel), 'utf8');
effects = replaceOnce(effects, `        if (require('./BossSpecialRules').BossSpecialRules.IsStatusImmune(target, status, skillId))
            return false;
        target.statusTurns = Math.max(1, turns);`, `        if (require('./BossSpecialRules').BossSpecialRules.IsStatusImmune(target, status, skillId))
            return false;
        // 异常破绽：BOSS 陷入钥匙异常后至少持续两回合，留出击倒它的那一回合
        if (target.bossMechanics?.reviveUnlessStatus?.includes?.(status))
            turns = Math.max(turns, 2);
        target.statusTurns = Math.max(1, turns);`, 'SkillEffectRuntime.Inflict');
put(effectsRel, effects);

const applicatorRel = 'app/dist/GameServer/Game/Battle/EffectApplicator.js';
let applicator = fs.readFileSync(path.join(baseline, applicatorRel), 'utf8');
applicator = replaceOnce(applicator, `        target.statusDurations[result.data.status] = result.data.duration || 3;
        target.status = result.data.status;
        target.statusTurns = result.data.duration || 3;`, `        let duration = result.data.duration || 3;
        // 异常破绽：BOSS 陷入钥匙异常后至少持续两回合，留出击倒它的那一回合
        if (target.bossMechanics?.reviveUnlessStatus?.includes?.(result.data.status))
            duration = Math.max(duration, 2);
        target.statusDurations[result.data.status] = duration;
        target.status = result.data.status;
        target.statusTurns = duration;`, 'EffectApplicator.ApplyStatus');
put(applicatorRel, applicator);

// ==================== BOSS 配置 ====================
const KNOWN = new Set(['onlyTypes', 'statusImmune', 'immune', 'reviveUnlessStatus', 'extraLives', 'onlyMustHit', 'openingSkill', 'layers',
  'armorBreak', 'startStages', 'boostOnHit', 'statDownImmune', 'ohkoImmune', 'typeSequence']);
const skillIds = new Set([...fs.readFileSync(path.join(baseline, 'app/config/data/xml/skills.xml'), 'utf8').matchAll(/<Move ID="(\d+)"/g)].map(m => +m[1]));
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
  if (lock.skills) {
    for (const id of lock.skills) assert.ok(skillIds.has(id), `Unknown skill ${id} at ${lock.boss}`);
    boss[0].skills = lock.skills;
  }
}
put(bossRel, JSON.stringify(bosses, null, 2) + '\n');

// ==================== Core：挑战前提示 ====================
const coreRel = 'client/assets/dll/NieoCore.swf', overlayCoreRel = 'client/overlay/dll/NieoCore.swf';
const coreRaw = fs.readFileSync(path.join(baseline, coreRel));
assert.ok(coreRaw.equals(fs.readFileSync(path.join(baseline, overlayCoreRel))), 'Overlay Core differs from assets; resolve baseline first');
const core = parse(coreRaw);
const PORTAL = 'com/robot/app/darkPortal/DarkPortalModel', INVITE = 'com/robot/app/fightNote/FightInviteManager';
const sources = {[PORTAL]: 'compat/client-patches/dark-portal/DarkPortalModel.as', [INVITE]: 'compat/client-patches/boss-locks/FightInviteManager.as'};
const doors = locks.filter(l => l.boss.startsWith('110/10'));
const portalTable = '{' + doors.map(l => `"${+l.boss.split('/')[1] - 1000}":"${l.hint}"`).join(',') + '}';
assert.ok(fs.readFileSync(path.join(root, sources[PORTAL]), 'utf8').includes(`private static const DARK_HINTS:Object = ${portalTable};`), 'Dark portal hint table differs from dark-portal.json');
const earlier = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/boss-locks/locks.json'), 'utf8')).locks;
const inviteTable = '{' + [...earlier, ...locks.filter(l => !doors.includes(l))].map(l => `"${l.boss}":"${l.hint}"`).join(',') + '}';
assert.ok(fs.readFileSync(path.join(root, sources[INVITE]), 'utf8').includes(`private static const BOSS_HINTS:Object = ${inviteTable};`), 'Challenge hint table differs from locks.json and dark-portal.json');
const compiler = path.join(out, 'compiler');
for (const [key, source] of Object.entries(sources)) {
  assert.equal(core.tags.filter(t => t.name === key).length, 1, 'Expected one ' + key);
  const target = path.join(compiler, 'import/scripts', key + '.as');
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(path.join(root, source), target);
}
execFileSync(v.java, ['-Djava.awt.headless=true', '-jar', v.ffdec, '-onerror', 'abort', '-importScript',
  path.join(baseline, coreRel), path.join(compiler, 'compiled.swf'), path.join(compiler, 'import')], {stdio: 'inherit', timeout: 300000});
const compiled = parse(fs.readFileSync(path.join(compiler, 'compiled.swf')));
assert.equal(compiled.tags.length, core.tags.length, 'Compiled Core tag count changed');
compiled.tags.forEach((t, i) => {
  if (sources[t.name]) assert.ok(!t.raw.equals(core.tags[i].raw), t.name + ' was not recompiled');
  else assert.ok(t.raw.equals(core.tags[i].raw), 'Unrelated Core tag changed: ' + (t.name || t.code));
});
const coreBytes = encode(core, compiled.tags.map(t => t.raw));
put(coreRel, coreBytes);
put(overlayCoreRel, coreBytes);

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, restartWeb: false, databaseMigration: false,
  recompiledCoreClasses: Object.keys(sources), locks: locks.map(l => [l.boss, l.petName, l.lock, l.level, l.customHP]),
  unrelatedCoreTagsPreserved: true}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length, locks: locks.length}));
