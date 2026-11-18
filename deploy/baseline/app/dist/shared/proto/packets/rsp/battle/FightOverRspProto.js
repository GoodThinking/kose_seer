"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FightOverRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
const utils_1 = require("../../../../utils");
/**
 * [CMD: 2506 FIGHT_OVER] 战斗结束响应
 *
 * 客户端格式（FightOverInfo.as）：
 * - reason: uint32 (结束原因)
 * - winnerId: uint32 (获胜者ID)
 * - twoTimes: uint32 (双倍经验次数)
 * - threeTimes: uint32 (三倍经验次数)
 * - autoFightTimes: uint32 (自动战斗次数)
 * - energyTimes: uint32 (能源采集次数)
 * - learnTimes: uint32 (学习次数)
 */
class FightOverRspProto extends BaseProto_1.BaseProto {
    reason = 0; // 结束原因 (0=正常结束, 1=对方逃跑, 2=超时, 3=平局, 4=系统错误, 5=NPC逃跑)
    winnerId = 0; // 获胜者ID (玩家ID=胜利, 0=失败)
    twoTimes = 0; // 双倍经验次数
    threeTimes = 0; // 三倍经验次数
    autoFightTimes = 0; // 自动战斗次数
    energyTimes = 0; // 能源采集次数
    learnTimes = 0; // 学习次数
    constructor() {
        super(CommandID_1.CommandID.FIGHT_OVER);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(64);
        writer.WriteUInt32(this.reason);
        writer.WriteUInt32(this.winnerId);
        writer.WriteUInt32(this.twoTimes);
        writer.WriteUInt32(this.threeTimes);
        writer.WriteUInt32(this.autoFightTimes);
        writer.WriteUInt32(this.energyTimes);
        writer.WriteUInt32(this.learnTimes);
        return writer.ToBuffer();
    }
    // 链式调用
    setReason(value) {
        this.reason = value;
        return this;
    }
    setWinnerId(value) {
        this.winnerId = value;
        return this;
    }
    setTwoTimes(value) {
        this.twoTimes = value;
        return this;
    }
    setThreeTimes(value) {
        this.threeTimes = value;
        return this;
    }
    setAutoFightTimes(value) {
        this.autoFightTimes = value;
        return this;
    }
    setEnergyTimes(value) {
        this.energyTimes = value;
        return this;
    }
    setLearnTimes(value) {
        this.learnTimes = value;
        return this;
    }
}
exports.FightOverRspProto = FightOverRspProto;
//# sourceMappingURL=FightOverRspProto.js.map