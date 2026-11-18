"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeClothRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 更换服装响应
 * CMD 2604
 */
class ChangeClothRspProto extends BaseProto_1.BaseProto {
    userId;
    clothIds;
    constructor(userId, clothIds) {
        super(CommandID_1.CommandID.CHANGE_CLOTH);
        this.userId = userId;
        this.clothIds = clothIds;
    }
    serialize() {
        const buffer = Buffer.alloc(8 + this.clothIds.length * 8);
        let offset = 0;
        buffer.writeUInt32BE(this.userId, offset);
        offset += 4;
        buffer.writeUInt32BE(this.clothIds.length, offset);
        offset += 4;
        for (const clothId of this.clothIds) {
            buffer.writeUInt32BE(clothId, offset);
            offset += 4;
            buffer.writeUInt32BE(0, offset); // clothType (从XML获取，简化为0)
            offset += 4;
        }
        return buffer;
    }
}
exports.ChangeClothRspProto = ChangeClothRspProto;
//# sourceMappingURL=ChangeClothRspProto.js.map