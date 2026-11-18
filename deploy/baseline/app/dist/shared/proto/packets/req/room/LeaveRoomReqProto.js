"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRoomReqProto = void 0;
const protocol_1 = require("../../../../protocol");
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 10003 LEAVE_ROOM] 离开房间请求
 *
 * 请求格式:
 * - param1 (uint32) - 固定值1
 * - mapId (uint32) - 目标地图ID
 * - catchTime (uint32) - 精灵捕获时间
 * - changeShape (uint32) - 变身状态
 * - actionType (uint32) - 动作类型
 */
class LeaveRoomReqProto extends BaseProto_1.BaseProto {
    param1 = 0;
    mapId = 0;
    catchTime = 0;
    changeShape = 0;
    actionType = 0;
    constructor() {
        super(protocol_1.CommandID.LEAVE_ROOM);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new LeaveRoomReqProto();
        if (buffer.length >= 20) {
            proto.param1 = buffer.readUInt32BE(0);
            proto.mapId = buffer.readUInt32BE(4);
            proto.catchTime = buffer.readUInt32BE(8);
            proto.changeShape = buffer.readUInt32BE(12);
            proto.actionType = buffer.readUInt32BE(16);
        }
        return proto;
    }
}
exports.LeaveRoomReqProto = LeaveRoomReqProto;
//# sourceMappingURL=LeaveRoomReqProto.js.map