"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeColorReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 修改颜色请求
 * CMD: 2063 CHANGE_COLOR
 */
class ChangeColorReqProto extends BaseProto_1.BaseProto {
    newColor = 0;
    constructor() {
        super(CommandID_1.CommandID.CHANGE_COLOR);
    }
    deserialize(buffer) {
        if (buffer.length >= 4) {
            this.newColor = buffer.readUInt32BE(0);
        }
    }
    serialize() {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(this.newColor, 0);
        return buffer;
    }
}
exports.ChangeColorReqProto = ChangeColorReqProto;
//# sourceMappingURL=ChangeColorReqProto.js.map