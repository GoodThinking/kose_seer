"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GachaRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 扭蛋机响应
 * CMD 3201
 *
 * 响应格式：
 * - coins(4): 赛尔豆余额
 * - petID(4): 精灵ID（扭蛋机只发道具，置0）
 * - catchTime(4): 捕获时间（保留字段，置0）
 * - itemCount(4): 物品数量
 * - items: [itemID(4) + itemNum(4)] * itemCount
 */
class GachaRspProto extends BaseProto_1.BaseProto {
    coins = 0;
    petId = 0;
    catchTime = 0;
    itemCount = 0;
    items = [];
    constructor() {
        super(CommandID_1.CommandID.EGG_GAME_PLAY);
    }
    serialize() {
        const buffer = Buffer.alloc(16 + this.items.length * 8);
        let offset = 0;
        buffer.writeUInt32BE(this.coins, offset);
        offset += 4;
        buffer.writeUInt32BE(this.petId, offset);
        offset += 4;
        buffer.writeUInt32BE(this.catchTime, offset);
        offset += 4;
        buffer.writeUInt32BE(this.itemCount, offset);
        offset += 4;
        for (const item of this.items) {
            buffer.writeUInt32BE(item.itemId, offset);
            offset += 4;
            buffer.writeUInt32BE(item.count, offset);
            offset += 4;
        }
        return buffer;
    }
}
exports.GachaRspProto = GachaRspProto;
//# sourceMappingURL=GachaRspProto.js.map