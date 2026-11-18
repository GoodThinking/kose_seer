'use strict';
const { SkillEffectRuntime: R } = require('./SkillEffectRuntime');
const { ElementSystem } = require('./ElementSystem');
const ratio = stage => stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
const active = (pet, key) => !!R.Get(pet, key);
const setups = { 47: 'statDownImmune', 48: 'statusImmune', 49: 'shield', 57: 'regen', 58: 'critAlways', 191: 'statusImmune', 570: 'chAttackBlock' };
const control = new Set([2, 10, 13, 16, 24, 29, 30]);
const statClearEffects = new Set([26, 31, 794, 1060, 1209]);
const weights = {
  aggressive: { attack: 1.4, setup: 0.7, control: 0.5, healAt: 0.35 },
  defensive: { attack: 0.9, setup: 1.3, control: 0.9, healAt: 0.72 },
  tactical: { attack: 1.0, setup: 1.15, control: 1.45, healAt: 0.55 },
  balanced: { attack: 1.1, setup: 1.05, control: 1.05, healAt: 0.55 }
};
class ArenaStrategy {
  static Estimate(pet, foe, skill) {
    const special = skill.category === 2;
    const attack = (special ? pet.spAtk : pet.attack) * ratio(pet.battleLevels?.[special ? 2 : 0] || 0);
    const defence = (special ? foe.spDef : foe.defence) * ratio(foe.battleLevels?.[special ? 3 : 1] || 0);
    const element = ElementSystem.GetEffectiveness(skill.type, foe.type);
    const stab = Number(skill.type) === Number(pet.type) ? 1.5 : 1;
    return Math.max(0, ((42 * (skill.power || 0) * attack / Math.max(1, defence) / 50) + 2) * stab * element);
  }
  static Score(battle, skill, configs) {
    const pet = battle.enemy, foe = battle.player;
    const style = battle.starArena.trainer.style, w = weights[style] || weights.balanced;
    const attacking = skill.category === 1 || skill.category === 2;
    const accuracy = skill.mustHit ? 1 : (skill.accuracy || 100) / 100;
    const estimate = attacking ? this.Estimate(pet, foe, skill) : 0;
    let score = attacking ? estimate * accuracy * w.attack : -10;
    if (attacking && estimate === 0) score = -100;
    const ownSpeed = pet.speed * ratio(pet.battleLevels?.[4] || 0), foeSpeed = foe.speed * ratio(foe.battleLevels?.[4] || 0);
    const foePositiveStages = (foe.battleLevels || []).reduce((acc, v) => acc + (v > 0 ? v : 0), 0);
    if (attacking && estimate >= foe.hp) score += (skill.priority > 0 || ownSpeed >= foeSpeed) ? 520 : 240;
    if (attacking && skill.priority > 0 && (pet.hp / pet.maxHp < 0.35 || foe.hp / foe.maxHp < 0.28)) score += 85;
    for (const effect of R.Entries(skill)) {
      const a = effect.args;
      if (statClearEffects.has(effect.id) && foePositiveStages >= 2) {
        score += foePositiveStages * 95 * (style === 'tactical' ? 1.35 : 1.1);
      }
      if ([43, 450].includes(effect.id)) {
        const missing = pet.maxHp - pet.hp;
        const healing = effect.id === 450 ? (a[0] + a[1]) / 2 : pet.maxHp / Math.max(1, a[0] || 1);
        if (pet.hp / pet.maxHp < w.healAt && missing > 0) score += Math.min(missing, healing) * (style === 'defensive' ? 2.1 : 1.25);
      }
      if (effect.id === 4 && a[2] > 0) {
        const stage = pet.battleLevels?.[a[0]] || 0;
        const useful = a[0] === 0 ? pet.skills.some(id => configs.get(id)?.category === 1) : a[0] === 2 ? pet.skills.some(id => configs.get(id)?.category === 2) : true;
        if (useful && stage < 2 && pet.hp / pet.maxHp > 0.4) score += (2 - stage) * 60 * w.setup;
      }
      if (effect.id === 5 && a[2] < 0) {
        const stage = foe.battleLevels?.[a[0]] || 0;
        if (stage > -2 && foe.hp / foe.maxHp > 0.4) score += (stage + 2) * 52 * (style === 'tactical' ? 1.45 : 0.85);
      }
      if (control.has(effect.id) && !R.HasStatus(foe) && !R.IsStatusImmune(foe)) score += 120 * w.control;
      const state = setups[effect.id];
      if (state && !active(pet, state) && foe.hp / foe.maxHp > 0.3) score += 100 * w.setup;
    }
    return score;
  }
  static SelectSkill(battle, configs) {
    let best = 0, score = -Infinity;
    for (let index = 0; index < battle.enemy.skills.length; index++) {
      if (battle.enemy.skillPP[index] <= 0) continue;
      const skill = configs.get(battle.enemy.skills[index]);
      if (!skill) continue;
      const next = this.Score(battle, skill, configs);
      if (next > score) { best = skill.id; score = next; }
    }
    return best;
  }
}
module.exports = { ArenaStrategy };
