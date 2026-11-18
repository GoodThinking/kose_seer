"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FightSpecialPetReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2421 FIGHT_SPECIAL_PET] 挑战盖亚请求
 */
class FightSpecialPetReqProto extends BaseProto_1.BaseProto {
    param2 = 0;
    constructor() {
        super(CommandID_1.CommandID.FIGHT_SPECIAL_PET);
    }
    deserialize(buffer) {
        if (buffer.length >= 4) {
            this.param2 = buffer.readUInt32BE(0);
        }
    }
    serialize() {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(this.param2, 0);
        return buffer;
    }
    static fromBuffer(buffer) {
        const proto = new FightSpecialPetReqProto();
        proto.deserialize(buffer);
        return proto;
    }
}
exports.FightSpecialPetReqProto = FightSpecialPetReqProto;
//# sourceMappingURL=FightSpecialPetReqProto.js.map