"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketGetDailyTaskBuf = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GetDailyTaskBufRspProto_1 = require("../../../../../shared/proto/packets/rsp/task/GetDailyTaskBufRspProto");
class PacketGetDailyTaskBuf extends BaseProto_1.BaseProto {
    _data;
    constructor(taskId, buffers, result = 0) {
        super(CommandID_1.CommandID.GET_DAILY_TASK_BUF);
        this.setResult(result);
        const proto = new GetDailyTaskBufRspProto_1.GetDailyTaskBufRspProto();
        proto.taskId = taskId;
        proto.buffers = buffers.slice();
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketGetDailyTaskBuf = PacketGetDailyTaskBuf;
//# sourceMappingURL=PacketGetDailyTaskBuf.js.map