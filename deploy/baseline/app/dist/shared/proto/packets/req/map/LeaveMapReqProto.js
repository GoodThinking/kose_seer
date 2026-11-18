"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveMapReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 离开地图请求
 * CMD: 2002 LEAVE_MAP
 */
class LeaveMapReqProto extends BaseProto_1.BaseProto {
    mapId = 0;
    mapType = 0;
    constructor() {
        super(CommandID_1.CommandID.LEAVE_MAP);
    }
    deserialize(buffer) {
        let offset = 0;
        if (buffer.length >= 8) {
            this.mapId = buffer.readUInt32BE(offset);
            offset += 4;
            this.mapType = buffer.readUInt32BE(offset);
        }
    }
    serialize() {
        const buffer = Buffer.alloc(8);
        buffer.writeUInt32BE(this.mapId, 0);
        buffer.writeUInt32BE(this.mapType, 4);
        return buffer;
    }
}
exports.LeaveMapReqProto = LeaveMapReqProto;
//# sourceMappingURL=LeaveMapReqProto.js.map