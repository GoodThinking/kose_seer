"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDiamondRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 9025 GET_DIAMOND] 获取钻石数量响应
 * 响应: diamondCount(4)
 */
class GetDiamondRspProto extends BaseProto_1.BaseProto {
    diamondCount = 0; // 钻石数量
    constructor() {
        super(CommandID_1.CommandID.GET_DIAMOND);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(4);
        writer.WriteUInt32(this.diamondCount);
        return writer.ToBuffer();
    }
    setDiamondCount(count) {
        this.diamondCount = count;
        return this;
    }
}
exports.GetDiamondRspProto = GetDiamondRspProto;
//# sourceMappingURL=GetDiamondRspProto.js.map