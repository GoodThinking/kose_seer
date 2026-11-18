"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcceptDailyTaskReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2231 ACCEPT_DAILY_TASK] 接受每日任务请求
 *
 * 请求包体：
 * - taskId (4) - 每日任务ID
 */
class AcceptDailyTaskReqProto extends BaseProto_1.BaseProto {
    taskId = 0;
    constructor() {
        super(CommandID_1.CommandID.ACCEPT_DAILY_TASK);
    }
    deserialize(buffer) {
        if (buffer.length >= 4) {
            this.taskId = buffer.readUInt32BE(0);
        }
    }
    serialize() {
        throw new Error('AcceptDailyTaskReqProto should not be serialized');
    }
}
exports.AcceptDailyTaskReqProto = AcceptDailyTaskReqProto;
//# sourceMappingURL=AcceptDailyTaskReqProto.js.map