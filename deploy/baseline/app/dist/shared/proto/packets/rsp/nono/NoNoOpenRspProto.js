"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNoOpenRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 9001 NONO_OPEN] 开启NoNo响应
 *
 * 响应包体：
 * - status (4) - 状态码
 *   - 0: 已经有NoNo
 *   - 非0: 成功获得NoNo
 *
 * 客户端逻辑（GetNoNo.as）：
 * - status == 0: 显示"已经有NoNo"
 * - status != 0: 设置 MainManager.actorInfo.hasNono = true，显示成功消息
 */
class NoNoOpenRspProto extends BaseProto_1.BaseProto {
    status = 1; // 默认为1（成功）
    constructor() {
        super(CommandID_1.CommandID.NONO_OPEN);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(4);
        writer.WriteUInt32(this.status);
        return writer.ToBuffer();
    }
    deserialize(_buffer) {
        throw new Error('NoNoOpenRspProto should not be deserialized');
    }
}
exports.NoNoOpenRspProto = NoNoOpenRspProto;
//# sourceMappingURL=NoNoOpenRspProto.js.map