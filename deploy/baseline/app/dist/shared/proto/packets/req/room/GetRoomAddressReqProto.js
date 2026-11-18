"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRoomAddressReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 10002 GET_ROOM_ADDRES] 获取房间地址请求
 *
 * 请求格式:
 * - targetUserId: uint32 (目标用户ID)
 */
class GetRoomAddressReqProto extends BaseProto_1.BaseProto {
    targetUserId = 0;
    constructor() {
        super(CommandID_1.CommandID.GET_ROOM_ADDRES);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new GetRoomAddressReqProto();
        if (buffer.length >= 4) {
            proto.targetUserId = buffer.readUInt32BE(0);
        }
        return proto;
    }
}
exports.GetRoomAddressReqProto = GetRoomAddressReqProto;
//# sourceMappingURL=GetRoomAddressReqProto.js.map