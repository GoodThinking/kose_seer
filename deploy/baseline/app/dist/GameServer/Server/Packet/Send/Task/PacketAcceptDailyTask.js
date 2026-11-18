"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketAcceptDailyTask = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const AcceptDailyTaskRspProto_1 = require("../../../../../shared/proto/packets/rsp/task/AcceptDailyTaskRspProto");
/**
 * 接受每日任务响应包
 * CMD 2231
 *
 * 基于Lua端实现：emptyResponse(2231, 4)
 * 返回4字节的0
 */
class PacketAcceptDailyTask extends BaseProto_1.BaseProto {
    _data;
    constructor(result = 0) {
        super(CommandID_1.CommandID.ACCEPT_DAILY_TASK);
        this.setResult(result);
        const proto = new AcceptDailyTaskRspProto_1.AcceptDailyTaskRspProto();
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketAcceptDailyTask = PacketAcceptDailyTask;
//# sourceMappingURL=PacketAcceptDailyTask.js.map