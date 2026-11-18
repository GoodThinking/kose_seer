"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNoOpenReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 9001 NONO_OPEN] 开启NoNo
 * 请求: 无参数
 */
class NoNoOpenReqProto extends BaseProto_1.BaseProto {
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        return new NoNoOpenReqProto();
    }
}
exports.NoNoOpenReqProto = NoNoOpenReqProto;
//# sourceMappingURL=NoNoOpenReqProto.js.map