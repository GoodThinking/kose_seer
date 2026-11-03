'use strict';
// Both cutover and deployed-baseline builds must keep the same attack-result contract.
module.exports = function patchAttackDamageDisplay(text) {
  const replace = (before, after) => {
    if (text.split(before).length !== 2) throw Error('Changed attack display anchor: ' + before);
    text = text.replace(before, after);
  };
  replace('            result.damage = (result.damage || 0) + (context.extraDamage || 0) + Math.max(0, defenderHpBeforeAfterAction - defender.hp);',
    '            result.damage = (result.damage || 0) + (context.extraDamage || 0) + Math.max(0, defenderHpBeforeAfterAction - defender.hp);\n            result.displayDamage = (context.displayDamage || 0) + Math.max(0, result.damage - (context.appliedDamage || 0));');
  replace("budget.damage(battle, attacker, defender, 'direct', Math.min(segment, defender.hp - universeActualDirect))",
    "budget.damage(battle, attacker, defender, 'direct', segment, {remainingHp: defender.hp - universeActualDirect})");
  replace("budget.damage(battle, attacker, defender, 'fraction', Math.min(universePreparedFraction, Math.max(0, defender.hp - universeActualDirect)), {indirectModified: true})",
    "budget.damage(battle, attacker, defender, 'fraction', universePreparedFraction, {indirectModified: true, remainingHp: Math.max(0, defender.hp - universeActualDirect)})");
  return text;
};
