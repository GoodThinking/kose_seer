"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InviteToFightRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2401 INVITE_TO_FIGHT] 邀请对战响应
 *
 * 响应格式：空包（只有result）
 */
class InviteToFightRspProto extends BaseProto_1.BaseProto {
    constructor() {
        super(CommandID_1.CommandID.INVITE_TO_FIGHT);
    }
    serialize() {
        return Buffer.alloc(0);
    }
}
exports.InviteToFightRspProto = InviteToFightRspProto;
//# sourceMappingURL=InviteToFightRspProto.js.map