import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 无限PP (2010)
 * 无限PP值 - 战斗开始时设置标志，每回合开始恢复PP
 */
export declare class InfinitePPPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=InfinitePPPassive.d.ts.map