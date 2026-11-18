import { BaseAtomicEffect } from './core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../core/EffectContext';
/**
 * 击败回复参数接口
 */
export interface IKoHealParams {
    /** 回复比例（相对于最大HP） */
    healRatio?: number;
}
/**
 * 击败回复原子效果
 *
 * 击败对手后回复自身HP
 *
 * @category Special
 */
export declare class KoHeal extends BaseAtomicEffect {
    private healRatio;
    constructor(params: IKoHealParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=KoHeal.d.ts.map