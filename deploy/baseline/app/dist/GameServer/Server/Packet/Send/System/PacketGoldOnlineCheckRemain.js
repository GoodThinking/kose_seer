"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketGoldOnlineCheckRemain = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GoldOnlineCheckRemainRspProto_1 = require("../../../../../shared/proto/packets/rsp/system/GoldOnlineCheckRemainRspProto");
const GoldCurrency_1 = require("../../../../../shared/protocol/GoldCurrency");
/**
 * [CMD: 1106 GOLD_ONLINE_CHECK_REMAIN] 金豆余额（整金豆输入，百分单位输出）
 */
class PacketGoldOnlineCheckRemain extends BaseProto_1.BaseProto {
    _proto;
    constructor(gold, coins) {
        super(CommandID_1.CommandID.GOLD_ONLINE_CHECK_REMAIN);
        const proto = new GoldOnlineCheckRemainRspProto_1.GoldOnlineCheckRemainRspProto();
        proto.setGold((0, GoldCurrency_1.GoldToWire)(gold));
        proto.setCoins(coins);
        this._proto = proto;
    }
    serialize(protocol = 'kose') {
        return this._proto.serialize(protocol);
    }
}
exports.PacketGoldOnlineCheckRemain = PacketGoldOnlineCheckRemain;
//# sourceMappingURL=PacketGoldOnlineCheckRemain.js.map