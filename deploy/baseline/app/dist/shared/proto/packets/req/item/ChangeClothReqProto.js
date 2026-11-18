"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeClothReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 更换服装请求
 * CMD 2604
 */
class ChangeClothReqProto extends BaseProto_1.BaseProto {
    clothIds = [];
    constructor() {
        super(CommandID_1.CommandID.CHANGE_CLOTH);
    }
    deserialize(buffer) {
        let offset = 0;
        if (buffer.length >= 4) {
            const clothCount = buffer.readUInt32BE(offset);
            offset += 4;
            for (let i = 0; i < clothCount; i++) {
                if (buffer.length >= offset + 4) {
                    const clothId = buffer.readUInt32BE(offset);
                    this.clothIds.push(clothId);
                    offset += 4;
                }
            }
        }
    }
    serialize() {
        return Buffer.alloc(0);
    }
}
exports.ChangeClothReqProto = ChangeClothReqProto;
//# sourceMappingURL=ChangeClothReqProto.js.map