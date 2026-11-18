import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 命中消回合效果 (2772)
 * 技能命中前消除对手回合类效果
 */
export declare class ClearEnemyTurnEffectsPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=ClearEnemyTurnEffectsPassive.d.ts.map