import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 技能破防 (2020)
 * 在被ID为xxx的技能命中前，任何技能都不能伤害自身
 * effectArgs: [skillId1, skillId2, ..., skillId8]
 */
export declare class SkillUnlockShieldPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 属性顺序破防 (2027)
 * 按一定的属性顺序出招的技能才能造成伤害
 * effectArgs: [type1, type2, ..., type8]
 */
export declare class TypeSequenceShieldPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 轮换属性护盾 (2036)
 * 按5回合轮换属性顺序出招的技能才能造成伤害
 * effectArgs: [type1, type2, ..., type8]
 */
export declare class RotatingTypeShieldPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=ShieldPassives.d.ts.map