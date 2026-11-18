"use strict";
const { Opcode, InjectType } = require("../../../../../shared/decorators/Opcode");
const { DatabaseManager } = require("../../../../../DataBase/DatabaseManager");
const { ItemSystem } = require("../../../../Game/Item/ItemSystem");
const { PacketEmpty } = require("../../Send/PacketEmpty");
const { Logger } = require("../../../../../shared/utils/Logger");

// ExchangeOreModel_xmlClass in the native Core defines the eligible collection items.
// Prices are the same item catalog SellPrice used by the original exchange panel.
const eligible = new Set([
    400001, 400002, 400003, 400004, 400005, 400006, 400007, 400008, 400009,
    400010, 400011, 400012, 400014, 400015, 400016, 400017, 400018, 400019,
    400020, 400021, 400022, 400023, 400024, 400025, 400026, 400027, 400028,
    400029, 400030, 400031, 400032, 400033, 400034, 400035, 400036, 400053
]);
const busy = new WeakSet();
const COMMAND = 2602;

async function sellOre(player, itemId, count) {
    const price = ItemSystem.GetItem(itemId)?.SellPrice;
    if (!eligible.has(itemId) || !Number.isSafeInteger(price) || price <= 0 ||
        !Number.isInteger(count) || count < 1 || count > 0xffffffff ||
        !Number.isSafeInteger(price * count) || price * count > 0x7fffffff) {
        throw new Error("Invalid ore sale");
    }
    const inventory = player.ItemManager.ItemData;
    const release = await inventory.AcquireReward();
    let gate;
    try {
        await player.Data.WaitForExpAllocation();
        await player.Data.WaitForCurrencyOperations();
        if (player.Session.Socket.destroyed || player.Session.Player !== player || player.Data.mapID !== 6) {
            throw new Error("Ore exchange unavailable");
        }
        gate = player.Data.BeginBalanceReward();
        const staged = inventory.ItemList.map(item => ({ ...item }));
        const index = staged.findIndex(item => item.itemId === itemId);
        if (index < 0 || !Number.isSafeInteger(staged[index].count) || staged[index].count < count) {
            throw new Error("Insufficient ore");
        }
        staged[index].count -= count;
        if (!staged[index].count) staged.splice(index, 1);
        return await DatabaseManager.Instance.WithConnection(async driver => {
            await driver.beginTransaction();
            let committed = false;
            try {
                const [row] = await driver.query("SELECT coins, gold, allocatable_exp FROM players WHERE user_id = ?", [player.Uid]);
                if (!row) throw new Error("Ore seller missing");
                const dirty = player.Data.GetDirtyFields();
                const keys = ["coins", "gold", "allocatableExp"];
                const stored = [row.coins, row.gold, row.allocatable_exp];
                const balances = keys.map((key, i) => {
                    const cached = player.Data[key];
                    if (!dirty.includes(key) && cached !== stored[i]) throw new Error("Ore seller wallet cache stale");
                    const value = dirty.includes(key) ? cached : stored[i];
                    if (!Number.isSafeInteger(value) || value < 0 || value > 0x7fffffff) throw new Error("Invalid wallet");
                    return value;
                });
                balances[0] += price * count;
                if (balances[0] > 0x7fffffff) throw new Error("Coin balance full");
                const items = await driver.execute("UPDATE player_items SET item_list = ? WHERE owner_id = ?", [JSON.stringify(staged), player.Uid]);
                const money = await driver.execute("UPDATE players SET coins = ?, gold = ?, allocatable_exp = ? WHERE user_id = ?", [...balances, player.Uid]);
                if (items.affectedRows !== 1 || money.affectedRows !== 1) throw new Error("Ore sale was not persisted");
                await driver.commit();
                committed = true;
                gate.publish(...balances);
                inventory.ItemList = staged;
            } catch (error) {
                if (!committed) await driver.rollback();
                throw error;
            }
        });
    } finally {
        gate?.release();
        release();
    }
}

class OreSaleHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player) return;
        if (body.length !== 8 || busy.has(player)) {
            await player.SendPacket(new PacketEmpty(COMMAND).setResult(5001));
            return;
        }
        busy.add(player);
        try {
            await sellOre(player, body.readUInt32BE(0), body.readUInt32BE(4));
            await player.SendPacket(new PacketEmpty(COMMAND));
        } catch (error) {
            Logger.Error("[OreSale] Sale failed", error instanceof Error ? error : new Error(String(error)));
            await player.SendPacket(new PacketEmpty(COMMAND).setResult(5001));
        } finally {
            busy.delete(player);
        }
    }
}
Opcode(COMMAND, InjectType.NONE)(OreSaleHandler);
module.exports = { OreSaleHandler };
