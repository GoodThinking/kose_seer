import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 定时逃跑 (2013)
 * n回合逃跑，遇到指定精灵/属性时不逃跑
 * effectArgs: [turnCount, exceptPetId, exceptType1, exceptType2]
 */
export class EscapePassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'EscapePassive', [EffectTiming.TURN_END]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const defender = this.getDefender(context);
    const turnCount = context.effectArgs?.[0] || 0;
    const exceptPetId = context.effectArgs?.[1] || 0;
    const exceptType1 = context.effectArgs?.[2] || 0;
    const exceptType2 = context.effectArgs?.[3] || 0;

    // 检查是否遇到不逃跑的精灵
    if (exceptPetId > 0 && defender.petId === exceptPetId) return results;
    if (exceptType1 > 0 && defender.type === exceptType1) return results;
    if (exceptType2 > 0 && defender.type === exceptType2) return results;

    if (turnCount > 0 && context.turn >= turnCount) {
      attacker.hp = 0;
      this.log(`定时逃跑: ${attacker.name} 在第 ${context.turn} 回合逃跑`, 'info');
      results.push(this.createResult(true, 'attacker', 'escape',
        `${attacker.name} 逃跑了`, 0,
        { turnCount, turn: context.turn }));
    }
    return results;
  }
}
