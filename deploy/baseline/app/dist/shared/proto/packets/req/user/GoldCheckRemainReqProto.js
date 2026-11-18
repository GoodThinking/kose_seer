"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoldCheckRemainReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * 查询赛尔豆余额请求
 * CMD: 1105
 */
class GoldCheckRemainReqProto extends BaseProto_1.BaseProto {
    constructor(cmdId) {
        super(cmdId);
    }
    deserialize(buffer) {
        // 无请求参数
    }
    serialize() {
        return Buffer.alloc(0);
    }
}
exports.GoldCheckRemainReqProto = GoldCheckRemainReqProto;
//# sourceMappingURL=GoldCheckRemainReqProto.js.map