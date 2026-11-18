"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlackRemoveReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 移除黑名单请求
 * CMD 2155
 *
 * 请求格式: targetId(4)
 */
class BlackRemoveReqProto extends BaseProto_1.BaseProto {
    targetId = 0;
    constructor() {
        super(CommandID_1.CommandID.BLACK_REMOVE);
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
exports.BlackRemoveReqProto = BlackRemoveReqProto;
//# sourceMappingURL=BlackRemoveReqProto.js.map