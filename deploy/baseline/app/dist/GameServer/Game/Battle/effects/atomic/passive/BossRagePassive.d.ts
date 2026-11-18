import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 魔王愤怒 (2058)
 * 按一定条件触发魔王的愤怒，触发时战斗等级提升至一定状态
 * effectArgs: [atkLevel, defLevel, spAtkLevel, spDefLevel, spdLevel, accLevel]
 * -1表示不设置
 */
export declare class BossRagePassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=BossRagePassive.d.ts.map