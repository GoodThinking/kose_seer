"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatchMonsterReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2409 CATCH_MONSTER] 捕捉精灵请求
 */
class CatchMonsterReqProto extends BaseProto_1.BaseProto {
    itemId = 0; // 胶囊物品ID
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new CatchMonsterReqProto();
        if (buffer.length >= 4) {
            proto.itemId = buffer.readUInt32BE(0);
        }
        return proto;
    }
}
exports.CatchMonsterReqProto = CatchMonsterReqProto;
//# sourceMappingURL=CatchMonsterReqProto.js.map