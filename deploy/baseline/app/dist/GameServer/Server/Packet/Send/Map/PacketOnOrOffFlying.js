"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketOnOrOffFlying = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const OnOrOffFlyingRspProto_1 = require("../../../../../shared/proto/packets/rsp/map/OnOrOffFlyingRspProto");
/**
 * 开关飞行模式响应包
 * CMD 1012
 */
class PacketOnOrOffFlying extends BaseProto_1.BaseProto {
    _data;
    constructor(userId, flyMode) {
        super(CommandID_1.CommandID.ON_OR_OFF_FLYING);
        const proto = new OnOrOffFlyingRspProto_1.OnOrOffFlyingRspProto();
        proto.userId = userId;
        proto.flyMode = flyMode;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketOnOrOffFlying = PacketOnOrOffFlying;
//# sourceMappingURL=PacketOnOrOffFlying.js.map