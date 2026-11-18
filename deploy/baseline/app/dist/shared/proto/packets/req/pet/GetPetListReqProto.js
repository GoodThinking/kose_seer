"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPetListReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2303 GET_PET_LIST] 获取精灵列表请求
 */
class GetPetListReqProto extends BaseProto_1.BaseProto {
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        return new GetPetListReqProto();
    }
}
exports.GetPetListReqProto = GetPetListReqProto;
//# sourceMappingURL=GetPetListReqProto.js.map