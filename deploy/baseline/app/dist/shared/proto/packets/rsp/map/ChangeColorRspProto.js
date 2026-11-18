"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeColorRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 修改颜色响应
 * CMD: 2063 CHANGE_COLOR
 */
class ChangeColorRspProto extends BaseProto_1.BaseProto {
    userId = 0;
    newColor = 0;
    cost = 0;
    remain = 0;
    constructor(userId = 0, newColor = 0, cost = 0, remain = 0) {
        super(CommandID_1.CommandID.CHANGE_COLOR);
        this.userId = userId;
        this.newColor = newColor;
        this.cost = cost;
        this.remain = remain;
    }
    deserialize(buffer) {
        let offset = 0;
        this.userId = buffer.readUInt32BE(offset);
        offset += 4;
        this.newColor = buffer.readUInt32BE(offset);
        offset += 4;
        this.cost = buffer.readUInt32BE(offset);
        offset += 4;
        this.remain = buffer.readUInt32BE(offset);
        offset += 4;
    }
    serialize() {
        const buffer = Buffer.alloc(16);
        let offset = 0;
        buffer.writeUInt32BE(this.userId, offset);
        offset += 4;
        buffer.writeUInt32BE(this.newColor, offset);
        offset += 4;
        buffer.writeUInt32BE(this.cost, offset);
        offset += 4;
        buffer.writeUInt32BE(this.remain, offset);
        offset += 4;
        return buffer;
    }
}
exports.ChangeColorRspProto = ChangeColorRspProto;
//# sourceMappingURL=ChangeColorRspProto.js.map