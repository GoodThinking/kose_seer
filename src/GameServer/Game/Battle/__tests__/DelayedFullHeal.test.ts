import { DelayedFullHeal } from '../effects/atomic/special/HpEffects';
import { BattleEffectIntegration } from '../BattleEffectIntegration';
import { createAttacker, createDefender, createMockEffectContext } from './BattleTestHelpers';
import { IBattleInfo } from '../../../../shared/models/BattleModel';

describe('delayed full healing through real turn lifecycle', () => {
  test('heals immediately, waits two starts, then expires exactly once', () => {
    const pet=createAttacker({hp:10,maxHp:100}),enemy=createDefender();
    const effect=new DelayedFullHeal({immediateHeal:20,delayTurns:2});
    effect.execute(createMockEffectContext(pet,enemy));expect(pet.hp).toBe(30);
    const battle={player:pet,enemy,turn:1} as IBattleInfo;
    BattleEffectIntegration.OnTurnStart(battle);expect(pet.hp).toBe(30);expect(pet.effectCounters!.delayed_full_heal).toBe(1);
    battle.turn++;BattleEffectIntegration.OnTurnStart(battle);expect(pet.hp).toBe(100);expect(pet.effectCounters!.delayed_full_heal).toBeUndefined();
    pet.hp=70;battle.turn++;BattleEffectIntegration.OnTurnStart(battle);expect(pet.hp).toBe(70);
  });
  test('immediate healing is capped by max HP and reports actual recovery', () => {
    const pet=createAttacker({hp:95,maxHp:100}),enemy=createDefender();
    const result=new DelayedFullHeal({immediateHeal:50,delayTurns:1}).execute(createMockEffectContext(pet,enemy));
    expect(pet.hp).toBe(100);expect(result[0].value).toBe(5);
    expect(pet.effectCounters!.delayed_full_heal).toBe(1);
  });
});
