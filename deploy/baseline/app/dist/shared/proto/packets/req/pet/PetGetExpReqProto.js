"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetGetExpReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2319 PET_GET_EXP] 获取精灵经验分配信息请求
 * 精灵分配仪功能 - 查询可分配的经验值
 */
class PetGetExpReqProto extends BaseProto_1.BaseProto {
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        return new PetGetExpReqProto();
    }
}
exports.PetGetExpReqProto = PetGetExpReqProto;
//# sourceMappingURL=PetGetExpReqProto.js.map