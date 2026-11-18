import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 死亡回血 (2025)
 * 如果HP被打成0，则立刻增加一些HP
 */
export declare class ReviveOnDeathPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 重生 (2044)
 * 重生(HP和btl_maxhp恢复到maxhp+maxhp_adj，技能PP值回满)
 * effectArgs: [maxRevives]
 */
export declare class ReviveFullPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=RevivePassives.d.ts.map