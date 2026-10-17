'use strict';
// Exercise the deployed battle modules in an isolated runtime copy; no database or live account.
const assert = require('node:assert/strict');
const path = require('node:path');
const app = path.resolve(process.argv[2]);
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
const {ConfigLoader} = load('shared/config/ConfigLoader');
const {ConfigRegistry} = load('shared/config/ConfigRegistry');
const {ConfigKeys, ConfigPaths, ConfigType} = load('shared/config/ConfigDefinitions');
const {SkillEffectsConfig} = load('shared/config/game/SkillEffectsConfig');
const {BattleTurnExecutor} = load('GameServer/Game/Battle/BattleTurnExecutor');
const {BattleEffectIntegration} = load('GameServer/Game/Battle/BattleEffectIntegration');

function pet(overrides = {}) {
  return {id: 1, petId: 1, name: 'fixture', level: 50, type: 2, hp: 100, maxHp: 100, attack: 100, defence: 100, spAtk: 100,
    spDef: 100, speed: 100, status: -1, statusArray: Array(20).fill(0), statusDurations: Array(20).fill(0),
    battleLv: Array(6).fill(0), battleLevels: Array(6).fill(0), effectCounters: {}, effectData: {}, immuneFlags: {},
    skills: [], ...overrides};
}
function skill(sideEffect, sideEffectArg = '', overrides = {}) {
  return {id: 90000 + sideEffect, name: 'effect' + sideEffect, category: 2, type: 2, power: 100, accuracy: 100, priority: 0,
    sideEffect, sideEffectArg, ...overrides};
}
function damage(move, attacker, defender) {
  const random = Math.random;
  Math.random = () => 0.5;
  try {
    const battle = {player: attacker, enemy: defender, lastHitWasCritical: false};
    return BattleTurnExecutor.ExecuteAttack(battle, attacker, defender, move, 1, {canAct: true}, true).damage;
  } finally { Math.random = random; }
}
const results = [];
// Each ratio compares the same pets with and without the effect, so type and stat differences cancel out.
function boost(name, move, active, inactive, expected) {
  const power = move.power, plain = {...move, sideEffect: 0, sideEffectArg: ''};
  const on = damage(move, active.attacker(), active.defender());
  const base = damage(plain, active.attacker(), active.defender());
  const off = damage(move, inactive.attacker(), inactive.defender());
  assert.equal(move.power, power, name + ' mutated the shared skill config');
  assert.equal(off, damage(plain, inactive.attacker(), inactive.defender()), name + ' changed damage while its condition was false');
  const ratio = on / base;
  assert.ok(ratio > expected * 0.85 && ratio < expected * 1.05, `${name} ratio ${ratio.toFixed(3)} (expected about ${expected})`);
  results.push({name, on, base, ratio: Number(ratio.toFixed(3))});
}
const same = () => pet();

(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigLoader.Instance.Reload();
  ConfigRegistry.Instance.Register(ConfigKeys.SKILL_EFFECTS_V2, ConfigPaths[ConfigKeys.SKILL_EFFECTS_V2], ConfigType.JSON);
  await ConfigRegistry.Instance.Initialize();
  await SkillEffectsConfig.Instance.Load();

  boost('2 opponent HP below 50%', skill(2), {attacker: same, defender: () => pet({hp: 40})},
    {attacker: same, defender: () => pet({hp: 50})}, 2);
  boost('37 self HP below 1/4, power x3', skill(37, '4 3'), {attacker: () => pet({hp: 20}), defender: same},
    {attacker: () => pet({hp: 30}), defender: same}, 3);
  boost('40 first strike', skill(40), {attacker: () => pet({speed: 120}), defender: same},
    {attacker: () => pet({speed: 80}), defender: same}, 2);
  boost('30 second strike', skill(30), {attacker: () => pet({speed: 80}), defender: same},
    {attacker: () => pet({speed: 120}), defender: same}, 2);
  const burned = () => { const p = pet(); p.statusDurations[2] = 2; return p; };
  boost('96 burned target', skill(96), {attacker: same, defender: burned}, {attacker: same, defender: same}, 2);
  const poisoned = () => { const p = pet(); p.statusDurations[1] = 2; return p; };
  boost('64 poisoned self', skill(64), {attacker: poisoned, defender: same}, {attacker: same, defender: same}, 2);
  const weakened = () => { const p = pet(); p.battleLevels[0] = -1; return p; };
  boost('431 weakened target', skill(431), {attacker: same, defender: weakened}, {attacker: same, defender: same}, 2);
  boost('401 same type as opponent', skill(401), {attacker: same, defender: same},
    {attacker: same, defender: () => pet({type: 1})}, 2);
  boost('179 same type, power +100', skill(179, '100'), {attacker: same, defender: same},
    {attacker: () => pet({type: 1}), defender: same}, 2);

  const speed = (hp, arg) => BattleEffectIntegration.OnBeforeSpeedCheck(pet({hp}), pet(), skill(454, arg, {power: 0}), skill(0)).playerPriorityMod;
  assert.equal(speed(20, '3 2'), 2, '454 low HP priority');
  assert.equal(speed(50, '3 2'), 0, '454 priority while HP is high');
  results.push({name: '454 self HP below 1/3, priority +2', on: speed(20, '3 2'), off: speed(50, '3 2')});
  console.log(JSON.stringify({passed: results.length, results}, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
