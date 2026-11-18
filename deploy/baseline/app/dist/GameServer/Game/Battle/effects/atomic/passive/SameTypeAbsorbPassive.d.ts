import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 同系吸收被动效果
 * BOSS特性4: 受到与自身相同系属的攻击会恢复自身相应体力
 *
 * 实现方式：
 * - 在伤害计算后检查攻击属性
 * - 如果攻击属性与防御方属性相同，将伤害转换为治疗
 */
export declare class SameTypeAbsorbPassive extends BaseAtomicEffect {
    constructor();
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=SameTypeAbsorbPassive.d.ts.map