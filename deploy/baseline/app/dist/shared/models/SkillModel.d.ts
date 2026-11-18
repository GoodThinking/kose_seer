/**
 * 技能数据模型
 */
/**
 * 技能信息接口
 */
export interface ISkillInfo {
    id: number;
    name: string;
    category: number;
    type: number;
    power: number;
    pp: number;
    maxPP: number;
    accuracy: number;
    critRate: number;
    priority: number;
    mustHit: boolean;
    sideEffect?: number;
    sideEffectArg?: string | number;
}
/**
 * 精灵技能槽
 */
export interface IPetSkill {
    skillId: number;
    pp: number;
    maxPP: number;
}
/**
 * 技能配置（从配置文件加载）
 */
export interface ISkillConfig {
    id: number;
    name: string;
    category: number;
    type: number;
    power: number;
    maxPP: number;
    accuracy: number;
    critRate: number;
    priority: number;
    mustHit: boolean;
    sideEffect?: number | string;
    sideEffectArg?: string | number;
    critAtkFirst?: boolean;
    critAtkSecond?: boolean;
    critSelfHalfHp?: boolean;
    critFoeHalfHp?: boolean;
}
/**
 * 创建默认技能
 */
export declare function createDefaultSkill(skillId: number): IPetSkill;
/**
 * 技能类别枚举
 *
 * 注意：XML中的Category值：
 * - 1 = 物理攻击
 * - 2 = 特殊攻击
 * - 4 = 变化技能（STATUS）
 */
export declare enum SkillCategory {
    PHYSICAL = 1,// 物理
    SPECIAL = 2,// 特殊
    STATUS = 4
}
/**
 * 属性类型枚举
 */
export declare enum ElementType {
    NORMAL = 0,// 普通
    FIRE = 1,// 火
    WATER = 2,// 水
    GRASS = 3,// 草
    ELECTRIC = 4,// 电
    ICE = 5,// 冰
    FIGHTING = 6,// 格斗
    POISON = 7,// 毒
    GROUND = 8,// 地面
    FLYING = 9,// 飞行
    PSYCHIC = 10,// 超能
    BUG = 11,// 虫
    ROCK = 12,// 岩石
    GHOST = 13,// 幽灵
    DRAGON = 14,// 龙
    DARK = 15,// 暗
    STEEL = 16,// 钢
    LIGHT = 17
}
//# sourceMappingURL=SkillModel.d.ts.map