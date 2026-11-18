"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlackAddReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 添加黑名单请求
 * CMD 2154
 *
 * 请求格式: targetId(4)
 */
class BlackAddReqProto extends BaseProto_1.BaseProto {
    targetId = 0;
    constructor() {
        super(CommandID_1.CommandID.BLACK_ADD);
    }
    deserialize(buffer) {
        if (buffer.length >= 4) {
            this.targetId = buffer.readUInt32BE(0);
        }
    }
    serialize() {
        return Buffer.alloc(0);
    }
}
exports.BlackAddReqProto = BlackAddReqProto;
//# sourceMappingURL=BlackAddReqProto.js.map