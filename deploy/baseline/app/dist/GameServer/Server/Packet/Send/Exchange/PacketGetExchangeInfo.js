"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketGetExchangeInfo = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GetExchangeInfoRspProto_1 = require("../../../../../shared/proto/packets/rsp/exchange/GetExchangeInfoRspProto");
/**
 * 获取兑换信息响应包
 * CMD 70001: GET_EXCHANGE_INFO
 */
class PacketGetExchangeInfo extends BaseProto_1.BaseProto {
    _data;
    constructor(honorValue, result = 0) {
        super(CommandID_1.CommandID.GET_EXCHANGE_INFO);
        const proto = new GetExchangeInfoRspProto_1.GetExchangeInfoRspProto(honorValue);
        if (result !== 0) {
            proto.setResult(result);
        }
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketGetExchangeInfo = PacketGetExchangeInfo;
//# sourceMappingURL=PacketGetExchangeInfo.js.map