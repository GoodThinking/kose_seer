"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InviteFightCancelRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2402 INVITE_FIGHT_CANCEL] 取消邀请响应
 *
 * 响应格式：空包（只有result）
 */
class InviteFightCancelRspProto extends BaseProto_1.BaseProto {
    constructor() {
        super(CommandID_1.CommandID.INVITE_FIGHT_CANCEL);
    }
    serialize() {
        return Buffer.alloc(0);
    }
}
exports.InviteFightCancelRspProto = InviteFightCancelRspProto;
//# sourceMappingURL=InviteFightCancelRspProto.js.map