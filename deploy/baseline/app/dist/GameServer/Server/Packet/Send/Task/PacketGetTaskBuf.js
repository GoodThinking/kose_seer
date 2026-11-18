"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketGetTaskBuf = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GetTaskBufRspProto_1 = require("../../../../../shared/proto/packets/rsp/task/GetTaskBufRspProto");
class PacketGetTaskBuf extends BaseProto_1.BaseProto {
    _proto;
    constructor(taskId, buffers, rawBuffer, result = 0) {
        super(CommandID_1.CommandID.GET_TASK_BUF);
        this.setResult(result);
        this._proto = new GetTaskBufRspProto_1.GetTaskBufRspProto();
        this._proto.taskId = taskId;
        this._proto.buffers = buffers.slice();
        this._proto.rawBuffer = rawBuffer && Buffer.from(rawBuffer);
    }
    serialize(protocol = 'kose') {
        return this._proto.serialize(protocol);
    }
}
exports.PacketGetTaskBuf = PacketGetTaskBuf;
//# sourceMappingURL=PacketGetTaskBuf.js.map