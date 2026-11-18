"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketSystemMessage = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const SystemMessageRspProto_1 = require("../../../../../shared/proto/packets/rsp/system/SystemMessageRspProto");
/**
 * 系统消息响应包
 * CMD 8002
 */
class PacketSystemMessage extends BaseProto_1.BaseProto {
    _data;
    constructor(message, npcId = 0, type = 0) {
        super(CommandID_1.CommandID.SYSTEM_MESSAGE);
        const proto = new SystemMessageRspProto_1.SystemMessageRspProto(message, npcId, type);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketSystemMessage = PacketSystemMessage;
//# sourceMappingURL=PacketSystemMessage.js.map