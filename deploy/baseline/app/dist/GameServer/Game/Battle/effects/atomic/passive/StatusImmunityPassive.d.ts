import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 免疫异常状态被动效果
 * BOSS特性2: 免疫所有异常状态（麻痹、中毒、烧伤、冻伤、睡眠、害怕等）
 *
 * 实现方式：
 * - 在战斗开始时设置 immuneFlags.status = true
 * - 战斗系统在施加异常状态时检查此标志，阻止状态施加
 */
export declare class StatusImmunityPassive extends BaseAtomicEffect {
    constructor();
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=StatusImmunityPassive.d.ts.map