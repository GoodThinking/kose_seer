import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 固定属性加成 (2026)
 * 给一种battle_attr增加固定n点属性值
 * effectArgs: [attrType, value]
 * attrType: 0=attack, 1=defence, 2=spAtk, 3=spDef, 4=speed
 */
export class FlatStatBonusPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'FlatStatBonusPassive', [EffectTiming.BATTLE_START]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const attrType = context.effectArgs?.[0] || 0;
    const value = context.effectArgs?.[1] || 0;

    if (value > 0) {
      const attrMap: { [key: number]: keyof typeof attacker } = {
        0: 'attack' as any,
        1: 'defence' as any,
        2: 'spAtk' as any,
        3: 'spDef' as any,
        4: 'speed' as any,
      };

      const attrName = attrMap[attrType];
      if (attrName) {
        (attacker as any)[attrName] = ((attacker as any)[attrName] || 0) + value;
        this.log(`固定属性加成: ${attacker.name} ${attrName} +${value}`, 'info');
        results.push(this.createResult(true, 'attacker', 'flat_stat_bonus',
          `${attacker.name} ${attrName} 增加 ${value}`, value,
          { attrType, attrName }));
      }
    }
    return results;
  }
}
