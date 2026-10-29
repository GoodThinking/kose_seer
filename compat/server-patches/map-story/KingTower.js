"use strict";
const { DatabaseManager } = require("../../../DataBase/DatabaseManager");
const { ItemSystem } = require("../Item/ItemSystem");
const rules = require("../../../../config/data/json/king_tower.json");
const { OnlineTracker } = require("../Player/OnlineTracker");
const { BroadcastService } = require("../Broadcast/BroadcastService");
const { PacketLeaveMap } = require("../../Server/Packet/Send");
const prefix = "king:tower:";
const entries = new WeakMap();

class KingTowerError extends Error {}

function requireEntrance(player) {
    if (player.Data.mapID !== rules.entranceMapId || player.Data.actionType === 1 || player.BattleManager.GetCurrentBattle()) {
        throw new KingTowerError("请在王者之塔入口、非战斗状态下操作。");
    }
}
function IsInKingTower(player) {
    return player.Data.mapID === rules.entranceMapId && entries.has(player);
}
function modeKey(mode, field) {
    return mode + ":" + field;
}
async function readState(driver, player) {
    const rows = await driver.query("SELECT reward_key, amount FROM receiver_claims WHERE owner_id = ? AND period_start = ? AND reward_key LIKE ?", [player.Uid, 0, prefix + "%"]);
    return new Map(rows.map(row => [row.reward_key.slice(prefix.length), Number(row.amount)]));
}
async function writeState(driver, player, state, key, value) {
    const now = Math.floor(Date.now() / 1000);
    const result = state.has(key)
        ? await driver.execute("UPDATE receiver_claims SET amount = ?, claimed_at = ? WHERE owner_id = ? AND reward_key = ? AND period_start = ?", [value, now, player.Uid, prefix + key, 0])
        : await driver.execute("INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)", [player.Uid, prefix + key, 0, now, value]);
    if (result.affectedRows !== 1) throw new Error("King tower state was not persisted");
    state.set(key, value);
}
function snapshot(state) {
    return {
        normalMax: state.get("1:max") || 0,
        normalCurrent: state.get("1:current") || 0,
        heroMax: state.get("2:max") || 0,
        heroCurrent: state.get("2:current") || 0,
        activeMode: state.get("active") || 0,
        achievementPoints: rules.milestones.reduce((points, milestone) => points + (state.get(modeKey(milestone.mode, "achievement:" + milestone.floor)) === 1 ? milestone.points : 0), 0)
    };
}
async function transact(player, work, idle = true) {
    const release = await player.ItemManager.ItemData.AcquireReward();
    try {
        return await DatabaseManager.Instance.WithConnection(async driver => {
            await driver.beginTransaction();
            let committed = false;
            try {
                if (idle) requireEntrance(player);
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

/** A full inventory retains its unclaimed reward; it never rolls back a won floor. */
async function settleMilestones(driver, player, state) {
    const result = { rewardItems: [], achievements: [], titleIds: [], pendingRewards: false };
    let items;
    let itemsChanged = false;
    for (const milestone of rules.milestones) {
        if ((state.get(modeKey(milestone.mode, "max")) || 0) < milestone.floor) continue;
        const achievementKey = modeKey(milestone.mode, "achievement:" + milestone.floor);
        if (state.get(achievementKey) !== 1) {
            await writeState(driver, player, state, achievementKey, 1);
            result.achievements.push({ branch: milestone.achievementBranch, rule: milestone.achievementRule, points: milestone.points });
            if (milestone.titleId) result.titleIds.push(milestone.titleId);
        }
        const rewardKey = modeKey(milestone.mode, "reward:" + milestone.floor);
        if (state.get(rewardKey) === 1) continue;
        if (!items) {
            const [row] = await driver.query("SELECT item_list FROM player_items WHERE owner_id = ?", [player.Uid]);
            if (!row) throw new Error("King tower inventory missing");
            items = JSON.parse(row.item_list);
        }
        const additions = [];
        let fits = true;
        for (const reward of milestone.items) {
            const item = items.find(item => item.itemId === reward.itemId);
            const count = item?.count || 0;
            if (!Number.isSafeInteger(count) || count < 0) throw new Error("Invalid king tower reward inventory");
            const maximum = Math.min(ItemSystem.GetMaxStack(reward.itemId), 0xffffffff);
            // Existing unique equipment or an existing essence already fulfils that item grant.
            if ((ItemSystem.IsUniqueItem(reward.itemId) || maximum === 1) && count >= 1) continue;
            if (count + reward.count > maximum) {
                fits = false;
                break;
            }
            additions.push(reward);
        }
        if (!fits) {
            result.pendingRewards = true;
            continue;
        }
        for (const reward of additions) {
            const item = items.find(item => item.itemId === reward.itemId);
            if (item) item.count += reward.count;
            else items.push({ itemId: reward.itemId, count: reward.count, expireTime: 0x057e40 });
            result.rewardItems.push({ itemId: reward.itemId, itemCnt: reward.count });
            itemsChanged = true;
        }
        await writeState(driver, player, state, rewardKey, 1);
    }
    if (itemsChanged) {
        const saved = await driver.execute("UPDATE player_items SET item_list = ? WHERE owner_id = ?", [JSON.stringify(items), player.Uid]);
        if (saved.affectedRows !== 1) throw new Error("King tower rewards were not persisted");
        result.items = items;
    }
    return result;
}
async function GetKingTowerProgress(player) {
    return transact(player, async (driver, state) => {
        const result = await settleMilestones(driver, player, state);
        return { ...result, ...snapshot(state) };
    });
}
function requirePets(player, mode) {
    const pets = player.PetManager.GetPetsInBag();
    const required = mode === 2 ? rules.heroRequiredLevel100Pets : rules.normalRequiredLevel100Pets;
    if (pets.filter(pet => pet.level === 100).length < required) {
        throw new KingTowerError("需要携带至少" + required + "只100级精灵，才可挑战" + (mode === 2 ? "极限" : "普通") + "模式。");
    }
    if (!pets.some(pet => pet.hp > 0)) throw new KingTowerError("背包中的精灵都已失去体力，请先恢复后再挑战。");
    return pets.map(pet => pet.catchTime).sort((a, b) => a - b);
}
function storedParty(state) {
    const count = state.get("2:party-count") || 0;
    const party = [];
    for (let index = 0; index < count; index++) party.push(state.get("2:party:" + index));
    return party;
}
function sameParty(left, right) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}
function preview(floor) {
    const definition = rules.floors[floor - 1];
    if (!definition || definition.floor !== floor) throw new Error("King tower floor definition missing");
    return { stage: floor - 1, pets: definition.pets.slice() };
}
async function EnterKingTower(player, mode, checkpoint) {
    requireEntrance(player);
    if (![1, 2].includes(mode) || !Number.isInteger(checkpoint) || checkpoint < 0 || checkpoint > 3) {
        throw new KingTowerError("请选择普通或极限模式的有效楼层入口。");
    }
    const party = requirePets(player, mode);
    const result = await transact(player, async (driver, state) => {
        const current = state.get(modeKey(mode, "current")) || 0;
        const floor = checkpoint ? (checkpoint - 1) * 10 + 1 : current + 1;
        if (floor > rules.maxFloor) throw new KingTowerError("本轮已通关，请从原生选层面板重新选择入口。");
        const normalMax = state.get("1:max") || 0;
        if (mode === 1 && floor > normalMax + 1) throw new KingTowerError("请先通过前面的楼层，再选择该十层入口。");
        if (mode === 2 && normalMax < Math.ceil(floor / 10) * 10) {
            throw new KingTowerError("需要先通过普通模式第" + Math.ceil(floor / 10) * 10 + "层，才可挑战这一段极限模式。");
        }
        let run = state.get(modeKey(mode, "run")) || 0;
        if (checkpoint || !run) {
            run++;
            await writeState(driver, player, state, modeKey(mode, "run"), run);
            if (mode === 2) {
                await writeState(driver, player, state, "2:party-count", party.length);
                for (let index = 0; index < party.length; index++) await writeState(driver, player, state, "2:party:" + index, party[index]);
            }
        } else if (mode === 2 && !sameParty(party, storedParty(state))) {
            throw new KingTowerError("极限模式须使用本轮入场的背包成员。请还原背包继续，或选择重新挑战。");
        }
        await writeState(driver, player, state, modeKey(mode, "current"), floor - 1);
        await writeState(driver, player, state, "active", mode);
        return { mode, floor, run, party, ...preview(floor) };
    });
    entries.set(player, result);
    player.BattleManager.InvalidatePendingCapture();
    const mapId = OnlineTracker.Instance.GetPlayerMap(player.Uid);
    if (mapId > 0) {
        OnlineTracker.Instance.UpdatePlayerMap(player.Uid, 0, 0);
        player.MapSpawnManager.OnLeaveMap(mapId);
        await BroadcastService.Instance.BroadcastToMap(mapId, new PacketLeaveMap(player.Uid), player.Uid);
    }
    return result;
}
async function PrepareKingTowerBattle(player) {
    requireEntrance(player);
    const entry = entries.get(player);
    if (!entry) throw new KingTowerError("请先从原生选层面板进入王者之塔。");
    const party = requirePets(player, entry.mode);
    return DatabaseManager.Instance.WithConnection(async driver => {
        const state = await readState(driver, player);
        const floor = (state.get(modeKey(entry.mode, "current")) || 0) + 1;
        if (state.get("active") !== entry.mode || state.get(modeKey(entry.mode, "run")) !== entry.run || floor > rules.maxFloor) {
            throw new KingTowerError("挑战进度已改变，请返回入口重新选择楼层。");
        }
        if (entry.mode === 2 && !sameParty(party, storedParty(state))) {
            throw new KingTowerError("极限模式不能在塔内调换仓库成员；战斗内换宠仍可正常使用。");
        }
        return { mode: entry.mode, floor, run: entry.run, entry, entranceMapId: rules.entranceMapId, roomMapId: rules.roomMapId, enemyLevel: rules.enemyLevel, definition: rules.floors[floor - 1], next: { ...preview(Math.min(rules.maxFloor, floor + 1)), stage: floor } };
    });
}
async function AdvanceKingTower(player, battle, stillValid) {
    const context = battle.kingTower;
    if (!context || entries.get(player) !== context.entry || battle.enemyTeam.some(pet => pet.hp > 0)) {
        throw new Error("King tower victory does not own a defeated complete team");
    }
    return transact(player, async (driver, state) => {
        if (!stillValid() || entries.get(player) !== context.entry || state.get("active") !== context.mode ||
            state.get(modeKey(context.mode, "run")) !== context.run ||
            (state.get(modeKey(context.mode, "current")) || 0) !== context.floor - 1) {
            throw new Error("King tower victory no longer owns current progress");
        }
        await writeState(driver, player, state, modeKey(context.mode, "current"), context.floor);
        const maximum = Math.max(context.floor, state.get(modeKey(context.mode, "max")) || 0);
        await writeState(driver, player, state, modeKey(context.mode, "max"), maximum);
        if (context.floor === rules.maxFloor || context.mode === 2 && context.floor % 10 === 0) {
            await writeState(driver, player, state, "active", 0);
        }
        const result = await settleMilestones(driver, player, state);
        if (!stillValid()) throw new Error("King tower battle changed before progress commit");
        return { ...result, ...snapshot(state) };
    }, false);
}
async function LeaveKingTower(player) {
    requireEntrance(player);
    await transact(player, async (driver, state) => {
        await writeState(driver, player, state, "active", 0);
        return {};
    });
    entries.delete(player);
}
async function GetKingTowerTitles(player) {
    return DatabaseManager.Instance.WithConnection(async driver => {
        const state = await readState(driver, player);
        return rules.milestones.filter(milestone => milestone.titleId && state.get(modeKey(milestone.mode, "achievement:" + milestone.floor)) === 1).map(milestone => milestone.titleId);
    });
}
module.exports = { KingTowerError, IsInKingTower, GetKingTowerProgress, EnterKingTower, PrepareKingTowerBattle, AdvanceKingTower, LeaveKingTower, GetKingTowerTitles };
