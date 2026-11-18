import { BaseAtomicEffect } from './core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../core/EffectContext';
/**
 * 伤害下限参数接口
 */
export interface IDamageFloorParams {
    /** 最小伤害值 */
    minDamage?: number;
}
/**
 * 伤害下限原子效果
 *
 * 确保造成的伤害不低于指定值
 *
 * @category Special
 */
export declare class DamageFloor extends BaseAtomicEffect {
    private minDamage;
    constructor(params: IDamageFloorParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=DamageFloor.d.ts.map