"use strict";
const { DatabaseManager } = require("../../../DataBase/DatabaseManager");
const { ItemSystem } = require("../Item/ItemSystem");
const rules = require("../../../../config/data/json/closed_space.json");
class ClosedSpaceError extends Error {}
async function ClaimClosedSpaceTreasure(player, prizeIndex) {
    const room = rules.rooms.find(room => room.prizeIndex === prizeIndex && room.mapId === player.Data.mapID);
    if (!room || player.Data.actionType === 1 || player.BattleManager.GetCurrentBattle()) {
        throw new ClosedSpaceError("请先完成当前闭锁空间的原生机关，再点击出现的宝箱。");
    }
    const release = await player.ItemManager.ItemData.AcquireReward();
    try {
        const result = await DatabaseManager.Instance.WithConnection(async driver => {
            await driver.beginTransaction();
            let committed = false;
            try {
                if (player.Data.mapID !== room.mapId || player.Data.actionType === 1 || player.BattleManager.GetCurrentBattle()) {
                    throw new ClosedSpaceError("地图或战斗状态已改变，请返回宝箱所在房间后重试。");
                }
                const key = "maze:chest:" + room.mapId;
                const [claim] = await driver.query("SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?", [player.Uid, key, 0]);
                if (claim) {
                    await driver.commit();
                    committed = true;
                    return {alreadyClaimed: true};
                }
                const [row] = await driver.query("SELECT item_list FROM player_items WHERE owner_id = ?", [player.Uid]);
                if (!row) throw new Error("Closed-space treasure inventory missing");
                const items = JSON.parse(row.item_list), reward = room.reward;
                const item = items.find(item => item.itemId === reward.itemId), count = item?.count || 0;
                if (!Number.isSafeInteger(count) || count < 0) throw new Error("Invalid treasure item count");
                if (count + reward.count > Math.min(ItemSystem.GetMaxStack(reward.itemId), 0xffffffff)) {
                    throw new ClosedSpaceError("高级精灵胶囊存量已满，请整理储存箱后再打开宝箱；领取机会会保留。");
                }
                if (item) item.count += reward.count;
                else items.push({itemId: reward.itemId, count: reward.count, expireTime: 0x057e40});
                const saved = await driver.execute("UPDATE player_items SET item_list = ? WHERE owner_id = ?", [JSON.stringify(items), player.Uid]);
                if (saved.affectedRows !== 1) throw new Error("Closed-space treasure item was not persisted");
                const claimed = await driver.execute("INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)", [player.Uid, key, 0, Math.floor(Date.now() / 1000), reward.count]);
                if (claimed.affectedRows !== 1) throw new Error("Closed-space treasure claim was not persisted");
                await driver.commit();
                committed = true;
                return {alreadyClaimed: false, reward, items};
            } catch (error) {
                if (!committed) await driver.rollback();
                throw error;
            }
        });
        if (result.items) player.ItemManager.ItemData.ItemList = result.items;
        return result;
    } finally {
        release();
    }
}
module.exports = {ClosedSpaceError, ClaimClosedSpaceTreasure};
