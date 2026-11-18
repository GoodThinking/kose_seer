"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AimatRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 瞄准/交互响应
 * CMD: 2104 AIMAT
 */
class AimatRspProto extends BaseProto_1.BaseProto {
    userId = 0;
    targetType = 0;
    targetId = 0;
    x = 0;
    y = 0;
    constructor(userId = 0, targetType = 0, targetId = 0, x = 0, y = 0) {
        super(CommandID_1.CommandID.AIMAT);
        this.userId = userId;
        this.targetType = targetType;
        this.targetId = targetId;
        this.x = x;
        this.y = y;
    }
    deserialize(buffer) {
        let offset = 0;
        this.userId = buffer.readUInt32BE(offset);
        offset += 4;
        this.targetType = buffer.readUInt32BE(offset);
        offset += 4;
        this.targetId = buffer.readUInt32BE(offset);
        offset += 4;
        this.x = buffer.readUInt32BE(offset);
        offset += 4;
        this.y = buffer.readUInt32BE(offset);
        offset += 4;
    }
    serialize() {
        const buffer = Buffer.alloc(20);
        let offset = 0;
        buffer.writeUInt32BE(this.userId, offset);
        offset += 4;
        buffer.writeUInt32BE(this.targetType, offset);
        offset += 4;
        buffer.writeUInt32BE(this.targetId, offset);
        offset += 4;
        buffer.writeUInt32BE(this.x, offset);
        offset += 4;
        buffer.writeUInt32BE(this.y, offset);
        offset += 4;
        return buffer;
    }
}
exports.AimatRspProto = AimatRspProto;
//# sourceMappingURL=AimatRspProto.js.map