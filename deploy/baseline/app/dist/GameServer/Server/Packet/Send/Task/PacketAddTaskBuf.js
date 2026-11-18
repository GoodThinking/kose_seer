"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketAddTaskBuf = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const AddTaskBufRspProto_1 = require("../../../../../shared/proto/packets/rsp/task/AddTaskBufRspProto");
class PacketAddTaskBuf extends BaseProto_1.BaseProto {
    _data;
    constructor(result = 0) {
        super(CommandID_1.CommandID.ADD_TASK_BUF);
        const proto = new AddTaskBufRspProto_1.AddTaskBufRspProto();
        if (result !== 0) {
            this.setResult(result);
        }
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketAddTaskBuf = PacketAddTaskBuf;
//# sourceMappingURL=PacketAddTaskBuf.js.map