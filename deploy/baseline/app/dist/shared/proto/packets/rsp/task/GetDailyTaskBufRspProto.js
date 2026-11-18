"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDailyTaskBufRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 获取每日任务缓存响应
 * CMD 2234: GET_DAILY_TASK_BUF
 * 响应格式：taskId(4) + flag(4) + 20字节任务进度
 */
class GetDailyTaskBufRspProto extends BaseProto_1.BaseProto {
    taskId = 0;
    flag = 1;
    buffers = new Array(20).fill(0);
    constructor() {
        super(CommandID_1.CommandID.GET_DAILY_TASK_BUF);
    }
    serialize() {
        if (this.buffers.length !== 20 || this.buffers.some(value => !Number.isInteger(value) || value < 0 || value > 0xff)) {
            throw new Error('Daily task buffer must contain 20 bytes');
        }
        const buffer = Buffer.alloc(28);
        buffer.writeUInt32BE(this.taskId, 0);
        buffer.writeUInt32BE(this.flag, 4);
        Buffer.from(this.buffers).copy(buffer, 8);
        return buffer;
    }
    deserialize(buffer) {
        if (buffer.length !== 28)
            throw new Error('Invalid daily task buffer response');
        this.taskId = buffer.readUInt32BE(0);
        this.flag = buffer.readUInt32BE(4);
        this.buffers = Array.from(buffer.subarray(8));
    }
}
exports.GetDailyTaskBufRspProto = GetDailyTaskBufRspProto;
//# sourceMappingURL=GetDailyTaskBufRspProto.js.map