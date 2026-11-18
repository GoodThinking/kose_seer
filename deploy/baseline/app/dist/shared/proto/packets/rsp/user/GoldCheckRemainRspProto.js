"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoldCheckRemainRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 查询赛尔豆余额响应
 * CMD: 1105
 */
class GoldCheckRemainRspProto extends BaseProto_1.BaseProto {
    coins = 0;
    constructor() {
        super(CommandID_1.CommandID.GOLD_CHECK_REMAIN);
    }
    serialize() {
        const buffer = Buffer.allocUnsafe(4);
        buffer.writeUInt32BE(this.coins, 0);
        return buffer;
    }
    // 链式调用方法
    setCoins(value) {
        this.coins = value;
        return this;
    }
}
exports.GoldCheckRemainRspProto = GoldCheckRemainRspProto;
//# sourceMappingURL=GoldCheckRemainRspProto.js.map