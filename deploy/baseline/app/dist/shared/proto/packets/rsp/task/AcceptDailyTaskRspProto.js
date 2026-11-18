"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcceptDailyTaskRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2231 ACCEPT_DAILY_TASK] 接受每日任务响应
 *
 * 响应包体（Lua端实现：emptyResponse(2231, 4)）：
 * - 4字节的0（占位）
 *
 * 注意：Lua端使用通用空响应，返回4字节的0
 */
class AcceptDailyTaskRspProto extends BaseProto_1.BaseProto {
    constructor() {
        super(CommandID_1.CommandID.ACCEPT_DAILY_TASK);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(4);
        writer.WriteUInt32(0); // 4字节占位
        return writer.ToBuffer();
    }
    deserialize(_buffer) {
        throw new Error('AcceptDailyTaskRspProto should not be deserialized');
    }
}
exports.AcceptDailyTaskRspProto = AcceptDailyTaskRspProto;
//# sourceMappingURL=AcceptDailyTaskRspProto.js.map