"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketAcceptTask = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const AcceptTaskRspProto_1 = require("../../../../../shared/proto/packets/rsp/task/AcceptTaskRspProto");
/**
 * 接受任务响应包
 * CMD 2201: ACCEPT_TASK
 */
class PacketAcceptTask extends BaseProto_1.BaseProto {
    _data;
    constructor(taskId, result = 0) {
        super(CommandID_1.CommandID.ACCEPT_TASK);
        const proto = new AcceptTaskRspProto_1.AcceptTaskRspProto();
        proto.taskId = taskId;
        if (result !== 0) {
            this.setResult(result);
        }
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketAcceptTask = PacketAcceptTask;
//# sourceMappingURL=PacketAcceptTask.js.map