"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketLeaveMap = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const LeaveMapRspProto_1 = require("../../../../../shared/proto/packets/rsp/map/LeaveMapRspProto");
/**
 * 离开地图响应包
 * CMD 1002
 */
class PacketLeaveMap extends BaseProto_1.BaseProto {
    _data;
    constructor(userId) {
        super(CommandID_1.CommandID.LEAVE_MAP);
        const proto = new LeaveMapRspProto_1.LeaveMapRspProto();
        proto.userId = userId;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketLeaveMap = PacketLeaveMap;
//# sourceMappingURL=PacketLeaveMap.js.map