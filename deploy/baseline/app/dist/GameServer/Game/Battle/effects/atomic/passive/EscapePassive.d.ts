import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 定时逃跑 (2013)
 * n回合逃跑，遇到指定精灵/属性时不逃跑
 * effectArgs: [turnCount, exceptPetId, exceptType1, exceptType2]
 */
export declare class EscapePassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=EscapePassive.d.ts.map