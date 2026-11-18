"use strict";
const { Opcode, InjectType } = require("../../../../../shared/decorators/Opcode");
const { ConfigLoader } = require("../../../../../shared/config/ConfigLoader");
const { DatabaseManager } = require("../../../../../DataBase/DatabaseManager");
const { PacketEmpty } = require("../../Send/PacketEmpty");
const { Logger } = require("../../../../../shared/utils/Logger");

const COMMAND = 2901;
const busy = new WeakSet();

async function exchange(player, session, id) {
    const recipe = ConfigLoader.Instance.LoadJson("data/json/material-sources.json")?.clothExchanges?.[String(id)];
    if (!recipe || !recipe.input || !Array.isArray(recipe.outputs) || !recipe.outputs.length) throw new Error("Unknown clothing exchange");
    const valid = value => Number.isSafeInteger(value) && value > 0 && value <= 0xffffffff;
    if (!valid(recipe.input.itemId) || !valid(recipe.input.count) || recipe.outputs.some(item =>
        !valid(item.itemId) || !valid(item.count) || !valid(item.max) || item.count > item.max)) {
        throw new Error("Invalid clothing exchange configuration");
    }
    const ids = recipe.outputs.map(item => item.itemId);
    if (new Set(ids).size !== ids.length || ids.includes(recipe.input.itemId)) throw new Error("Duplicate clothing exchange item");
    const inventory = player.ItemManager.ItemData;
    const release = await inventory.AcquireReward();
    try {
        if (session.Player !== player || player.Session !== session || session.Socket.destroyed || player.Data.mapID !== 6) {
            throw new Error("Clothing exchange unavailable");
        }
        const staged = inventory.ItemList.map(item => ({ ...item }));
        const inputIndex = staged.findIndex(item => item.itemId === recipe.input.itemId);
        if (inputIndex < 0 || !Number.isSafeInteger(staged[inputIndex].count) || staged[inputIndex].count < recipe.input.count) {
            throw new Error("Insufficient exchange material");
        }
        for (const output of recipe.outputs) {
            const item = staged.find(entry => entry.itemId === output.itemId);
            const count = item?.count ?? 0;
            if (!Number.isSafeInteger(count) || count < 0 || count + output.count > output.max) {
                throw new Error("Exchange output is full");
            }
        }
        staged[inputIndex].count -= recipe.input.count;
        if (!staged[inputIndex].count) staged.splice(inputIndex, 1);
        for (const output of recipe.outputs) {
            const item = staged.find(entry => entry.itemId === output.itemId);
            if (item) item.count += output.count;
            else staged.push({ itemId: output.itemId, count: output.count, expireTime: 0x057E40 });
        }
        await DatabaseManager.Instance.WithConnection(async driver => {
            if (session.Player !== player || player.Session !== session || session.Socket.destroyed || player.Data.mapID !== 6) {
                throw new Error("Clothing exchange unavailable");
            }
            await driver.beginTransaction();
            let committed = false;
            try {
                const result = await driver.execute("UPDATE player_items SET item_list = ? WHERE owner_id = ?", [JSON.stringify(staged), player.Uid]);
                if (result.affectedRows !== 1) throw new Error("Clothing exchange was not persisted");
                await driver.commit();
                committed = true;
                inventory.ItemList = staged;
            } catch (error) {
                if (!committed) await driver.rollback();
                throw error;
            }
        });
    } finally {
        release();
    }
}

class ExchangeClothHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player) return;
        if (body.length !== 4 || busy.has(player)) {
            await player.SendPacket(new PacketEmpty(COMMAND).setResult(5001));
            return;
        }
        busy.add(player);
        let committed = false;
        try {
            await exchange(player, session, body.readUInt32BE(0));
            committed = true;
            await player.SendPacket(new PacketEmpty(COMMAND));
        } catch (error) {
            Logger.Error(committed ? "[ExchangeCloth] Saved; response failed" : "[ExchangeCloth] Exchange failed",
                error instanceof Error ? error : new Error(String(error)));
            if (!committed) await player.SendPacket(new PacketEmpty(COMMAND).setResult(5001));
        } finally {
            busy.delete(player);
        }
    }
}
Opcode(COMMAND, InjectType.NONE)(ExchangeClothHandler);
module.exports = { ExchangeClothHandler };
