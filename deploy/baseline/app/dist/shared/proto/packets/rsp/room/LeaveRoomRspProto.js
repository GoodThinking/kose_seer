"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRoomRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 10003 LEAVE_ROOM] 离开房间响应
 *
 * 响应格式:
 * - 空响应
 */
class LeaveRoomRspProto extends BaseProto_1.BaseProto {
    constructor() {
        super(CommandID_1.CommandID.LEAVE_ROOM);
    }
    serialize() {
        // 空响应
        return Buffer.alloc(0);
    }
}
exports.LeaveRoomRspProto = LeaveRoomRspProto;
//# sourceMappingURL=LeaveRoomRspProto.js.map