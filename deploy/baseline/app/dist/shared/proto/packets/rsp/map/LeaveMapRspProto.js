"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveMapRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 离开地图响应
 * CMD: 2002 LEAVE_MAP
 */
class LeaveMapRspProto extends BaseProto_1.BaseProto {
    userId = 0;
    constructor(userId = 0) {
        super(CommandID_1.CommandID.LEAVE_MAP);
        this.userId = userId;
    }
    deserialize(buffer) {
        if (buffer.length >= 4) {
            this.userId = buffer.readUInt32BE(0);
        }
    }
    serialize() {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(this.userId, 0);
        return buffer;
    }
}
exports.LeaveMapRspProto = LeaveMapRspProto;
//# sourceMappingURL=LeaveMapRspProto.js.map