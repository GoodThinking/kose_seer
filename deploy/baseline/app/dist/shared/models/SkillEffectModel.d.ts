/**
 * 技能效果数据模型
 */
/**
 * 技能效果配置（从 XML 加载）
 */
export interface ISkillEffectConfig {
    id: number;
    eid: number;
    stat: number;
    times: number;
    args: string;
    desc?: string;
    desc2?: string;
    itemId?: number;
}
/**
 * 技能效果类型枚举
 * 根据 luvit/luvit_version/game/seer_skill_effects.lua 定义
 */
export declare enum SkillEffectType {
    NONE = 0,// 无效果
    ABSORB = 1,// 吸血效果
    STAT_DOWN = 2,// 降低对方能力等级
    STAT_UP = 3,// 提升自身能力等级
    STAT_UP_2 = 4,// 提升自身能力等级2
    STAT_DOWN_2 = 5,// 降低对方能力等级2
    RECOIL = 6,// 反伤（自身受伤）
    HP_EQUAL = 7,// 同生共死
    MERCY = 8,// 手下留情
    RAGE = 9,// 愤怒
    PARALYSIS = 10,// 麻痹
    BIND = 11,// 束缚
    BURN = 12,// 烧伤
    POISON = 13,// 中毒
    BIND_2 = 14,// 束缚2
    FLINCH = 15,// 畏缩
    FREEZE = 16,// 冻伤（未在Lua中实现）
    SLEEP = 17,// 睡眠（未在Lua中实现）
    FEAR = 18,// 害怕（未在Lua中实现）
    CONFUSION = 19,// 混乱（未在Lua中实现）
    FATIGUE = 20,// 疲惫
    FLINCH_2 = 29,// 畏缩2（变体）
    MULTI_HIT = 31,// 连续攻击
    PP_REDUCE = 33,// 消化不良（减少PP）
    ENCORE = 34,// 克制（强制重复技能）
    PUNISHMENT = 35
}
/**
 * 战斗属性枚举
 */
export declare enum BattleAttr {
    HP = 0,
    ATK = 1,
    DEF = 2,
    SP_ATK = 3,
    SP_DEF = 4,
    SPEED = 5
}
/**
 * 战斗等级枚举（能力等级）
 */
export declare enum BattleLevel {
    ATK = 0,
    DEF = 1,
    SP_ATK = 2,
    SP_DEF = 3,
    SPEED = 4,
    ACCURACY = 5
}
/**
 * 异常状态枚举
 */
export declare enum AbnormalStatus {
    PARALYSIS = 0,// 麻痹
    POISONED = 1,// 中毒
    BURNING = 2,// 灼烧
    FROSTED = 5,// 冰冻
    FRIGHTENED = 6,// 害怕
    SLEEP = 8
}
/**
 * 技能效果结果
 */
export interface ISkillEffectResult {
    type: string;
    target: string;
    amount?: number;
    stat?: BattleAttr;
    level?: BattleLevel;
    status?: AbnormalStatus;
    success: boolean;
    message?: string;
}
/**
 * 解析效果参数字符串
 * @param argsStr 参数字符串 (格式: "arg1 arg2 arg3" 或 "arg1,arg2")
 */
export declare function parseEffectArgs(argsStr: string): number[];
//# sourceMappingURL=SkillEffectModel.d.ts.map