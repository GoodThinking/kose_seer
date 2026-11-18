"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcceptTaskReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 接受任务请求
 * CMD 2201: ACCEPT_TASK
 */
class AcceptTaskReqProto extends BaseProto_1.BaseProto {
    taskId = 0;
    constructor() {
        super(CommandID_1.CommandID.ACCEPT_TASK);
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
exports.AcceptTaskReqProto = AcceptTaskReqProto;
//# sourceMappingURL=AcceptTaskReqProto.js.map