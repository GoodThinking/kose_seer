"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTaskBufRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 获取任务缓存响应
 * CMD 2203: GET_TASK_BUF
 *
 * 响应格式：taskId(4) + flag(4) + buf[0..4] (5个4字节 = 20字节缓存)
 */
class GetTaskBufRspProto extends BaseProto_1.BaseProto {
    taskId = 0;
    flag = 1; // 1 表示有缓存数据
    buffers = [0, 0, 0, 0, 0]; // 5个缓存值
    /** XIN 客户端读取 taskId/flag 后将余下内容作为不透明 ByteArray。 */
    rawBuffer;
    constructor() {
        super(CommandID_1.CommandID.GET_TASK_BUF);
    }
    serialize(protocol = 'kose') {
        if (protocol === 'xin-20261013') {
            const rawBuffer = this.rawBuffer ?? Buffer.alloc(100);
            if (rawBuffer.length !== 100)
                throw new Error('XIN task buffer must contain 100 bytes');
            const buffer = Buffer.alloc(8 + rawBuffer.length);
            buffer.writeUInt32BE(this.taskId, 0);
            buffer.writeUInt32BE(this.flag, 4);
            rawBuffer.copy(buffer, 8);
            return buffer;
        }
        const buffer = Buffer.alloc(28); // taskId(4) + flag(4) + 5*4(20)
        let offset = 0;
        buffer.writeUInt32BE(this.taskId, offset);
        offset += 4;
        buffer.writeUInt32BE(this.flag, offset);
        offset += 4;
        if (this.buffers.length === 20) {
            this.buffers.forEach((value, index) => {
                if (!Number.isInteger(value) || value < 0 || value > 0xff) {
                    throw new Error('Invalid KOSE task progress byte');
                }
                buffer.writeUInt8(value, offset + index);
            });
            return buffer;
        }
        for (let i = 0; i < 5; i++) {
            buffer.writeUInt32BE(this.buffers[i] || 0, offset);
            offset += 4;
        }
        return buffer;
    }
    deserialize(buffer) {
        let offset = 0;
        if (buffer.length >= 4) {
            this.taskId = buffer.readUInt32BE(offset);
            offset += 4;
        }
        if (buffer.length >= 8) {
            this.flag = buffer.readUInt32BE(offset);
            offset += 4;
        }
        if (buffer.length >= 28) {
            this.buffers = [];
            for (let i = 0; i < 5; i++) {
                this.buffers.push(buffer.readUInt32BE(offset));
                offset += 4;
            }
        }
    }
    setTaskId(taskId) {
        this.taskId = taskId;
        return this;
    }
    setBuffers(buffers) {
        this.buffers = buffers.slice(0, 5);
        while (this.buffers.length < 5) {
            this.buffers.push(0);
        }
        return this;
    }
}
exports.GetTaskBufRspProto = GetTaskBufRspProto;
//# sourceMappingURL=GetTaskBufRspProto.js.map