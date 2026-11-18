'use strict';
/**
 * classic-polish-v4：暗黑武斗场与训练师之门瓦尔普难度回调（审计 outputs/audit-v2-20261118）。
 * - 暗黑门三阶统一参数：降体力/等级、去掉二三阶开场全能强化、觉醒只强化攻击面、回血改为配置项 auraRegen。
 * - 瓦尔普去掉开场强化。
 * - 雷伊去掉无实现的 thunderMajesty 光环键，提示改为与实现一致。
 * 用法：node scripts/build-classic-polish-v4.cjs [DARK_PARAMS_JSON]
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const repoRoot = path.resolve(__dirname, '../../..');
const prevDir = path.join(repoRoot, 'outputs/classic-polish-v3-20261118/build');
const v2Dir = path.join(repoRoot, 'outputs/classic-polish-v2-20261118/build');
const outDir = path.join(repoRoot, 'outputs/classic-polish-v4-20261118/build');
const sha = buf => crypto.createHash('sha256').update(buf).digest('hex');

// 各阶参数（实验室迭代后定稿）
const DARK = {
  1: {level: 80, hp: 3600, regen: 120, startStages: null, awaken: {stages: [1, 0, 1, 0, 0, 0], healPercent: 10},
    hint: '【暗黑侵蚀·初阶】本系护体（非克制伤害-32%）、每回合暗黑回血120，半血觉醒攻击/特攻+1；克制属性攻击增伤25%并压制当回合回血。',
    normalHint: '【暗黑侵蚀·初阶】普通系无克制属性，本场无本系护体；每回合暗黑回血120，半血觉醒攻击/特攻+1。'},
  2: {level: 82, hp: 3800, regen: 100, startStages: null, awaken: {stages: [1, 0, 1, 0, 1, 0], healPercent: 10},
    hint: '【暗黑侵蚀·高阶】本系护体、每回合回血100；每受2次攻击暗黑反震（扣1/8体力并降双防）；半血觉醒攻击/特攻/速度+1。宜克制主攻、配合消强。',
    normalHint: '【暗黑侵蚀·高阶】普通系无克制属性，本场无本系护体；每回合回血100，每受2次攻击暗黑反震（扣1/8体力并降双防）；半血觉醒攻击/特攻/速度+1。'},
  3: {level: 87, hp: 3600, regen: 150, startStages: [1, 0, 1, 0, 0, 0], awaken: {stages: [1, 0, 1, 0, 0, 0], healPercent: 10},
    hint: '【暗黑暴走·终阶】两条命、开场攻击/特攻+1、每回合回血150并有暗黑反震；半血觉醒再强化攻击面。考验消强、续航与克制阵容。',
    normalHint: '【暗黑暴走·终阶】普通系无克制属性，本场无本系护体；两条命、开场攻击/特攻+1、每回合回血150并有暗黑反震；半血觉醒再强化攻击面。'},
};
if (process.argv[2]) Object.assign(DARK, JSON.parse(process.argv[2]));

fs.rmSync(outDir, {recursive: true, force: true});
fs.mkdirSync(outDir, {recursive: true});

const bossRel = 'app/config/data/json/boss_abilities.json';
const rulesRel = 'app/dist/GameServer/Game/Battle/BossSpecialRules.js';
const bosses = JSON.parse(fs.readFileSync(path.join(prevDir, bossRel), 'utf8'));
let dark = 0;
for (const c of bosses.bossConfigs) {
  const m = c.mechanics;
  if (Number(c.mapId) === 110 && m?.fieldAura === 'darkErosion') {
    const p = DARK[m.darkTier];
    assert.ok(p, `Unknown dark tier ${m.darkTier} for ${c.petName}`);
    c.level = p.level;
    c.customHP = p.hp;
    m.auraRegen = p.regen;
    if (p.startStages) m.startStages = p.startStages; else delete m.startStages;
    m.halfHpAwaken = p.awaken;
    c.hint = p.hint;
    dark++;
  }
}
assert.equal(dark, 26, 'Expected 26 dark door bosses');

const valp = bosses.bossConfigs.find(c => Number(c.mapId) === 102 && Number(c.param2) === 212);
assert.equal(valp.petName, '瓦尔普');
delete valp.mechanics.startStages;
valp.customHP = 3200;

const ray = bosses.bossConfigs.find(c => Number(c.mapId) === 32 && Number(c.param2) === 0);
assert.equal(ray.mechanics.fieldAura, 'thunderMajesty');
delete ray.mechanics.fieldAura;
ray.hint = '【雷神天威】技能先制+2，体力低于40%时必定致命一击，半血触发雷神觉醒；地面系、神秘系克制攻击增伤25%，非克制攻击被护体减伤32%。';

// 普通系在本服克制表中没有任何克制属性（ElementSystem 核对），本系护体无法破除、回血也无法压制：去掉护体并改提示
const petsXml = fs.readFileSync(path.join(v2Dir, 'app/config/data/xml/pets.xml'), 'utf8');
const petType = id => Number((petsXml.match(new RegExp('<Monster ID="' + id + '"[^>]*\\bType="(\\d+)"')) || [])[1]);
const NO_COUNTER_TYPES = new Set([8]);
const NORMAL_HINTS = {
  '450/0': '【星系霸主】普通系无克制属性：本场无本系护体；半血二阶段觉醒（清除弱化并全能力+1），宜消强与高爆发正面破局。',
  '102/212': '【普通系守卫】普通系无克制属性，任何属性都能全额造成伤害；半血觉醒强化攻击、特攻与速度。',
  '102/312': '【勇者模式】100级双命精英守卫；普通系无克制属性，无本系护体；半血觉醒强化，考验续航与爆发。',
};
let normal = 0;
for (const c of bosses.bossConfigs) {
  if (!c.mechanics?.typeHomeTurf || !NO_COUNTER_TYPES.has(petType(c.petId))) continue;
  delete c.mechanics.typeHomeTurf;
  const key = c.mapId + '/' + c.param2;
  if (Number(c.mapId) === 110) c.hint = DARK[c.mechanics.darkTier].normalHint;
  else { assert.ok(NORMAL_HINTS[key], `Missing hint for ${key}`); c.hint = NORMAL_HINTS[key]; }
  normal++;
}
assert.equal(normal, 6, 'Expected 6 normal-type home-turf bosses');

fs.mkdirSync(path.dirname(path.join(outDir, bossRel)), {recursive: true});
fs.writeFileSync(path.join(outDir, bossRel), JSON.stringify(bosses, null, 2) + '\n');

let rules = fs.readFileSync(path.join(v2Dir, rulesRel), 'utf8');
const regenLine = 'const regen = (mechanics.darkTier || 1) >= 3 ? 350 : 200;';
assert.equal(rules.split(regenLine).length, 2, 'Expected one dark regen line');
rules = rules.replace(regenLine, 'const regen = mechanics.auraRegen ?? ((mechanics.darkTier || 1) >= 3 ? 350 : 200);');
fs.mkdirSync(path.dirname(path.join(outDir, rulesRel)), {recursive: true});
fs.writeFileSync(path.join(outDir, rulesRel), rules);

const manifest = {release: 'classic-polish-v4-20261118', generatedAt: new Date().toISOString(), writtenFiles: [], deletePaths: []};
for (const rel of [bossRel, rulesRel]) {
  const buf = fs.readFileSync(path.join(outDir, rel));
  manifest.writtenFiles.push({path: rel, sha256: sha(buf), bytes: buf.length});
}
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('构建完成 ->', outDir, JSON.stringify(manifest.writtenFiles.map(f => f.path)));
