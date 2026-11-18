import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 复制强化 (2070)
 * 对手的能力提升效果会同时作用到自己身上
 */
export declare class CopyEnemyBuffPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=CopyEnemyBuffPassive.d.ts.map