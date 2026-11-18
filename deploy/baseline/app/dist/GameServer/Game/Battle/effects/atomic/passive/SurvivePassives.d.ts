import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 致死余1 (2021)
 * 除ID为xxx的技能外，任何能将自身体力降为0的技能都会使自身余下1体力
 * effectArgs: [skillId1, skillId2, ..., skillId8]
 */
export declare class SurviveWith1HpPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 致死存活 (2031)
 * 受到致死攻击时有n%几率余下m点体力
 * effectArgs: [chance, remainHp]
 */
export declare class SurviveLethalChancePassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 五回合不死 (2046)
 * 若自身5回合内体力被降到0会余下1点体力，并且体力全恢复，恢复后回合数重新计算
 */
export declare class FiveTurnImmortalPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=SurvivePassives.d.ts.map