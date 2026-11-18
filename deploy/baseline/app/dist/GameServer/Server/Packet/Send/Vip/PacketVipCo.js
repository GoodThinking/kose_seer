"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketVipCo = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const VipCoRspProto_1 = require("../../../../../shared/proto/packets/rsp/vip/VipCoRspProto");
/**
 * VIP状态变更响应包
 * CMD 8006
 *
 * 用于通知客户端VIP状态变化（开通超级NoNo、VIP到期等）
 */
class PacketVipCo extends BaseProto_1.BaseProto {
    _data;
    constructor(userId, vipType, autoCharge = 0, vipEndTime = 0, superLevel = 0, superEnergy = 0, superStage = 0) {
        super(CommandID_1.CommandID.VIP_CO);
        const proto = new VipCoRspProto_1.VipCoRspProto();
        proto.userId = userId;
        proto.vipType = vipType;
        proto.autoCharge = autoCharge;
        proto.vipEndTime = vipEndTime;
        proto.superLevel = superLevel;
        proto.superEnergy = superEnergy;
        proto.superStage = superStage;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketVipCo = PacketVipCo;
//# sourceMappingURL=PacketVipCo.js.map