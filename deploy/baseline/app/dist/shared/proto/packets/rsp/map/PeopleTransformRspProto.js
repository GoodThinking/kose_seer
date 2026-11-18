"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeopleTransformRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 玩家变身响应
 * CMD: 2111 PEOPLE_TRANSFROM
 */
class PeopleTransformRspProto extends BaseProto_1.BaseProto {
    userId = 0;
    transId = 0;
    constructor(userId = 0, transId = 0) {
        super(CommandID_1.CommandID.PEOPLE_TRANSFROM);
        this.userId = userId;
        this.transId = transId;
    }
    deserialize(buffer) {
        let offset = 0;
        this.userId = buffer.readUInt32BE(offset);
        offset += 4;
        this.transId = buffer.readUInt32BE(offset);
        offset += 4;
    }
    serialize() {
        const buffer = Buffer.alloc(8);
        let offset = 0;
        buffer.writeUInt32BE(this.userId, offset);
        offset += 4;
        buffer.writeUInt32BE(this.transId, offset);
        offset += 4;
        return buffer;
    }
}
exports.PeopleTransformRspProto = PeopleTransformRspProto;
//# sourceMappingURL=PeopleTransformRspProto.js.map