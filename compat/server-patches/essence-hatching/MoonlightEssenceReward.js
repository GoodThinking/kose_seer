'use strict';
const { DatabaseManager } = require('../../../DataBase/DatabaseManager');
const { TaskConfig } = require('../../../shared/config/game/TaskConfig');
const { GameConfig } = require('../../../shared/config/game/GameConfig');
const { ItemSystem } = require('../Item/ItemSystem');
const REWARD_KEY = 'quest:91:meteor-essence';
exports.MOONLIGHT_ESSENCE_REWARD_KEY = REWARD_KEY;

// The old quest paid its currencies but omitted the meteor essence. Never replay those currencies.
exports.ReconcileMoonlightEssence = async function ReconcileMoonlightEssence(player) {
    if (!player.TaskManager.TaskData.IsTaskCompleted(91)) return false;
    const rewards = TaskConfig.Instance.GetTask(91)?.rewards?.items;
    if (!rewards || rewards.length !== 1 || rewards[0].count !== 1 || !GameConfig.GetItemById(rewards[0].itemId)?.BreedMonID) {
        throw new Error('Moonlight quest essence configuration missing');
    }
    const reward = rewards[0], inventory = player.ItemManager.ItemData;
    const release = await inventory.AcquireReward();
    try {
        return await DatabaseManager.Instance.WithConnection(async driver => {
            let committed = false;
            await driver.beginTransaction();
            try {
                const [claim] = await driver.query('SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = 0', [player.Uid, REWARD_KEY]);
                const [taskRow] = await driver.query('SELECT task_list FROM player_tasks WHERE owner_id = ?', [player.Uid]);
                const [itemRow] = await driver.query('SELECT item_list FROM player_items WHERE owner_id = ?', [player.Uid]);
                if (!taskRow || !itemRow) throw new Error('Moonlight quest reward data missing');
                const completed = JSON.parse(taskRow.task_list)['91']?.status === 3;
                if (claim || !completed) {
                    await driver.commit(); committed = true; return false;
                }
                const items = JSON.parse(itemRow.item_list);
                const existing = items.find(item => item.itemId === reward.itemId);
                if (existing && (!Number.isSafeInteger(existing.count) || existing.count < 0)) throw new Error('Invalid saved meteor essence count');
                if ((existing?.count || 0) >= ItemSystem.GetMaxStack(reward.itemId)) {
                    // Keep the entitlement pending until an existing essence has been consumed.
                    await driver.commit(); committed = true; return false;
                }
                if (existing) existing.count++;
                else items.push({ itemId: reward.itemId, count: 1, expireTime: 0x057E40 });
                const stock = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [JSON.stringify(items), player.Uid]);
                const receipt = await driver.execute('INSERT INTO receiver_claims(owner_id,reward_key,period_start,claimed_at,amount) VALUES(?,?,0,?,1)', [player.Uid, REWARD_KEY, Math.floor(Date.now() / 1000)]);
                if (stock.affectedRows !== 1 || receipt.affectedRows !== 1) throw new Error('Meteor essence reward was not saved');
                await driver.commit(); committed = true;
                inventory.ItemList = items;
                return true;
            } catch (error) {
                if (!committed) await driver.rollback();
                throw error;
            }
        });
    } finally { release(); }
};
