"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketHandleFightInvite = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const HandleFightInviteRspProto_1 = require("../../../../../shared/proto/packets/rsp/battle/HandleFightInviteRspProto");
/**
 * [CMD: 2403 HANDLE_FIGHT_INVITE] 处理对战邀请响应包装器
 */
class PacketHandleFightInvite extends BaseProto_1.BaseProto {
    _data;
    constructor() {
        super(CommandID_1.CommandID.HANDLE_FIGHT_INVITE);
        const proto = new HandleFightInviteRspProto_1.HandleFightInviteRspProto();
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketHandleFightInvite = PacketHandleFightInvite;
//# sourceMappingURL=PacketHandleFightInvite.js.map