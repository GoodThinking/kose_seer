"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketAimat = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const AimatRspProto_1 = require("../../../../../shared/proto/packets/rsp/map/AimatRspProto");
/**
 * 瞄准/交互响应包
 * CMD 1010
 */
class PacketAimat extends BaseProto_1.BaseProto {
    _data;
    constructor(userId, targetType, targetId, x, y) {
        super(CommandID_1.CommandID.AIMAT);
        const proto = new AimatRspProto_1.AimatRspProto();
        proto.userId = userId;
        proto.targetType = targetType;
        proto.targetId = targetId;
        proto.x = x;
        proto.y = y;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketAimat = PacketAimat;
//# sourceMappingURL=PacketAimat.js.map