"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteTaskReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 完成任务请求
 * CMD 2202: COMPLETE_TASK
 */
class CompleteTaskReqProto extends BaseProto_1.BaseProto {
    taskId = 0;
    param = 0;
    constructor() {
        super(CommandID_1.CommandID.COMPLETE_TASK);
    }
    deserialize(buffer) {
        let offset = 0;
        if (buffer.length >= 4) {
            this.taskId = buffer.readUInt32BE(offset);
            offset += 4;
        }
        if (buffer.length >= 8) {
            this.param = buffer.readUInt32BE(offset);
        }
    }
    serialize() {
        return Buffer.alloc(0);
    }
}
exports.CompleteTaskReqProto = CompleteTaskReqProto;
//# sourceMappingURL=CompleteTaskReqProto.js.map