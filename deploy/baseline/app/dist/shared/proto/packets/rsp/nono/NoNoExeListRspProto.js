"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNoExeListRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 9015 NONO_EXE_LIST] NoNo 执行列表响应
 *
 * 返回空列表
 */
class NoNoExeListRspProto extends BaseProto_1.BaseProto {
    count = 0; // 列表数量
    constructor() {
        super(CommandID_1.CommandID.NONO_EXE_LIST);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(8);
        writer.WriteUInt32(this.result);
        writer.WriteUInt32(this.count);
        return writer.ToBuffer();
    }
}
exports.NoNoExeListRspProto = NoNoExeListRspProto;
//# sourceMappingURL=NoNoExeListRspProto.js.map