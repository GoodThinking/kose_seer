"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InviteToFightReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2401 INVITE_TO_FIGHT] 邀请对战请求
 *
 * 请求格式：
 * - targetUserId: uint32 - 被邀请玩家的ID
 * - mode: uint32 - 对战模式（1=单挑，2=多精灵）
 */
class InviteToFightReqProto extends BaseProto_1.BaseProto {
    targetUserId = 0;
    mode = 2; // 默认多精灵模式
    constructor() {
        super(CommandID_1.CommandID.INVITE_TO_FIGHT);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new InviteToFightReqProto();
        if (buffer.length >= 4) {
            proto.targetUserId = buffer.readUInt32BE(0); // 客户端使用大端序
        }
        if (buffer.length >= 8) {
            proto.mode = buffer.readUInt32BE(4); // 客户端使用大端序
        }
        return proto;
    }
}
exports.InviteToFightReqProto = InviteToFightReqProto;
//# sourceMappingURL=InviteToFightReqProto.js.map