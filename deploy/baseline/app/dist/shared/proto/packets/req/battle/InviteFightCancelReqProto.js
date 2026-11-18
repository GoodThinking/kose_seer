"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InviteFightCancelReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2402 INVITE_FIGHT_CANCEL] 取消邀请请求
 *
 * 请求格式：
 * - targetUserId: uint32 - 被邀请玩家的ID
 */
class InviteFightCancelReqProto extends BaseProto_1.BaseProto {
    targetUserId = 0;
    constructor() {
        super(CommandID_1.CommandID.INVITE_FIGHT_CANCEL);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new InviteFightCancelReqProto();
        if (buffer.length >= 4) {
            proto.targetUserId = buffer.readUInt32BE(0);
        }
        return proto;
    }
}
exports.InviteFightCancelReqProto = InviteFightCancelReqProto;
//# sourceMappingURL=InviteFightCancelReqProto.js.map