import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 免疫特效 (2050)
 * 免疫某类特效
 * effectArgs: [effectId1, effectId2, ..., effectId8]
 */
export declare class EffectImmunityPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 免疫指定技能特效 (2185)
 * 免疫指定技能的特效
 * effectArgs: [skillId1, skillId2, ..., skillId8]
 */
export declare class SkillEffectImmunityPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=EffectImmunityPassives.d.ts.map