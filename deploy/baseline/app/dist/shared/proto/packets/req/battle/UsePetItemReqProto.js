"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsePetItemReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2406 USE_PET_ITEM] 使用精灵道具请求
 */
class UsePetItemReqProto extends BaseProto_1.BaseProto {
    itemId = 0; // 道具ID
    catchTime;
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer, profile = 'kose') {
        const proto = new UsePetItemReqProto();
        // Fixed Nieo RenewBloodItemCategory also sends catchTime/itemId/reserved.
        if (profile === 'xin-20261013' || buffer.length === 12) {
            if (buffer.length !== 12 || buffer.readUInt32BE(8) !== 0)
                throw new RangeError('Invalid USE_PET_ITEM body');
            proto.catchTime = buffer.readUInt32BE(0);
            proto.itemId = buffer.readUInt32BE(4);
        }
        else {
            if (buffer.length !== 4)
                throw new RangeError('Invalid KOSE USE_PET_ITEM body');
            proto.itemId = buffer.readUInt32BE(0);
        }
        return proto;
    }
}
exports.UsePetItemReqProto = UsePetItemReqProto;
//# sourceMappingURL=UsePetItemReqProto.js.map