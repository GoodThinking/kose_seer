import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 轮换免疫 (2052)
 * 第3n+1回合免疫特殊攻击，第3n+2回合免疫物理攻击，第3n+3回合免疫属性攻击
 */
export declare class RotatingAttackImmunityPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=RotatingAttackImmunityPassive.d.ts.map