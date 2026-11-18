"use strict";
/**
 * 战斗数据模型
 * 存储战斗状态、参战精灵信息、回合数据等
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BattleStatus = exports.BattleType = void 0;
/**
 * 战斗类型枚举
 */
var BattleType;
(function (BattleType) {
    BattleType["PVE"] = "PVE";
    BattleType["BOSS"] = "BOSS";
    BattleType["FRESH"] = "FRESH";
    BattleType["PVP"] = "PVP"; // PVP战斗
})(BattleType || (exports.BattleType = BattleType = {}));
/**
 * 战斗状态枚举
 */
var BattleStatus;
(function (BattleStatus) {
    BattleStatus[BattleStatus["NONE"] = -1] = "NONE";
    BattleStatus[BattleStatus["PARALYSIS"] = 0] = "PARALYSIS";
    BattleStatus[BattleStatus["POISON"] = 1] = "POISON";
    BattleStatus[BattleStatus["BURN"] = 2] = "BURN";
    BattleStatus[BattleStatus["DRAIN"] = 3] = "DRAIN";
    BattleStatus[BattleStatus["DRAINED"] = 4] = "DRAINED";
    BattleStatus[BattleStatus["FREEZE"] = 5] = "FREEZE";
    BattleStatus[BattleStatus["FEAR"] = 6] = "FEAR";
    BattleStatus[BattleStatus["FATIGUE"] = 7] = "FATIGUE";
    BattleStatus[BattleStatus["SLEEP"] = 8] = "SLEEP";
    BattleStatus[BattleStatus["PETRIFY"] = 9] = "PETRIFY";
    BattleStatus[BattleStatus["CONFUSION"] = 10] = "CONFUSION";
    BattleStatus[BattleStatus["WEAKNESS"] = 11] = "WEAKNESS";
    BattleStatus[BattleStatus["MOUNTAIN_GUARD"] = 12] = "MOUNTAIN_GUARD";
    BattleStatus[BattleStatus["FLAMMABLE"] = 13] = "FLAMMABLE";
    BattleStatus[BattleStatus["RAGE"] = 14] = "RAGE";
    BattleStatus[BattleStatus["ICE_SEAL"] = 15] = "ICE_SEAL";
    BattleStatus[BattleStatus["BLEED"] = 16] = "BLEED";
    BattleStatus[BattleStatus["IMMUNE_DOWN"] = 17] = "IMMUNE_DOWN";
    BattleStatus[BattleStatus["IMMUNE_STATUS"] = 18] = "IMMUNE_STATUS"; // 免疫异常状态
})(BattleStatus || (exports.BattleStatus = BattleStatus = {}));
//# sourceMappingURL=BattleModel.js.map