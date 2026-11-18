"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VipCoRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: VIP_CO (8006)] VIP状态变更响应
 *
 * 用于通知客户端VIP状态变化（开通超级NoNo、VIP到期等）
 *
 * Response Body:
 * - userId (uint32): 玩家ID
 * - vipType (uint32): VIP类型 (0=无VIP, 1=普通VIP, 2=超级NoNo)
 * - autoCharge (uint32): 自动充电
 * - vipEndTime (uint32): VIP结束时间（秒级时间戳）
 *
 * 扩展字段（客户端会忽略，但可用于调试）:
 * - superLevel (uint32): 超级NoNo等级（仅当vipType=2时有效）
 * - superEnergy (uint32): 超级NoNo能量
 * - superStage (uint32): 超级NoNo阶段
 */
class VipCoRspProto extends BaseProto_1.BaseProto {
    userId = 0;
    vipType = 0;
    autoCharge = 0;
    vipEndTime = 0;
    // 扩展字段（用于调试，客户端会忽略）
    superLevel = 0;
    superEnergy = 0;
    superStage = 0;
    constructor() {
        super(CommandID_1.CommandID.VIP_CO);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(28); // 16 + 12 扩展字段
        writer.WriteUInt32(this.userId);
        writer.WriteUInt32(this.vipType);
        writer.WriteUInt32(this.autoCharge);
        writer.WriteUInt32(this.vipEndTime);
        // 扩展字段：客户端会读取但不使用，不会报错
        writer.WriteUInt32(this.superLevel);
        writer.WriteUInt32(this.superEnergy);
        writer.WriteUInt32(this.superStage);
        return writer.ToBuffer();
    }
    // 链式调用辅助方法
    setUserId(value) {
        this.userId = value;
        return this;
    }
    setVipType(value) {
        this.vipType = value;
        return this;
    }
    setAutoCharge(value) {
        this.autoCharge = value;
        return this;
    }
    setVipEndTime(value) {
        this.vipEndTime = value;
        return this;
    }
    setSuperLevel(value) {
        this.superLevel = value;
        return this;
    }
    setSuperEnergy(value) {
        this.superEnergy = value;
        return this;
    }
    setSuperStage(value) {
        this.superStage = value;
        return this;
    }
}
exports.VipCoRspProto = VipCoRspProto;
//# sourceMappingURL=VipCoRspProto.js.map