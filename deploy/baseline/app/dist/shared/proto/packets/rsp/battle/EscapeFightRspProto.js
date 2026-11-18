"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscapeFightRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
const utils_1 = require("../../../../utils");
/**
 * [CMD: 2410 ESCAPE_FIGHT] 逃跑响应
 */
class EscapeFightRspProto extends BaseProto_1.BaseProto {
    success = 1; // 是否成功 (0=失败, 1=成功)
    constructor() {
        super(CommandID_1.CommandID.ESCAPE_FIGHT);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(8);
        writer.WriteUInt32(this.success);
        return writer.ToBuffer();
    }
    // 链式调用
    setSuccess(value) {
        this.success = value;
        return this;
    }
}
exports.EscapeFightRspProto = EscapeFightRspProto;
//# sourceMappingURL=EscapeFightRspProto.js.map