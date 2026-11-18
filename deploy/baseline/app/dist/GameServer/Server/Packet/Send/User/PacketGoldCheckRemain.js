"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketGoldCheckRemain = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GoldCheckRemainRspProto_1 = require("../../../../../shared/proto/packets/rsp/user/GoldCheckRemainRspProto");
const GoldCurrency_1 = require("../../../../../shared/protocol/GoldCurrency");
/**
 * 查询金豆余额响应包（整金豆输入，百分单位输出）
 * CMD 1105
 */
class PacketGoldCheckRemain extends BaseProto_1.BaseProto {
    _data;
    constructor(gold) {
        super(CommandID_1.CommandID.GOLD_CHECK_REMAIN);
        const proto = new GoldCheckRemainRspProto_1.GoldCheckRemainRspProto();
        proto.setCoins((0, GoldCurrency_1.GoldToWire)(gold));
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketGoldCheckRemain = PacketGoldCheckRemain;
//# sourceMappingURL=PacketGoldCheckRemain.js.map