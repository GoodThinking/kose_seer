import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 闪避回血 (2082)
 * 每躲避一次攻击，该回合结束后会回复n体力
 * effectArgs: [healAmount]
 */
export declare class DodgeHealPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=DodgeHealPassive.d.ts.map