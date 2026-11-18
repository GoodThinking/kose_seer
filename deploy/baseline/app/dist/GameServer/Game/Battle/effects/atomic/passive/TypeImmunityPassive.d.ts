import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 属性免疫被动效果
 * BOSS特性5: 只受到来自普通属性和某类属性的攻击伤害（其他属性免疫）
 *
 * 参数：
 * - allowedType1-8: 允许的属性类型（mon_type: 1-26），0表示无
 *
 * 实现方式：
 * - 在伤害计算后检查攻击属性
 * - 如果攻击属性不在允许列表中，将伤害设为0
 */
export declare class TypeImmunityPassive extends BaseAtomicEffect {
    private allowedTypes;
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=TypeImmunityPassive.d.ts.map