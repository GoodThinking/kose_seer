import { BaseAtomicEffect } from './core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../core/EffectContext';
/**
 * 伤害上限参数接口
 */
export interface IDamageCapParams {
    /** 持续回合数 */
    duration?: number;
    /** 最大伤害值 */
    maxDamage?: number;
}
/**
 * 伤害上限原子效果
 *
 * 持续N回合，每回合受到的伤害不超过指定值
 *
 * @category Special
 */
export declare class DamageCap extends BaseAtomicEffect {
    private duration;
    private maxDamage;
    constructor(params: IDamageCapParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=DamageCap.d.ts.map