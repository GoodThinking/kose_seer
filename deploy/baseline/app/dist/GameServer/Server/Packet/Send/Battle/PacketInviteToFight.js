"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketInviteToFight = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const InviteToFightRspProto_1 = require("../../../../../shared/proto/packets/rsp/battle/InviteToFightRspProto");
/**
 * [CMD: 2401 INVITE_TO_FIGHT] 邀请对战响应包装器
 */
class PacketInviteToFight extends BaseProto_1.BaseProto {
    _data;
    constructor() {
        super(CommandID_1.CommandID.INVITE_TO_FIGHT);
        const proto = new InviteToFightRspProto_1.InviteToFightRspProto();
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketInviteToFight = PacketInviteToFight;
//# sourceMappingURL=PacketInviteToFight.js.map