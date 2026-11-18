"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnOrOffFlyingRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 开关飞行模式响应
 * CMD: 2112 ON_OR_OFF_FLYING
 */
class OnOrOffFlyingRspProto extends BaseProto_1.BaseProto {
    userId = 0;
    flyMode = 0;
    constructor(userId = 0, flyMode = 0) {
        super(CommandID_1.CommandID.ON_OR_OFF_FLYING);
        this.userId = userId;
        this.flyMode = flyMode;
    }
    deserialize(buffer) {
        let offset = 0;
        this.userId = buffer.readUInt32BE(offset);
        offset += 4;
        this.flyMode = buffer.readUInt32BE(offset);
        offset += 4;
    }
    serialize() {
        const buffer = Buffer.alloc(8);
        let offset = 0;
        buffer.writeUInt32BE(this.userId, offset);
        offset += 4;
        buffer.writeUInt32BE(this.flyMode, offset);
        offset += 4;
        return buffer;
    }
}
exports.OnOrOffFlyingRspProto = OnOrOffFlyingRspProto;
//# sourceMappingURL=OnOrOffFlyingRspProto.js.map