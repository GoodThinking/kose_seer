"use strict";
/**
 * 技能效果数据模型
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbnormalStatus = exports.BattleLevel = exports.BattleAttr = exports.SkillEffectType = void 0;
exports.parseEffectArgs = parseEffectArgs;
/**
 * 技能效果类型枚举
 * 根据 luvit/luvit_version/game/seer_skill_effects.lua 定义
 */
var SkillEffectType;
(function (SkillEffectType) {
    SkillEffectType[SkillEffectType["NONE"] = 0] = "NONE";
    SkillEffectType[SkillEffectType["ABSORB"] = 1] = "ABSORB";
    SkillEffectType[SkillEffectType["STAT_DOWN"] = 2] = "STAT_DOWN";
    SkillEffectType[SkillEffectType["STAT_UP"] = 3] = "STAT_UP";
    SkillEffectType[SkillEffectType["STAT_UP_2"] = 4] = "STAT_UP_2";
    SkillEffectType[SkillEffectType["STAT_DOWN_2"] = 5] = "STAT_DOWN_2";
    SkillEffectType[SkillEffectType["RECOIL"] = 6] = "RECOIL";
    SkillEffectType[SkillEffectType["HP_EQUAL"] = 7] = "HP_EQUAL";
    SkillEffectType[SkillEffectType["MERCY"] = 8] = "MERCY";
    SkillEffectType[SkillEffectType["RAGE"] = 9] = "RAGE";
    SkillEffectType[SkillEffectType["PARALYSIS"] = 10] = "PARALYSIS";
    SkillEffectType[SkillEffectType["BIND"] = 11] = "BIND";
    SkillEffectType[SkillEffectType["BURN"] = 12] = "BURN";
    SkillEffectType[SkillEffectType["POISON"] = 13] = "POISON";
    SkillEffectType[SkillEffectType["BIND_2"] = 14] = "BIND_2";
    SkillEffectType[SkillEffectType["FLINCH"] = 15] = "FLINCH";
    SkillEffectType[SkillEffectType["FREEZE"] = 16] = "FREEZE";
    SkillEffectType[SkillEffectType["SLEEP"] = 17] = "SLEEP";
    SkillEffectType[SkillEffectType["FEAR"] = 18] = "FEAR";
    SkillEffectType[SkillEffectType["CONFUSION"] = 19] = "CONFUSION";
    SkillEffectType[SkillEffectType["FATIGUE"] = 20] = "FATIGUE";
    // 21-28 未定义
    SkillEffectType[SkillEffectType["FLINCH_2"] = 29] = "FLINCH_2";
    // 30 未定义
    SkillEffectType[SkillEffectType["MULTI_HIT"] = 31] = "MULTI_HIT";
    // 32 未定义
    SkillEffectType[SkillEffectType["PP_REDUCE"] = 33] = "PP_REDUCE";
    SkillEffectType[SkillEffectType["ENCORE"] = 34] = "ENCORE";
    SkillEffectType[SkillEffectType["PUNISHMENT"] = 35] = "PUNISHMENT"; // 惩罚（根据对方能力提升增加伤害）
    // 36-40+ 未定义或未实现
})(SkillEffectType || (exports.SkillEffectType = SkillEffectType = {}));
/**
 * 战斗属性枚举
 */
var BattleAttr;
(function (BattleAttr) {
    BattleAttr[BattleAttr["HP"] = 0] = "HP";
    BattleAttr[BattleAttr["ATK"] = 1] = "ATK";
    BattleAttr[BattleAttr["DEF"] = 2] = "DEF";
    BattleAttr[BattleAttr["SP_ATK"] = 3] = "SP_ATK";
    BattleAttr[BattleAttr["SP_DEF"] = 4] = "SP_DEF";
    BattleAttr[BattleAttr["SPEED"] = 5] = "SPEED";
})(BattleAttr || (exports.BattleAttr = BattleAttr = {}));
/**
 * 战斗等级枚举（能力等级）
 */
var BattleLevel;
(function (BattleLevel) {
    BattleLevel[BattleLevel["ATK"] = 0] = "ATK";
    BattleLevel[BattleLevel["DEF"] = 1] = "DEF";
    BattleLevel[BattleLevel["SP_ATK"] = 2] = "SP_ATK";
    BattleLevel[BattleLevel["SP_DEF"] = 3] = "SP_DEF";
    BattleLevel[BattleLevel["SPEED"] = 4] = "SPEED";
    BattleLevel[BattleLevel["ACCURACY"] = 5] = "ACCURACY";
})(BattleLevel || (exports.BattleLevel = BattleLevel = {}));
/**
 * 异常状态枚举
 */
var AbnormalStatus;
(function (AbnormalStatus) {
    AbnormalStatus[AbnormalStatus["PARALYSIS"] = 0] = "PARALYSIS";
    AbnormalStatus[AbnormalStatus["POISONED"] = 1] = "POISONED";
    AbnormalStatus[AbnormalStatus["BURNING"] = 2] = "BURNING";
    AbnormalStatus[AbnormalStatus["FROSTED"] = 5] = "FROSTED";
    AbnormalStatus[AbnormalStatus["FRIGHTENED"] = 6] = "FRIGHTENED";
    AbnormalStatus[AbnormalStatus["SLEEP"] = 8] = "SLEEP"; // 睡眠
})(AbnormalStatus || (exports.AbnormalStatus = AbnormalStatus = {}));
/**
 * 解析效果参数字符串
 * @param argsStr 参数字符串 (格式: "arg1 arg2 arg3" 或 "arg1,arg2")
 */
function parseEffectArgs(argsStr) {
    if (!argsStr || argsStr.trim() === '')
        return [];
    const args = [];
    const matches = argsStr.match(/(-?\d+)/g);
    if (matches) {
        for (const match of matches) {
            args.push(parseInt(match));
        }
    }
    return args;
}
//# sourceMappingURL=SkillEffectModel.js.map