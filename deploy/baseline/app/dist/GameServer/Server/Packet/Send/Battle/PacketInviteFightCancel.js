"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketInviteFightCancel = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const InviteFightCancelRspProto_1 = require("../../../../../shared/proto/packets/rsp/battle/InviteFightCancelRspProto");
/**
 * [CMD: 2402 INVITE_FIGHT_CANCEL] 取消邀请响应包装器
 */
class PacketInviteFightCancel extends BaseProto_1.BaseProto {
    _data;
    constructor() {
        super(CommandID_1.CommandID.INVITE_FIGHT_CANCEL);
        const proto = new InviteFightCancelRspProto_1.InviteFightCancelRspProto();
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketInviteFightCancel = PacketInviteFightCancel;
//# sourceMappingURL=PacketInviteFightCancel.js.map