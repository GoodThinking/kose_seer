"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomLoginRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 10001 ROOM_LOGIN] 房间登录响应
 *
 * 响应格式:
 * - 空响应，只返回result
 */
class RoomLoginRspProto extends BaseProto_1.BaseProto {
    constructor() {
        super(CommandID_1.CommandID.ROOM_LOGIN);
    }
    serialize() {
        // 空响应
        return Buffer.alloc(0);
    }
}
exports.RoomLoginRspProto = RoomLoginRspProto;
//# sourceMappingURL=RoomLoginRspProto.js.map