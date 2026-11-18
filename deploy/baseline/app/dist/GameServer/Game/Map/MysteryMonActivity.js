"use strict";
const { DatabaseManager } = require("../../../DataBase/DatabaseManager");
const { BattleType } = require("../../../shared/models/BattleModel");
const { Logger } = require("../../../shared/utils/Logger");
const { ItemSystem } = require("../Item/ItemSystem");
const { ItemEventType, ItemGainSource } = require("../Event/EventTypes");
const definitions = require("../../../../config/data/json/story_encounters.json");
const mystery = definitions.find(row => row.fragmentDrop);

// Readiness is read-only. A failed battle build must not spend collected fragments.
async function StartPaidStoryEncounter(player, encounter, isValid, start) {
    const inventory = player.ItemManager.ItemData;
    const release = await inventory.AcquireReward();
    try {
        if (!isValid()) return false;
        return await DatabaseManager.Instance.WithConnection(async driver => {
            await driver.beginTransaction();
            let committed = false;
            try {
                const [row] = await driver.query('SELECT item_list FROM player_items WHERE owner_id = ?', [player.Uid]);
                if (!row) throw new Error('Fragment inventory missing');
                const items = JSON.parse(row.item_list);
                for (const cost of encounter.requiredItems) {
                    const item = items.find(entry => entry.itemId === cost.itemId);
                    if (!item || !Number.isSafeInteger(item.count) || item.count < cost.count) {
                        await driver.rollback();
                        return false;
                    }
                    item.count -= cost.count;
                }
                if (!isValid()) {
                    await driver.rollback();
                    return false;
                }
                const write = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?',
                    [JSON.stringify(items), player.Uid]);
                if (write.affectedRows !== 1) throw new Error('Fragment payment was not saved');
                if (!isValid()) {
                    await driver.rollback();
                    return false;
                }
                await driver.commit();
                committed = true;
                // Recheck before publishing the reduced counts. The validity predicate reads inventory too.
                const valid = isValid();
                inventory.ItemList = items;
                if (!valid) {
                    // A map/logout event may arrive while commit awaits I/O. No fight started: restore
                    // the exact prior inventory under the same reservation and DB connection lease.
                    const restored = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?',
                        [row.item_list, player.Uid]);
                    if (restored.affectedRows !== 1) throw new Error('Cancelled encounter payment could not be restored');
                    inventory.ItemList = JSON.parse(row.item_list);
                    return false;
                }
                start();
                return true;
            } catch (error) {
                if (!committed) await driver.rollback();
                throw error;
            }
        });
    } finally {
        release();
    }
}

async function GrantMysteryFragments(player, battle, mapId, slot) {
    const rule = mystery.fragmentDrop;
    const records = player.TaskManager.TaskData.TaskBuffers.get(0)?.storyRecordBytes;
    if (mapId !== mystery.mapId || slot === undefined || slot < 0 || battle.battleType !== BattleType.PVE ||
        !rule.petIds.includes(battle.enemy.id) ||
        !(records?.[mystery.requiredRecord >>> 3] & (1 << (mystery.requiredRecord % 8)))) return [];
    const inventory = player.ItemManager.ItemData;
    const release = await inventory.AcquireReward();
    let rewards;
    try {
        rewards = await DatabaseManager.Instance.WithConnection(async driver => {
            await driver.beginTransaction();
            let committed = false;
            try {
                const [row] = await driver.query('SELECT item_list FROM player_items WHERE owner_id = ?', [player.Uid]);
                if (!row) throw new Error('Fragment inventory missing');
                const items = JSON.parse(row.item_list), grants = [];
                for (const fragment of mystery.requiredItems) {
                    const item = items.find(entry => entry.itemId === fragment.itemId);
                    const owned = item?.count ?? 0;
                    if (!Number.isSafeInteger(owned) || owned < 0) throw new Error('Invalid fragment count');
                    const capacity = ItemSystem.GetMaxStack(fragment.itemId) - owned;
                    if (capacity <= 0 || Math.random() >= rule.rate) continue;
                    const count = Math.min(capacity, Math.floor(Math.random() * (rule.maxCount - rule.minCount + 1)) + rule.minCount);
                    if (item) item.count += count;
                    else items.push({ itemId: fragment.itemId, count, expireTime: 0x057E40 });
                    grants.push({ itemId: fragment.itemId, count });
                }
                if (grants.length) {
                    const write = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?',
                        [JSON.stringify(items), player.Uid]);
                    if (write.affectedRows !== 1) throw new Error('Fragment drops were not saved');
                }
                await driver.commit();
                committed = true;
                if (grants.length) inventory.ItemList = items;
                return grants;
            } catch (error) {
                if (!committed) await driver.rollback();
                throw error;
            }
        });
    } finally {
        release();
    }
    for (const reward of rewards) {
        try {
            await player.EventBus.Emit({ type: ItemEventType.ITEM_GAINED, timestamp: Date.now(),
                playerId: player.Uid, itemId: reward.itemId, count: reward.count, source: ItemGainSource.DROP });
        } catch (error) {
            Logger.Error('[MysteryMonActivity] Fragment committed; item notification failed', error);
        }
    }
    return rewards;
}

module.exports = { StartPaidStoryEncounter, GrantMysteryFragments };
