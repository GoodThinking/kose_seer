"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DanceActionReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 舞蹈动作请求
 * CMD: 2103 DANCE_ACTION
 */
class DanceActionReqProto extends BaseProto_1.BaseProto {
    actionId = 0;
    actionType = 0;
    constructor() {
        super(CommandID_1.CommandID.DANCE_ACTION);
    }
    deserialize(buffer) {
        let offset = 0;
        if (buffer.length >= 8) {
            this.actionId = buffer.readUInt32BE(offset);
            offset += 4;
            this.actionType = buffer.readUInt32BE(offset);
            offset += 4;
        }
    }
    serialize() {
        const buffer = Buffer.alloc(8);
        let offset = 0;
        buffer.writeUInt32BE(this.actionId, offset);
        offset += 4;
        buffer.writeUInt32BE(this.actionType, offset);
        offset += 4;
        return buffer;
    }
}
exports.DanceActionReqProto = DanceActionReqProto;
//# sourceMappingURL=DanceActionReqProto.js.map