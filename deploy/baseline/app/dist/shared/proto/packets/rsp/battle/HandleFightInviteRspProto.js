"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandleFightInviteRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2403 HANDLE_FIGHT_INVITE] 处理对战邀请响应
 *
 * 响应格式：空包（只有result）
 */
class HandleFightInviteRspProto extends BaseProto_1.BaseProto {
    constructor() {
        super(CommandID_1.CommandID.HANDLE_FIGHT_INVITE);
    }
    serialize() {
        return Buffer.alloc(0);
    }
}
exports.HandleFightInviteRspProto = HandleFightInviteRspProto;
//# sourceMappingURL=HandleFightInviteRspProto.js.map