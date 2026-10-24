"use strict";
const { DatabaseManager } = require("../../../DataBase/DatabaseManager");
const { ConfigLoader } = require("../../../shared/config/ConfigLoader");
const { CommitBalanceReward } = require("../Reward/CommitBalanceReward");
const { ReceiverWeek } = require("../NoNo/ExperienceReceiver");
const { GachaTicketDay } = require("../Item/GachaTicket");
const { ItemSystem } = require("../Item/ItemSystem");

class CompassAlreadyClaimed extends Error {}

async function claimQuota(driver, player, key, period, now, amount) {
    const claimed = await driver.query(
        'SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?',
        [player.Uid, key, period]);
    if (claimed.length) throw new CompassAlreadyClaimed('Compass reward already claimed');
    const write = await driver.execute(
        'INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)',
        [player.Uid, key, period, now, amount]);
    if (write.affectedRows !== 1) throw new Error('Compass claim was not saved');
}

class CompassActivity {
    constructor(player) {
        this.player = player;
    }

    Validate() {
        if (this.player.Data.mapID !== 425 || this.player.Data.actionType === 1) {
            throw new Error('Compass rewards require map 425 and non-busy state');
        }
    }

    async ClaimExperience() {
        this.Validate();
        const config = ConfigLoader.Instance.LoadJson('data/json/compass_activity.json');
        if (!config || !Number.isSafeInteger(config.experience) || config.experience <= 0) {
            throw new Error('Invalid compass experience configuration');
        }
        const experience = config.experience;
        await CommitBalanceReward(this.player, { experience }, async (driver, now) => {
            this.Validate();
            await claimQuota(driver, this.player, 'compass:experience', ReceiverWeek(now), now, experience);
            return () => {};
        });
        return experience;
    }

    async ClaimItem(type) {
        this.Validate();
        if (type !== 1 && type !== 2) throw new Error('Unsupported compass reward type');
        const config = ConfigLoader.Instance.LoadJson('data/json/compass_activity.json');
        const reward = config?.items?.[type];
        if (!reward || !Number.isSafeInteger(reward.itemId) || !ItemSystem.Exists(reward.itemId) ||
            !Number.isSafeInteger(reward.count) || reward.count <= 0) {
            throw new Error('Invalid compass item configuration');
        }
        const inventory = this.player.ItemManager.ItemData;
        const release = await inventory.AcquireReward();
        try {
            this.Validate();
            return await DatabaseManager.Instance.WithConnection(async driver => {
                await driver.beginTransaction();
                let committed = false;
                try {
                    const now = Math.floor(Date.now() / 1000);
                    await claimQuota(driver, this.player, 'compass:item:' + type, GachaTicketDay(now), now, reward.count);
                    const [row] = await driver.query('SELECT item_list FROM player_items WHERE owner_id = ?', [this.player.Uid]);
                    if (!row) throw new Error('Inventory missing');
                    const items = JSON.parse(row.item_list);
                    const item = items.find(entry => entry.itemId === reward.itemId);
                    const count = item ? item.count : 0;
                    const total = count + reward.count;
                    if (!Number.isSafeInteger(count) || count < 0 || !Number.isSafeInteger(total) ||
                        total > Math.min(ItemSystem.GetMaxStack(reward.itemId), 0xffffffff)) {
                        throw new Error('Compass reward exceeds inventory capacity');
                    }
                    if (item) item.count = total;
                    else items.push({ itemId: reward.itemId, count: reward.count, expireTime: 0x057E40 });
                    const write = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?',
                        [JSON.stringify(items), this.player.Uid]);
                    if (write.affectedRows !== 1) throw new Error('Compass inventory was not saved');
                    await driver.commit();
                    committed = true;
                    inventory.ItemList = items;
                    return { itemId: reward.itemId, count: reward.count };
                } catch (error) {
                    if (!committed) await driver.rollback();
                    throw error;
                }
            });
        } finally {
            release();
        }
    }
}

module.exports = { CompassActivity, CompassAlreadyClaimed };
