"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnOrOffFlyingReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 开关飞行模式请求
 * CMD: 2112 ON_OR_OFF_FLYING
 */
class OnOrOffFlyingReqProto extends BaseProto_1.BaseProto {
    flyMode = 0;
    constructor() {
        super(CommandID_1.CommandID.ON_OR_OFF_FLYING);
    }
    deserialize(buffer) {
        if (buffer.length >= 4) {
            this.flyMode = buffer.readUInt32BE(0);
        }
    }
    serialize() {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(this.flyMode, 0);
        return buffer;
    }
}
exports.OnOrOffFlyingReqProto = OnOrOffFlyingReqProto;
//# sourceMappingURL=OnOrOffFlyingReqProto.js.map