import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 受伤减免被动效果
 * BOSS特性3: 受到任何伤害减免n%
 *
 * 参数：
 * - reductionPercent: 伤害减免百分比（0-100）
 *
 * 实现方式：
 * - 在伤害计算后修改最终伤害值
 * - 伤害 = 原伤害 * (1 - reductionPercent / 100)
 */
export declare class DamageReductionPassive extends BaseAtomicEffect {
    private reductionPercent;
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=DamageReductionPassive.d.ts.map