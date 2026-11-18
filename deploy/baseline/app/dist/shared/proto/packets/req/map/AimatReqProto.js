"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AimatReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 瞄准/交互请求
 * CMD: 2104 AIMAT
 */
class AimatReqProto extends BaseProto_1.BaseProto {
    targetType = 0;
    targetId = 0;
    x = 0;
    y = 0;
    constructor() {
        super(CommandID_1.CommandID.AIMAT);
    }
    deserialize(buffer) {
        let offset = 0;
        if (buffer.length >= 16) {
            this.targetType = buffer.readUInt32BE(offset);
            offset += 4;
            this.targetId = buffer.readUInt32BE(offset);
            offset += 4;
            this.x = buffer.readUInt32BE(offset);
            offset += 4;
            this.y = buffer.readUInt32BE(offset);
            offset += 4;
        }
    }
    serialize() {
        const buffer = Buffer.alloc(16);
        let offset = 0;
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
exports.AimatReqProto = AimatReqProto;
//# sourceMappingURL=AimatReqProto.js.map