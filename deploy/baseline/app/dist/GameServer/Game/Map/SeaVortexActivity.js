"use strict";
const { DatabaseManager } = require("../../../DataBase/DatabaseManager");
const { ItemSystem } = require("../Item/ItemSystem");
const rules = require("../../../../config/data/json/sea_vortex.json");
const prefix = "sea:vortex:";
const totalWeight = rules.rewards.reduce((sum, reward) => sum + reward.weight, 0);

class SeaVortexError extends Error {}

function available(player) {
    return player.Data.mapID === rules.mapId &&
        player.TaskManager.TaskData.IsTaskCompleted(rules.introTaskId) &&
        player.Data.actionType !== 1 && !player.BattleManager.GetCurrentBattle();
}
function requireAvailable(player) {
    if (!available(player)) throw new SeaVortexError("请先帮助阿布救回精灵蛋，并在海之子神殿、非战斗状态下参与救援。");
}
async function readState(driver, player) {
    const rows = await driver.query("SELECT reward_key, amount FROM receiver_claims WHERE owner_id = ? AND period_start = ? AND reward_key LIKE ?", [player.Uid, 0, prefix + "%"]);
    return new Map(rows.map(row => [row.reward_key.slice(prefix.length), Number(row.amount)]));
}
async function writeState(driver, player, state, key, value) {
    let result;
    if (state.has(key)) {
        result = await driver.execute("UPDATE receiver_claims SET amount = ?, claimed_at = ? WHERE owner_id = ? AND reward_key = ? AND period_start = ?", [value, Math.floor(Date.now() / 1000), player.Uid, prefix + key, 0]);
    } else {
        result = await driver.execute("INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)", [player.Uid, prefix + key, 0, Math.floor(Date.now() / 1000), value]);
    }
    if (result.affectedRows !== 1) throw new Error("Sea rescue state was not persisted");
    state.set(key, value);
}
function snapshot(state) {
    const reward = rules.rewards.find(reward => reward.petId && reward.petId === state.get("pending"));
    return {
        shots: state.get("drag") || 0,
        run: state.get("run") || 0,
        pk: state.get("pk") || 0,
        pendingSlot: reward ? state.get("pending-slot") : 0xffffffff,
        petId: reward?.petId || 0,
        region: reward?.region || 0
    };
}
async function transact(player, work, idle = true) {
    const release = await player.ItemManager.ItemData.AcquireReward();
    try {
        return await DatabaseManager.Instance.WithConnection(async driver => {
            await driver.beginTransaction();
            let committed = false;
            try {
                if (idle) requireAvailable(player);
                const state = await readState(driver, player);
                const result = await work(driver, state);
                await driver.commit();
                committed = true;
                if (result.items) player.ItemManager.ItemData.ItemList = result.items;
                return result;
            } catch (error) {
                if (!committed) await driver.rollback();
                throw error;
            }
        });
    } finally {
        release();
    }
}
async function GetSeaState(player) {
    requireAvailable(player);
    return DatabaseManager.Instance.WithConnection(async driver => snapshot(await readState(driver, player)));
}
async function RecordSeaShot(player, request) {
    const b = rules.shotBounds;
    if (!available(player) || request.x < b.minX || request.x > b.maxX || request.y < b.minY || request.y > b.maxY) return;
    await transact(player, async (driver, state) => {
        if (state.get("pending") && state.get("pending-slot") === 0) return {};
        const shots = state.get("drag") || 0;
        if (shots < rules.shotsRequired) await writeState(driver, player, state, "drag", shots + 1);
        return {};
    });
}
async function RecordSeaPirateVictory(player, battle) {
    const slot = battle.seaVortexPirateSlot;
    if (![1, 2].includes(slot) || battle.enemy.id !== rules.guard.petId) return;
    await transact(player, async (driver, state) => {
        const key = rules.slots[slot];
        if ((state.get(key) || 0) !== 1) await writeState(driver, player, state, key, 1);
        return {};
    }, false);
}
async function ResolveSeaRescue(player, slot) {
    if (!Number.isInteger(slot) || slot < 0 || slot >= rules.slots.length) throw new SeaVortexError("请选择场景中的救援目标。");
    return transact(player, async (driver, state) => {
        if (state.get("pending")) {
            if (state.get("pending-slot") !== slot) throw new SeaVortexError("先解救当前贝壳中的精灵，再帮助其他伙伴。");
            return { ...snapshot(state), itemId: 0 };
        }
        const key = rules.slots[slot], required = slot === 0 ? rules.shotsRequired : 1;
        if ((state.get(key) || 0) < required) throw new SeaVortexError(slot === 0 ? "先用头部射击命中拖拽精灵的海盗三次，再点击留下的贝壳。" : "先击败这名海盗潜水兵，再点击获救的精灵。");
        const [row] = await driver.query("SELECT item_list FROM player_items WHERE owner_id = ?", [player.Uid]);
        if (!row) throw new Error("Sea rescue inventory missing");
        const items = JSON.parse(row.item_list), bubbleRule = rules.rewards.find(reward => reward.itemId);
        const bubble = items.find(item => item.itemId === bubbleRule.itemId), count = bubble?.count || 0;
        if (!Number.isSafeInteger(count) || count < 0) throw new Error("Invalid crystal bubble count");
        if (count + bubbleRule.count > Math.min(ItemSystem.GetMaxStack(bubbleRule.itemId), 0xffffffff)) throw new SeaVortexError("晶化气泡已达到背包上限，请先整理背包再救援。");
        let roll = Math.random() * totalWeight, selected = 0;
        for (; selected < rules.rewards.length - 1; selected++) {
            roll -= rules.rewards[selected].weight;
            if (roll < 0) break;
        }
        const reward = rules.rewards[selected];
        await writeState(driver, player, state, key, 0);
        if (reward.petId) {
            await writeState(driver, player, state, "pending", reward.petId);
            await writeState(driver, player, state, "pending-slot", slot);
            return { ...snapshot(state), itemId: 0 };
        }
        if (bubble) bubble.count += reward.count;
        else items.push({ itemId: reward.itemId, count: reward.count, expireTime: 0x057E40 });
        const result = await driver.execute("UPDATE player_items SET item_list = ? WHERE owner_id = ?", [JSON.stringify(items), player.Uid]);
        if (result.affectedRows !== 1) throw new Error("Sea rescue item was not persisted");
        return { ...snapshot(state), itemId: reward.itemId, items };
    });
}

// The selected species survives refresh and query retries. Consume it only for a built battle.
async function StartSeaRescueEncounter(player, encounter, isValid, start) {
    const release = await player.ItemManager.ItemData.AcquireReward();
    try {
        if (!isValid()) return false;
        return await DatabaseManager.Instance.WithConnection(async driver => {
            await driver.beginTransaction();
            let committed = false;
            try {
                requireAvailable(player);
                const state = await readState(driver, player), pending = state.get("pending") || 0;
                const selected = rules.rewards.find(reward => reward.petId && reward.petId === pending);
                if (!selected || selected.petId !== encounter.petId || selected.region !== encounter.region || !isValid()) {
                    await driver.rollback();
                    return false;
                }
                await writeState(driver, player, state, "pending", 0);
                await driver.commit();
                committed = true;
                if (!isValid()) {
                    await writeState(driver, player, state, "pending", pending);
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
module.exports = { SeaVortexError, GetSeaState, RecordSeaShot, RecordSeaPirateVictory, ResolveSeaRescue, StartSeaRescueEncounter };
