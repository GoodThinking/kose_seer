"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeopleTransformReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 玩家变身请求
 * CMD: 2111 PEOPLE_TRANSFROM
 */
class PeopleTransformReqProto extends BaseProto_1.BaseProto {
    transId = 0;
    constructor() {
        super(CommandID_1.CommandID.PEOPLE_TRANSFROM);
    }
    deserialize(buffer) {
        if (buffer.length >= 4) {
            this.transId = buffer.readUInt32BE(0);
        }
    }
    serialize() {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(this.transId, 0);
        return buffer;
    }
}
exports.PeopleTransformReqProto = PeopleTransformReqProto;
//# sourceMappingURL=PeopleTransformReqProto.js.map