"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyRspProto = void 0;
const BaseProto_1 = require("../../base/BaseProto");
/**
 * 通用空响应 Proto
 * 用于只返回 result 的简单命令
 */
class EmptyRspProto extends BaseProto_1.BaseProto {
    constructor(cmdId) {
        super(cmdId);
    }
    serialize() {
        // 空响应，只有 result 字段（在 PacketBuilder 中自动添加）
        return Buffer.alloc(0);
    }
}
exports.EmptyRspProto = EmptyRspProto;
//# sourceMappingURL=EmptyRspProto.js.map