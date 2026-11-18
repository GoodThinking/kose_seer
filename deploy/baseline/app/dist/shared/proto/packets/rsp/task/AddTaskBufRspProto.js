"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTaskBufRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 添加/更新任务缓存响应
 * CMD 2204: ADD_TASK_BUF
 *
 * 响应格式：空（成功时）
 */
class AddTaskBufRspProto extends BaseProto_1.BaseProto {
    constructor() {
        super(CommandID_1.CommandID.ADD_TASK_BUF);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    deserialize(buffer) {
        // 空响应
    }
}
exports.AddTaskBufRspProto = AddTaskBufRspProto;
//# sourceMappingURL=AddTaskBufRspProto.js.map