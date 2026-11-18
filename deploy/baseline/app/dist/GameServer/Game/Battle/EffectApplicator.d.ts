/**
 * 效果应用器
 * 负责将效果结果应用到战斗精灵上
 *
 * 从 EffectTrigger 中提取，专注于效果结果的应用逻辑
 */
import { IBattlePet } from '../../../shared/models/BattleModel';
import { IEffectResult } from './effects/core/EffectContext';
/**
 * 效果应用器
 */
export declare class EffectApplicator {
    /**
     * 应用效果结果到战斗精灵
     */
    static Apply(results: IEffectResult[], attacker: IBattlePet, defender: IBattlePet): void;
    /**
     * 检查效果概率是否触发
     */
    static ShouldTrigger(chance: number): boolean;
    private static ApplySingle;
    private static ApplyStatus;
    private static ApplyStatChange;
    private static ApplyTemporaryStatChange;
    private static IsImmune;
}
//# sourceMappingURL=EffectApplicator.d.ts.map