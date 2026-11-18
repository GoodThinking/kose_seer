/**
 * 被动能力系统（兼容层）
 *
 * 保留原有接口以兼容 BattleInitService 等调用方。
 * 实际功能委托给 BossAbilityManager → PassiveEffectRunner。
 */
import { IBattlePet } from '../../../shared/models/BattleModel';
import { IEffectResult } from './effects/core/EffectContext';
/**
 * 被动能力系统类
 */
export declare class PassiveAbilitySystem {
    /**
     * 在战斗开始时触发精灵的所有被动能力
     *
     * @param pet 精灵对象
     * @param opponent 对手精灵
     * @returns 空数组（实际效果由 PassiveEffectRunner 在各时机自动触发）
     */
    static TriggerPassiveAbilities(pet: IBattlePet, opponent: IBattlePet): IEffectResult[];
    /**
     * 从玩家精灵的effectList加载特性配置
     */
    private static LoadPlayerAbilities;
    /**
     * 为精灵配置被动能力（运行时配置）
     *
     * @deprecated 请在 boss_abilities.json 中配置
     */
    static ConfigurePassiveAbilities(petId: number, abilityIds: number[]): void;
}
//# sourceMappingURL=PassiveAbilitySystem.d.ts.map