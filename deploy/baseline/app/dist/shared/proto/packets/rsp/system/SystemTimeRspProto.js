"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemTimeRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 1002 SYSTEM_TIME] 系统时间响应
 */
class SystemTimeRspProto extends BaseProto_1.BaseProto {
    timestamp = 0; // 时间戳
    num = 0; // 数量（固定为0）
    constructor() {
        super(CommandID_1.CommandID.SYSTEM_TIME);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(8);
        writer.WriteUInt32(this.timestamp);
        writer.WriteUInt32(this.num);
        return writer.ToBuffer();
    }
    setTimestamp(timestamp) {
        this.timestamp = timestamp;
        return this;
    }
}
exports.SystemTimeRspProto = SystemTimeRspProto;
//# sourceMappingURL=SystemTimeRspProto.js.map