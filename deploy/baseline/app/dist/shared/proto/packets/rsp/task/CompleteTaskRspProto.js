"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteTaskRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 完成任务响应
 * CMD 2202: COMPLETE_TASK
 *
 * 响应格式：taskId(4) + petId(4) + captureTm(4) + itemCount(4) + [itemId(4) + itemCount(4)]...
 */
class CompleteTaskRspProto extends BaseProto_1.BaseProto {
    taskId = 0;
    petId = 0;
    captureTm = 0;
    items = [];
    constructor() {
        super(CommandID_1.CommandID.COMPLETE_TASK);
    }
    serialize() {
        const itemCount = this.items.length;
        const bufferSize = 16 + itemCount * 8; // taskId(4) + petId(4) + captureTm(4) + itemCount(4) + items
        const buffer = Buffer.alloc(bufferSize);
        let offset = 0;
        buffer.writeUInt32BE(this.taskId, offset);
        offset += 4;
        buffer.writeUInt32BE(this.petId, offset);
        offset += 4;
        buffer.writeUInt32BE(this.captureTm, offset);
        offset += 4;
        buffer.writeUInt32BE(itemCount, offset);
        offset += 4;
        for (const item of this.items) {
            buffer.writeUInt32BE(item.id, offset);
            offset += 4;
            buffer.writeUInt32BE(item.count, offset);
            offset += 4;
        }
        // Log serialized data for debugging
        console.log(`[CompleteTaskRspProto] Serialized: taskId=${this.taskId}, petId=${this.petId}, captureTm=0x${this.captureTm.toString(16)}, itemCount=${itemCount}`);
        console.log(`[CompleteTaskRspProto] Buffer hex: ${buffer.toString('hex')}`);
        return buffer;
    }
    deserialize(buffer) {
        let offset = 0;
        if (buffer.length >= 4) {
            this.taskId = buffer.readUInt32BE(offset);
            offset += 4;
        }
        if (buffer.length >= 8) {
            this.petId = buffer.readUInt32BE(offset);
            offset += 4;
        }
        if (buffer.length >= 12) {
            this.captureTm = buffer.readUInt32BE(offset);
            offset += 4;
        }
        if (buffer.length >= 16) {
            const itemCount = buffer.readUInt32BE(offset);
            offset += 4;
            this.items = [];
            for (let i = 0; i < itemCount && offset + 8 <= buffer.length; i++) {
                const id = buffer.readUInt32BE(offset);
                offset += 4;
                const count = buffer.readUInt32BE(offset);
                offset += 4;
                this.items.push({ id, count });
            }
        }
    }
    setTaskId(taskId) {
        this.taskId = taskId;
        return this;
    }
    setPetId(petId) {
        this.petId = petId;
        return this;
    }
    setCaptureTm(captureTm) {
        this.captureTm = captureTm;
        return this;
    }
    setItems(items) {
        this.items = items;
        return this;
    }
}
exports.CompleteTaskRspProto = CompleteTaskRspProto;
//# sourceMappingURL=CompleteTaskRspProto.js.map