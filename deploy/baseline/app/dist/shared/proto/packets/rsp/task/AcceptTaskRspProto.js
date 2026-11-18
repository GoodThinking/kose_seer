"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcceptTaskRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 接受任务响应
 * CMD 2201: ACCEPT_TASK
 */
class AcceptTaskRspProto extends BaseProto_1.BaseProto {
    taskId = 0;
    constructor() {
        super(CommandID_1.CommandID.ACCEPT_TASK);
    }
    serialize() {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(this.taskId, 0);
        return buffer;
    }
    deserialize(buffer) {
        if (buffer.length >= 4) {
            this.taskId = buffer.readUInt32BE(0);
        }
    }
    setTaskId(taskId) {
        this.taskId = taskId;
        return this;
    }
}
exports.AcceptTaskRspProto = AcceptTaskRspProto;
//# sourceMappingURL=AcceptTaskRspProto.js.map