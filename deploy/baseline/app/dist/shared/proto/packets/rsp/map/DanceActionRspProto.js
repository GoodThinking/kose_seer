"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DanceActionRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 舞蹈动作响应
 * CMD: 2103 DANCE_ACTION
 */
class DanceActionRspProto extends BaseProto_1.BaseProto {
    userId = 0;
    actionId = 0;
    actionType = 0;
    constructor(userId = 0, actionId = 0, actionType = 0) {
        super(CommandID_1.CommandID.DANCE_ACTION);
        this.userId = userId;
        this.actionId = actionId;
        this.actionType = actionType;
    }
    deserialize(buffer) {
        let offset = 0;
        this.userId = buffer.readUInt32BE(offset);
        offset += 4;
        this.actionId = buffer.readUInt32BE(offset);
        offset += 4;
        this.actionType = buffer.readUInt32BE(offset);
        offset += 4;
    }
    serialize() {
        const buffer = Buffer.alloc(12);
        let offset = 0;
        buffer.writeUInt32BE(this.userId, offset);
        offset += 4;
        buffer.writeUInt32BE(this.actionId, offset);
        offset += 4;
        buffer.writeUInt32BE(this.actionType, offset);
        offset += 4;
        return buffer;
    }
}
exports.DanceActionRspProto = DanceActionRspProto;
//# sourceMappingURL=DanceActionRspProto.js.map