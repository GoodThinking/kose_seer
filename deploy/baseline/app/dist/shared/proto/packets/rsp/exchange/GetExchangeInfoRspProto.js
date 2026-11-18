"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeInfoRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 获取兑换信息响应
 * CMD 70001: GET_EXCHANGE_INFO
 *
 * 响应格式：
 * - honorValue (4 bytes): 荣誉值
 */
class GetExchangeInfoRspProto extends BaseProto_1.BaseProto {
    honorValue;
    constructor(honorValue = 0) {
        super(CommandID_1.CommandID.GET_EXCHANGE_INFO);
        this.honorValue = honorValue;
    }
    serialize() {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(this.honorValue, 0);
        return buffer;
    }
    deserialize(buffer) {
        if (buffer.length >= 4) {
            this.honorValue = buffer.readUInt32BE(0);
        }
    }
}
exports.GetExchangeInfoRspProto = GetExchangeInfoRspProto;
//# sourceMappingURL=GetExchangeInfoRspProto.js.map