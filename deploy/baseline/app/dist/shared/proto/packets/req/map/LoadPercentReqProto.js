"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadPercentReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2441 LOAD_PERCENT] 加载进度请求
 */
class LoadPercentReqProto extends BaseProto_1.BaseProto {
    percent = 0; // 客户端当前加载进度（0-100）
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new LoadPercentReqProto();
        if (buffer.length >= 4) {
            proto.percent = buffer.readUInt32BE(0);
        }
        return proto;
    }
}
exports.LoadPercentReqProto = LoadPercentReqProto;
//# sourceMappingURL=LoadPercentReqProto.js.map