import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 属性秒杀 (2205)
 * 遇到指定精灵属性，所有技能必定秒杀
 * effectArgs: [type1, type2, ..., type8]
 */
export declare class TypeOhkoPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=TypeOhkoPassive.d.ts.map