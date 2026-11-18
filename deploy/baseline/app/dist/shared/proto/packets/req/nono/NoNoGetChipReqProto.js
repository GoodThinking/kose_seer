"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNoGetChipReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 9023 NONO_GET_CHIP] 获取NoNo芯片
 * 请求: chipType(4)
 */
class NoNoGetChipReqProto extends BaseProto_1.BaseProto {
    chipType = 0;
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new NoNoGetChipReqProto();
        if (buffer.length >= 4) {
            proto.chipType = buffer.readUInt32BE(0);
        }
        return proto;
    }
}
exports.NoNoGetChipReqProto = NoNoGetChipReqProto;
//# sourceMappingURL=NoNoGetChipReqProto.js.map