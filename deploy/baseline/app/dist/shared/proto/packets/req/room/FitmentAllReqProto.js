"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FitmentAllReqProto = void 0;
const protocol_1 = require("../../../../protocol");
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 10007 FITMENT_ALL] 获取所有家具请求
 *
 * 请求格式:
 * - 空请求
 */
class FitmentAllReqProto extends BaseProto_1.BaseProto {
    constructor() {
        super(protocol_1.CommandID.FITMENT_ALL);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        return new FitmentAllReqProto();
    }
}
exports.FitmentAllReqProto = FitmentAllReqProto;
//# sourceMappingURL=FitmentAllReqProto.js.map