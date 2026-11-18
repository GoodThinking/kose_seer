"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNoCureRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 9007 NONO_CURE] NoNo 治疗响应
 *
 * 空响应包，只返回 result
 */
class NoNoCureRspProto extends BaseProto_1.BaseProto {
    constructor() {
        super(CommandID_1.CommandID.NONO_CURE);
    }
    serialize() {
        // 空响应，只有 result 字段（在 PacketBuilder 中自动添加）
        return Buffer.alloc(0);
    }
}
exports.NoNoCureRspProto = NoNoCureRspProto;
//# sourceMappingURL=NoNoCureRspProto.js.map