"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketCompleteTask = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const CompleteTaskRspProto_1 = require("../../../../../shared/proto/packets/rsp/task/CompleteTaskRspProto");
class PacketCompleteTask extends BaseProto_1.BaseProto {
    _data;
    constructor(taskId, petId, captureTm, items, result = 0, commandId = CommandID_1.CommandID.COMPLETE_TASK) {
        super(commandId);
        const proto = new CompleteTaskRspProto_1.CompleteTaskRspProto();
        proto.taskId = taskId;
        proto.petId = petId;
        proto.captureTm = captureTm;
        proto.items = items.map(item => ({ id: item.itemId, count: item.count }));
        if (result !== 0) {
            this.setResult(result);
        }
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketCompleteTask = PacketCompleteTask;
//# sourceMappingURL=PacketCompleteTask.js.map