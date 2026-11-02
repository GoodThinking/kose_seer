'use strict';

const LIMITS = {
  standard: {fraction: 0.08, dot: 0.04, indirectAction: 0.35, healing: 0.40, healAction: 0.20, resistance: 1},
  advanced: {fraction: 0.05, dot: 0.03, indirectAction: 0.30, healing: 0.45, healAction: 0.15, resistance: 1},
  core: {fraction: 0.03, dot: 0.02, indirectAction: 0.25, healing: 0.40, healAction: 0.10, resistance: 2},
};
const ORDINARY = {healing: Infinity, healAction: Infinity, resistance: 1};
const CONTROL = [0, 6, 7, 8, 9, 15];
const CONTROL_REASONS = new Set(['paralysis', 'fear', 'fatigue', 'sleep', 'petrify', 'ice_seal']);
const battles = new WeakMap();
function battleFor(pet) { return pet && battles.get(pet); }
function unbind(battle) {
  if (battle?.player && battles.get(battle.player) === battle) battles.delete(battle.player);
  if (battle?.enemy && battles.get(battle.enemy) === battle) battles.delete(battle.enemy);
}
function enabled(battle, pet) {
  return !battle?.isPvp && !!(battle?.universeBoss || battle?.enemy?.sptBossProfile && !battle.enemy.sptBossProfile.native) && (!pet || pet === battle.enemy);
}
function state(battle) {
  if (!enabled(battle)) return null;
  return battle.universeBudgetState || (battle.universeBudgetState = {maxHp: battle.enemy.maxHp, turn: -1, fraction: 0, dot: 0, action: 0, healed: 0, actionHealing: 0, nextActiveHeal: 0, resistanceUntil: -1, reflect: 0});
}
function limits(battle) {
  if (!battle.universeBoss) return ORDINARY;
  const value = LIMITS[battle.universeBoss.tier];
  if (!value) throw new Error('Unknown universe boss tier: ' + battle.universeBoss.tier);
  return value;
}
function round(battle) { return (Number(battle.roundCount) || 0) + 1; }
function limit(battle, value) { return Math.floor(state(battle).maxHp * value); }
function beginTurn(battle) {
  const s = state(battle); if (!s) return;
  if (battle.player) battles.set(battle.player, battle);
  if (battle.enemy) battles.set(battle.enemy, battle);
  const r = round(battle);
  if (s.turn !== r) { s.turn = r; s.fraction = 0; s.dot = 0; s.action = 0; s.actionHealing = 0; s.reflect = 0; s.actor = null; }
}
function beginAction(battle, actor, skill) {
  const s = state(battle); if (!s) return;
  beginTurn(battle);
  s.actor = actor; s.skill = skill;
  s.actionSerial = (s.actionSerial || 0) + 1;
  s.reflections = [];
  if (actor === battle.player) { s.action = 0; s.reflect = 0; }
  if (actor === battle.enemy) s.actionHealing = 0;
}
function damage(battle, source, target, kind, amount, options = {}) {
  if (!enabled(battle)) return amount;
  amount = Math.max(0, Math.floor(Number(amount) || 0));
  if (!options.indirectModified && kind !== 'direct' && kind !== 'ohko' && kind !== 'delayedFatal') {
    const rules = require('./UniverseBossRules');
    if (typeof rules.modifyIndirectDamage === 'function') amount = Math.max(0, Math.floor(rules.modifyIndirectDamage(battle, source, target, kind, amount)) || 0);
  }
  if (!enabled(battle, target)) return amount;
  beginTurn(battle);
  const s = state(battle), l = limits(battle);
  if (battle.universeBoss && (kind === 'ohko' || kind === 'delayedFatal')) return 0;
  if (battle.universeBoss && (kind === 'fraction' || kind === 'dot')) amount = Math.min(amount, Math.max(0, limit(battle, l[kind]) - s[kind]));
  if (battle.universeBoss && kind !== 'direct' && kind !== 'dot' && s.actor === battle.player) amount = Math.min(amount, Math.max(0, limit(battle, l.indirectAction) - s.action));
  amount = Math.min(amount, Math.max(0, target.hp));
  if (kind === 'fraction' || kind === 'dot') s[kind] += amount;
  if (kind !== 'direct' && kind !== 'dot' && s.actor === battle.player) s.action += amount;
  return amount;
}
function healingRemaining(battle) {
  if (!enabled(battle)) return Infinity;
  return Math.max(0, limit(battle, limits(battle).healing) - state(battle).healed);
}
function canHeal(battle, options = {}) {
  return !enabled(battle) || !battle.universeBoss || (battle.enemy.hp > 0 && healingRemaining(battle) > 0 && round(battle) + (options.roundOffset || 0) >= state(battle).nextActiveHeal);
}
function heal(battle, pet, amount, options = {}) {
  if (!pet || pet.hp <= 0 || amount <= 0) return 0;
  let actual = Math.min(Math.floor(amount), Math.max(0, pet.maxHp - pet.hp));
  if (enabled(battle, pet)) {
    beginTurn(battle);
    const s = state(battle), l = limits(battle);
    if (pet.effectStates?.healBlock && (pet.effectStates.healBlock.turns === undefined || pet.effectStates.healBlock.turns > 0)) return 0;
    const rules = require('./UniverseBossRules');
    if (typeof rules.modifyHealing === 'function') actual = Math.max(0, Math.floor(rules.modifyHealing(battle, actual, {active: !!options.active, source: options.source || 'engine'})) || 0);
    if (options.active && !canHeal(battle) && !(s.actor === pet && s.activeHealSerial === s.actionSerial)) return 0;
    actual = Math.min(actual, healingRemaining(battle), Math.max(0, limit(battle, l.healAction) - s.actionHealing));
    if (actual > 0) {
      s.healed += actual; s.actionHealing += actual;
      if (options.active && battle.universeBoss) { s.nextActiveHeal = round(battle) + 4; s.activeHealSerial = s.actionSerial; }
    }
  }
  pet.hp += actual;
  return actual;
}
function queuePeriodicHeal(battle, pet, amount, source) {
  if (!enabled(battle, pet)) return heal(battle, pet, amount, {source});
  const s = state(battle), candidate = Math.max(0, Math.floor(amount) || 0);
  if (!s.periodicHeal || candidate > s.periodicHeal.amount) s.periodicHeal = {pet, amount: candidate, source};
  return 0;
}
function settlePeriodicHeal(battle) {
  const s = state(battle); if (!s || !s.periodicHeal) return 0;
  const pending = s.periodicHeal; s.periodicHeal = null;
  return heal(battle, pending.pet, pending.amount, {source: pending.source});
}
function reflect(battle, attacker, defender, requested, source) {
  if (!enabled(battle) || !attacker || !defender || defender.hp <= 0 || attacker.hp <= 0) return 0;
  const s = state(battle), amount = Math.max(0, Math.floor(requested) || 0);
  const existing = s.reflections?.find(item => item.attacker === attacker && item.defender === defender);
  if (existing) existing.amount = Math.max(existing.amount, amount);
  else (s.reflections || (s.reflections = [])).push({attacker, defender, amount, source});
  return 0;
}
function settleReflections(battle) {
  const s = state(battle); if (!s) return;
  const pending = s.reflections || []; s.reflections = [];
  for (const item of pending) {
    if (item.attacker.hp <= 0 || item.defender.hp <= 0) continue;
    const amount = damage(battle, item.defender, item.attacker, 'reflection', item.amount);
    item.attacker.hp = Math.max(0, item.attacker.hp - amount);
  }
}
function controlResistant(battle) { return enabled(battle) && round(battle) <= state(battle).resistanceUntil; }
function lostAction(battle, actor, reason, selfFatigue = false) {
  if (!enabled(battle, actor) || !CONTROL_REASONS.has(reason)) return;
  const s = state(battle);
  if (reason === 'fatigue' && (selfFatigue || s.selfFatigue)) {
    if (!actor.statusDurations?.[7]) s.selfFatigue = false;
    return;
  }
  s.resistanceUntil = round(battle) + limits(battle).resistance;
  if (actor.statusDurations) for (const id of CONTROL) if (id !== 7 || !s.selfFatigue) actor.statusDurations[id] = 0;
  if (CONTROL.includes(actor.status) && (actor.status !== 7 || !s.selfFatigue)) { actor.status = -1; actor.statusTurns = 0; }
}
function recordStageClear(battle, source, target, before) {
  if (!enabled(battle)) return;
  const after = target.battleLevels || [];
  const changes = before.map((value, index) => ({index, before: value, after: after[index]})).filter(change => change.before !== 0 && change.after === 0);
  if (!changes.length) return;
  state(battle).actionContext?.statClears.push({source, target, changes});
  require('./UniverseBossRules').onStatClear?.(battle, source, target, changes.map(change => change.index), changes);
}
function isPureHeal(skill) {
  if (skill?.category !== 4) return false;
  const entries = require('./SkillEffectRuntime').SkillEffectRuntime.Entries(skill);
  return entries.some(entry => entry.id === 43) && entries.every(entry => entry.id === 43 || entry.id === 20 || (entry.id === 4 && entry.args[2] < 0));
}
function exhaustedAttackFallback(battle, configs) {
  const boss = battle.enemy;
  if (!Array.isArray(boss?.skills) || !Array.isArray(boss.skillPP) || boss.skills.length !== boss.skillPP.length) return 0;
  let hasAttack = false;
  for (let index = 0; index < boss.skills.length; index++) {
    const skill = configs.get(boss.skills[index]), pp = boss.skillPP[index];
    if (!skill || !Number.isInteger(pp) || pp < 0) return 0;
    if (skill.category === 1 || skill.category === 2) {
      hasAttack = true;
      if (pp > 0) return 0;
    }
  }
  if (!hasAttack) return 0;
  const move = require('../../../shared/config/game/GameConfig').GameConfig.GetSkillById(10001);
  if (!Number.isInteger(move?.MaxPP) || move.MaxPP <= 0) return 0;
  const s = state(battle);
  if ((s.exhaustionUses || 0) >= move.MaxPP) return 0;
  s.exhaustionSelectedTurn = battle.turn;
  return 10001;
}
function spendExhaustedAttack(battle, actor, skill) {
  if (!enabled(battle, actor) || actor !== battle.enemy || skill?.id !== 10001) return;
  const s = state(battle);
  if (s.exhaustionSelectedTurn !== battle.turn) return;
  s.exhaustionUses = (s.exhaustionUses || 0) + 1;
  s.exhaustionSelectedTurn = null;
}
function selectSkill(battle, proposed, configs) {
  if (!battle?.universeBoss) return proposed;
  state(battle).exhaustionSelectedTurn = null;
  const boss = battle.enemy;
  const threshold = battle.universeBoss.petId === 361 ? 50 : battle.universeBoss.petId === 1416 ? 45 : 40;
  const allowed = id => !isPureHeal(configs.get(id)) || (canHeal(battle) && boss.hp * 100 <= boss.maxHp * threshold);
  if (!proposed) return exhaustedAttackFallback(battle, configs);
  if (allowed(proposed)) return proposed;
  const rules = require('./UniverseBossRules');
  for (let index = 0; index < boss.skills.length; index++) {
    const id = boss.skills[index], skill = configs.get(id);
    if (boss.skillPP[index] > 0 && skill && [1, 2].includes(skill.category) && allowed(id) && rules.selectLegalSkill(battle, id, configs) === id) return id;
  }
  return exhaustedAttackFallback(battle, configs);
}
module.exports = {enabled, beginTurn, beginAction, battleFor, unbind, damage, heal, queuePeriodicHeal, settlePeriodicHeal, reflect, settleReflections, canHeal, healingRemaining, controlResistant, lostAction, recordStageClear, selectSkill, spendExhaustedAttack};
