"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiItemBuyHandler = void 0;
const DatabaseManager_1 = require("../../../../../DataBase/DatabaseManager");
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const Opcode_1 = require("../../../../../shared/decorators/Opcode");
const utils_1 = require("../../../../../shared/utils");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
// Fixed Nieo WaterGunGame and BatteryTestTask request these free, unique sets.
const trainingSuits = [[100052, 100053, 100054], [100024, 100025, 100026]];
class PacketTrainingSuit extends BaseProto_1.BaseProto {
    coins;
    constructor(coins) {
        super(CommandID_1.CommandID.MULTI_ITEM_BUY);
        this.coins = coins;
    }
    serialize() {
        const body = Buffer.alloc(4);
        body.writeUInt32BE(this.coins);
        return body;
    }
}
let MultiItemBuyHandler = class MultiItemBuyHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const suit = body.length === 16 && body.readUInt32BE(0) === 3
            ? trainingSuits.find(ids => ids.every((id, index) => body.readUInt32BE(4 + index * 4) === id))
            : undefined;
        if (!suit) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.MULTI_ITEM_BUY).setResult(5001));
            return;
        }
        const inventory = player.ItemManager.ItemData;
        const release = await inventory.AcquireReward();
        let committed = false;
        try {
            await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
                const items = inventory.ItemList.map(item => ({ ...item }));
                for (const itemId of suit) {
                    const existing = items.find(item => item.itemId === itemId);
                    if (existing) {
                        if (existing.count === 0)
                            existing.count = 1;
                    }
                    else
                        items.push({ itemId, count: 1, expireTime: 0x057E40 });
                }
                // One statement saves the complete set. Publish memory only after the durable write.
                const result = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [JSON.stringify(items), player.Uid]);
                if (result.affectedRows !== 1)
                    throw new Error('Training suit inventory missing');
                committed = true;
                inventory.ItemList = items;
            });
            await player.SendPacket(new PacketTrainingSuit(player.Data.coins));
        }
        catch (error) {
            utils_1.Logger.Error(committed ? '[TrainingSuit] Saved; response failed' : '[TrainingSuit] Save failed', error instanceof Error ? error : new Error(String(error)));
            if (!committed)
                await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.MULTI_ITEM_BUY).setResult(5000));
        }
        finally {
            release();
        }
    }
};
exports.MultiItemBuyHandler = MultiItemBuyHandler;
exports.MultiItemBuyHandler = MultiItemBuyHandler = __decorate([
    (0, Opcode_1.Opcode)(CommandID_1.CommandID.MULTI_ITEM_BUY, Opcode_1.InjectType.NONE)
], MultiItemBuyHandler);
//# sourceMappingURL=MultiItemBuyHandler.js.map