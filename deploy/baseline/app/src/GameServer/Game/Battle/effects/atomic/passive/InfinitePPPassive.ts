import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 无限PP (2010)
 * 无限PP值 - 战斗开始时设置标志，每回合开始恢复PP
 */
export class InfinitePPPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'InfinitePPPassive', [EffectTiming.BATTLE_START, EffectTiming.TURN_START]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);

    if (!attacker.effectCounters) attacker.effectCounters = {};
    attacker.effectCounters.infinitePP = true;

    // 每回合恢复PP到满
    if (attacker.skillPP) {
      for (let i = 0; i < attacker.skillPP.length; i++) {
        attacker.skillPP[i] = 99;
      }
    }

    if (context.timing === EffectTiming.BATTLE_START) {
      this.log(`${attacker.name} 获得无限PP`, 'info');
      results.push(this.createResult(true, 'attacker', 'infinite_pp',
        `${attacker.name} 获得无限PP`, 0));
    }
    return results;
  }
}
