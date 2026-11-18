import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 免疫异常状态被动效果
 * BOSS特性2: 免疫所有异常状态（麻痹、中毒、烧伤、冻伤、睡眠、害怕等）
 * 
 * 实现方式：
 * - 在战斗开始时设置 immuneFlags.status = true
 * - 战斗系统在施加异常状态时检查此标志，阻止状态施加
 */
export class StatusImmunityPassive extends BaseAtomicEffect {
  constructor() {
    super(
      'immunity' as AtomicEffectType,
      'StatusImmunityPassive',
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
      attacker.immuneFlags.status = true;

      this.log(`精灵 ${attacker.name} 获得异常状态免疫`, 'info');

      results.push(
        this.createResult(
          true,
          'attacker',
          'immunity',
          `${attacker.name} 免疫异常状态`,
          0,
          { immuneType: 'status' }
        )
      );
    }

    return results;
  }
}
