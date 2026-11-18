"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketSystemTime = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const SystemTimeRspProto_1 = require("../../../../../shared/proto/packets/rsp/system/SystemTimeRspProto");
/**
 * 系统时间响应包
 * CMD 1002
 */
class PacketSystemTime extends BaseProto_1.BaseProto {
    _data;
    constructor(timestamp, num = 0) {
        super(CommandID_1.CommandID.SYSTEM_TIME);
        const proto = new SystemTimeRspProto_1.SystemTimeRspProto();
        proto.timestamp = timestamp;
        proto.num = num;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketSystemTime = PacketSystemTime;
//# sourceMappingURL=PacketSystemTime.js.map