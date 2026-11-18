/**
 * 战斗测试辅助工具
 * 提供 IBattlePet、IEffectContext 等对象的 mock 构建函数
 */
import { IBattlePet, BattleStatus } from '../../../../shared/models/BattleModel';
import { IEffectContext } from '../effects/core/EffectContext';
/**
 * 创建测试用精灵数据
 */
export declare function createMockBattlePet(options?: Partial<IBattlePet>): IBattlePet;
/**
 * 创建攻击方精灵（带完整属性）
 */
export declare function createAttacker(options?: Partial<IBattlePet>): IBattlePet;
/**
 * 创建防御方精灵（带完整属性）
 */
export declare function createDefender(options?: Partial<IBattlePet>): IBattlePet;
/**
 * 创建效果上下文
 */
export declare function createMockEffectContext(attacker: IBattlePet, defender: IBattlePet, options?: Partial<IEffectContext>): IEffectContext;
/**
 * 创建效果上下文（简化版本）
 */
export declare function createEffectContextSimple(attackerHp?: number, defenderHp?: number, attackerType?: number, defenderType?: number): IEffectContext;
/**
 * 模拟造成伤害后的效果上下文
 */
export declare function createDamageContext(baseDamage: number, attacker: IBattlePet, defender: IBattlePet): IEffectContext;
/**
 * 创建精灵并应用能力等级
 */
export declare function createPetWithStages(stages: number[], isAttacker?: boolean): IBattlePet;
/**
 * 创建精灵并设置状态
 */
export declare function createPetWithStatus(status: BattleStatus, turns?: number): IBattlePet;
/**
 * 重置精灵HP
 */
export declare function resetPetHp(pet: IBattlePet, hp?: number): IBattlePet;
/**
 * 造成伤害
 */
export declare function applyDamage(pet: IBattlePet, damage: number): IBattlePet;
/**
 * 恢复HP
 */
export declare function healPet(pet: IBattlePet, amount: number): IBattlePet;
/**
 * 模拟技能使用（减少PP）
 */
export declare function useSkill(pet: IBattlePet, skillIndex: number): boolean;
/**
 * 模拟回合开始（状态持续时间减少）
 */
export declare function tickTurnStart(pet: IBattlePet): IBattlePet;
//# sourceMappingURL=BattleTestHelpers.d.ts.map