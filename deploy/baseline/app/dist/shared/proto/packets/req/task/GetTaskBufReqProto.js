"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTaskBufReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 获取任务缓存请求
 * CMD 2203: GET_TASK_BUF
 */
class GetTaskBufReqProto extends BaseProto_1.BaseProto {
    taskId = 0;
    constructor() {
        super(CommandID_1.CommandID.GET_TASK_BUF);
    }
    deserialize(buffer) {
        if (buffer.length >= 4) {
            this.taskId = buffer.readUInt32BE(0);
        }
    }
    serialize() {
        return Buffer.alloc(0);
    }
}
exports.GetTaskBufReqProto = GetTaskBufReqProto;
//# sourceMappingURL=GetTaskBufReqProto.js.map