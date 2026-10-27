'use strict';
const { DatabaseManager } = require('../../../../DataBase/DatabaseManager');
const { DatabaseHelper } = require('../../../../DataBase/DatabaseHelper');
const { ChallengeProgressDataAccessor } = require('../../../../DataBase/accessors/ChallengeProgressDataAccessor');
const { ItemSystem } = require('../../Item/ItemSystem');
const { ItemEventType, ItemGainSource } = require('../../Event/EventTypes');
const { Logger } = require('../../../../shared/utils');

// Inventory reservation precedes the database queue. Never wait for either inside it.
async function grantFirstItem(player, sptId, itemId) {
    const inventory = player.ItemManager.ItemData;
    const progress = player.ChallengeProgressManager._data;
    if (!progress || !ItemSystem.Exists(itemId)) throw new Error('Invalid SPT reward');
    const release = await inventory.AcquireReward();
    let awarded = false;
    try {
        // Flush pre-existing inventory/progress mutations before reading their database rows.
        await DatabaseHelper.Instance.SaveItemData(inventory, true);
        await ChallengeProgressDataAccessor.Instance.Save(progress);
        const db = DatabaseManager.Instance;
        await db.WithConnection(async driver => {
            let committed = false;
            await driver.beginTransaction();
            try {
                const lock = db.DatabaseType === 'mysql' ? ' FOR UPDATE' : '';
                const [items] = await driver.query('SELECT item_list FROM player_items WHERE owner_id = ?' + lock, [player.Uid]);
                const [challenge] = await driver.query('SELECT boss_achievement FROM player_challenge_progress WHERE user_id = ?' + lock, [player.Uid]);
                if (!items || !challenge) throw new Error('SPT reward data missing');
                const bits = Buffer.from(challenge.boss_achievement || []);
                if (bits.length !== 200) throw new Error('Invalid SPT progress');
                if (bits[sptId - 1]) {
                    await driver.commit();
                    committed = true;
                    progress.bossAchievement[sptId - 1] = true;
                    return;
                }
                const staged = JSON.parse(items.item_list);
                if (!Array.isArray(staged)) throw new Error('Invalid inventory');
                const item = staged.find(entry => entry.itemId === itemId);
                const count = item ? item.count : 0;
                const max = ItemSystem.GetMaxStack(itemId);
                if (!Number.isSafeInteger(count) || count < 0 || !Number.isSafeInteger(max) || count >= max || count >= 0xffffffff)
                    throw new Error('SPT item inventory full');
                if (item) item.count++;
                else staged.push({ itemId, count: 1, expireTime: 0x057E40 });
                bits[sptId - 1] = 1;
                const iw = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [JSON.stringify(staged), player.Uid]);
                const pw = await driver.execute('UPDATE player_challenge_progress SET boss_achievement = ? WHERE user_id = ?', [bits, player.Uid]);
                if (iw.affectedRows !== 1 || pw.affectedRows !== 1) throw new Error('SPT reward write failed');
                await driver.commit();
                committed = true;
                inventory.ItemList = staged;
                progress.bossAchievement[sptId - 1] = true;
                awarded = true;
            } catch (error) {
                if (!committed) await driver.rollback();
                throw error;
            }
        });
    } finally { release(); }
    if (awarded) {
        try {
            await player.EventBus.Emit({ type: ItemEventType.ITEM_GAINED, timestamp: Date.now(), playerId: player.Uid, itemId, count: 1, source: ItemGainSource.DROP });
        } catch (error) { Logger.Error('[AcquisitionRewards] committed notification failed', error); }
    }
    return awarded;
}
exports.grantFirstItem = grantFirstItem;
