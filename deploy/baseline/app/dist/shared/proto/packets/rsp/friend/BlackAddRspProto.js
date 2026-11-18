"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlackAddRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 添加黑名单响应
 * CMD 2154
 *
 * 响应格式: 空包
 */
class BlackAddRspProto extends BaseProto_1.BaseProto {
    constructor() {
        super(CommandID_1.CommandID.BLACK_ADD);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    deserialize(buffer) {
        // 空包，无需解析
    }
}
exports.BlackAddRspProto = BlackAddRspProto;
//# sourceMappingURL=BlackAddRspProto.js.map