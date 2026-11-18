import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 魔王附身 (2059)
 * 按一定条件触发魔王的附身，触发时受到伤害时n回合内反弹m%伤害给玩家
 * effectArgs: [duration, reflectPercent]
 */
export declare class BossPossessionPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=BossPossessionPassive.d.ts.map