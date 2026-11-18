import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 免疫能力下降被动效果
 * BOSS特性1: 免疫所有能力(battle_lv)下降效果
 *
 * 实现方式：
 * - 在战斗开始时设置 immuneFlags.statDown = true
 * - 战斗系统在能力等级修改时检查此标志，阻止负面修改
 */
export declare class StatDownImmunityPassive extends BaseAtomicEffect {
    constructor();
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=StatDownImmunityPassive.d.ts.map