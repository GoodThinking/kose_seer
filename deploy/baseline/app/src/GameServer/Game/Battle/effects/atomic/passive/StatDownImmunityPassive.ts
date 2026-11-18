import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 免疫能力下降被动效果
 * BOSS特性1: 免疫所有能力(battle_lv)下降效果
 * 
 * 实现方式：
 * - 在战斗开始时设置 immuneFlags.statDown = true
 * - 战斗系统在能力等级修改时检查此标志，阻止负面修改
 */
export class StatDownImmunityPassive extends BaseAtomicEffect {
  constructor() {
    super(
      'immunity' as AtomicEffectType,
      'StatDownImmunityPassive',
      [EffectTiming.BATTLE_START]
    );
  }

  public validate(params: any): boolean {
    return true; // 无参数，总是有效
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);

    // 在战斗开始时设置免疫标志
    if (context.timing === EffectTiming.BATTLE_START) {
      if (!attacker.immuneFlags) {
        attacker.immuneFlags = {};
      }
      attacker.immuneFlags.statDown = true;

      this.log(`精灵 ${attacker.name} 获得能力下降免疫`, 'info');

      results.push(
        this.createResult(
          true,
          'attacker',
          'immunity',
          `${attacker.name} 免疫能力下降`,
          0,
          { immuneType: 'stat_down' }
        )
      );
    }

    return results;
  }
}
