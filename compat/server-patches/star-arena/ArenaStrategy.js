'use strict';
const { SkillEffectRuntime: R } = require('./SkillEffectRuntime');
const { ElementSystem } = require('./ElementSystem');
const ratio = stage => stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
const active = (pet, key) => !!R.Get(pet, key);
const setups = { 47: 'statDownImmune', 48: 'statusImmune', 49: 'shield', 57: 'regen', 58: 'critAlways', 191: 'statusImmune', 570: 'chAttackBlock' };
const control = new Set([2, 10, 13, 16, 24, 29, 30]);
const weights = {
  aggressive: { attack: 1.35, setup: .65, control: .45, healAt: .35 },
  defensive: { attack: .85, setup: 1.2, control: .8, healAt: .75 },
  tactical: { attack: .95, setup: 1.05, control: 1.4, healAt: .55 },
  balanced: { attack: 1, setup: 1, control: 1, healAt: .55 }
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
    if (attacking && estimate >= foe.hp) score += (skill.priority > 0 || ownSpeed >= foeSpeed) ? 500 : 220;
    if (attacking && skill.priority > 0 && pet.hp / pet.maxHp < .3) score += 55;
    for (const effect of R.Entries(skill)) {
      const a = effect.args;
      if ([43, 450].includes(effect.id)) {
        const missing = pet.maxHp - pet.hp;
        const healing = effect.id === 450 ? (a[0] + a[1]) / 2 : pet.maxHp / Math.max(1, a[0] || 1);
        if (pet.hp / pet.maxHp < w.healAt && missing > 0) score += Math.min(missing, healing) * (style === 'defensive' ? 2 : 1.2);
      }
      if (effect.id === 4 && a[2] > 0) {
        const stage = pet.battleLevels?.[a[0]] || 0;
        const useful = a[0] === 0 ? pet.skills.some(id => configs.get(id)?.category === 1) : a[0] === 2 ? pet.skills.some(id => configs.get(id)?.category === 2) : true;
        if (useful && stage < 2 && pet.hp / pet.maxHp > .35) score += (2 - stage) * 55 * w.setup;
      }
      if (effect.id === 5 && a[2] < 0) {
        const stage = foe.battleLevels?.[a[0]] || 0;
        if (stage > -2 && foe.hp / foe.maxHp > .4) score += (stage + 2) * 48 * (style === 'tactical' ? 1.4 : .8);
      }
      if (control.has(effect.id) && !R.HasStatus(foe) && !R.IsStatusImmune(foe)) score += 115 * w.control;
      const state = setups[effect.id];
      if (state && !active(pet, state) && foe.hp / foe.maxHp > .25) score += 95 * w.setup;
    }
    return score;
  }
  static SelectSkill(battle, configs) {
    // Only the visible current combat state is read. Never inspect the player's submitted command or reserve party.
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
