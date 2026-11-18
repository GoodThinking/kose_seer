import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 攻击类型无效 (2048)
 * 对方某种攻击类型无效
 * effectArgs: [attackType] (1=物理, 2=特殊, 3=变化)
 */
export declare class AttackTypeImmunePassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=AttackTypeImmunePassive.d.ts.map