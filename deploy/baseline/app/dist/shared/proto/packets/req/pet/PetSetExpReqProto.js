"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetSetExpReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2318 PET_SET_EXP] 设置精灵经验分配请求
 * 精灵分配仪功能 - 将经验分配给指定精灵
 */
class PetSetExpReqProto extends BaseProto_1.BaseProto {
    catchTime = 0; // 精灵捕获时间（唯一标识）
    expAmount = 0; // 要分配的经验值
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new PetSetExpReqProto();
        if (buffer.length >= 8) {
            proto.catchTime = buffer.readUInt32BE(0);
            proto.expAmount = buffer.readUInt32BE(4);
        }
        return proto;
    }
}
exports.PetSetExpReqProto = PetSetExpReqProto;
//# sourceMappingURL=PetSetExpReqProto.js.map