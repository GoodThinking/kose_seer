"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrantMaterials = GrantMaterials;
const DatabaseManager_1 = require("../../../DataBase/DatabaseManager");
/** Persist every item in one collection/game reward before acknowledging it. */
async function GrantMaterials(player, reward) {
    // These published runtime methods predate synchronization of the deployment's TS declarations.
    const inventory = player.ItemManager.ItemData;
    const database = DatabaseManager_1.DatabaseManager.Instance;
    const release = await inventory.AcquireReward();
    try {
        const rewards = reward();
        if (!rewards.length)
            return [];
        for (const item of rewards) {
            if (![item.itemId, item.count].every(n => Number.isSafeInteger(n) && n > 0 && n <= 0xffffffff)) {
                throw new Error('Invalid material reward');
            }
        }
        return await database.WithConnection(async (driver) => {
            await driver.beginTransaction();
            let committed = false;
            try {
                const [row] = await driver.query('SELECT item_list FROM player_items WHERE owner_id = ?', [player.Uid]);
                if (!row)
                    throw new Error('Material inventory missing');
                const items = JSON.parse(row.item_list);
                for (const reward of rewards) {
                    const item = items.find(entry => entry.itemId === reward.itemId);
                    if (item) {
                        if (!Number.isSafeInteger(item.count) || item.count < 0 || item.count + reward.count > 0xffffffff) {
                            throw new Error('Material inventory count out of range');
                        }
                        item.count += reward.count;
                    }
                    else
                        items.push({ itemId: reward.itemId, count: reward.count, expireTime: 0x057E40 });
                }
                const result = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [JSON.stringify(items), player.Uid]);
                if (result.affectedRows !== 1)
                    throw new Error('Material reward was not saved');
                await driver.commit();
                committed = true;
                inventory.ItemList = items;
                return rewards;
            }
            catch (error) {
                if (!committed)
                    await driver.rollback();
                throw error;
            }
        });
    }
    finally {
        release();
    }
}
//# sourceMappingURL=MaterialRewards.js.map