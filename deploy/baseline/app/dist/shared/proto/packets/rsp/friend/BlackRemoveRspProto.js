"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlackRemoveRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 移除黑名单响应
 * CMD 2155
 *
 * 响应格式: 空包
 */
class BlackRemoveRspProto extends BaseProto_1.BaseProto {
    constructor() {
        super(CommandID_1.CommandID.BLACK_REMOVE);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    deserialize(buffer) {
        // 空包，无需解析
    }
}
exports.BlackRemoveRspProto = BlackRemoveRspProto;
//# sourceMappingURL=BlackRemoveRspProto.js.map