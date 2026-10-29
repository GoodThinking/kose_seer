"use strict";
const { DatabaseManager } = require("../../../DataBase/DatabaseManager");
const { SaveTaskBuffer } = require("../Task/SaveTaskState");
const { DecodeTask96Buffer } = require("../Task/Task96Buffer");
const { SendForestAlert } = require("./ForestMechanisms");
const { PacketEmpty } = require("../../Server/Packet/Send/PacketEmpty");
const { CommandID } = require("../../../shared/protocol/CommandID");
const { RecordSeaPirateVictory } = require("./SeaVortexActivity");

function compassCalibrated(tasks) {
    const buffer = tasks.TaskBuffers.get(10039);
    const progress = buffer?.xinBytes ?? (buffer ? DecodeTask96Buffer(buffer) : []);
    return progress[0] === 1 && progress[1] === 1 && progress[2] === 1;
}

async function ValidateCompassEntry(player, mapId, region, config) {
    if (mapId !== 10039) return true;
    let message;
    if (player.Data.mapID !== 10039 || region !== 0 || config?.petId !== 804) {
        message = "请在时空罗盘试炼中央挑战封印投影。";
    } else if (!player.TaskManager.TaskData.IsTaskCompleted(10039) &&
        (!player.TaskManager.TaskData.IsTaskAccepted(10039) || !compassCalibrated(player.TaskManager.TaskData))) {
        message = "请先接受试炼，并依次校准过去、现在、未来三座星印。";
    }
    if (!message) return true;
    await SendForestAlert(player, message);
    await player.SendPacket(new PacketEmpty(CommandID.CHALLENGE_BOSS).setResult(900));
    return false;
}

async function GrantMapVictory(player, battle) {
    await RecordSeaPirateVictory(player, battle);
    if (battle.bossMapId === 10039 && battle.bossParam2 === 0 && battle.enemy.id === 804) {
        const tasks = player.TaskManager.TaskData;
        if (tasks.IsTaskAccepted(10039) && !tasks.IsTaskCompleted(10039) && compassCalibrated(tasks)) {
            await SaveTaskBuffer(tasks, 10039, current => {
                const progress = (current?.xinBytes ?? DecodeTask96Buffer(current)).slice();
                progress[3] = 1;
                if (current?.xinBytes) return { ...current, xinBytes: progress, compassVictory: true };
                return { ...current, ...Object.fromEntries(progress.map((value, index) => [index, value])), compassVictory: true };
            });
        }
        return [];
    }
    const reward = battle.bossMapId === 684 && battle.bossParam2 === 0 && battle.enemy.id === 997
        ? { key: "forest:first-win:997", itemId: 400239 }
        : battle.bossMapId === 686 && [0, 1].includes(battle.bossParam2) && battle.enemy.id === 1012
            ? { key: "forest:first-win:1012", itemId: 400244 } : undefined;
    if (!reward) return [];
    const inventory = player.ItemManager.ItemData;
    const release = await inventory.AcquireReward();
    try {
        return await DatabaseManager.Instance.WithConnection(async driver => {
            await driver.beginTransaction();
            let committed = false;
            try {
                const [claim] = await driver.query(
                    "SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?",
                    [player.Uid, reward.key, 0]);
                if (claim) {
                    await driver.commit(); committed = true;
                    return [];
                }
                const [row] = await driver.query("SELECT item_list FROM player_items WHERE owner_id = ?", [player.Uid]);
                if (!row) throw new Error("Forest first-win inventory missing");
                const items = JSON.parse(row.item_list);
                const item = items.find(entry => entry.itemId === reward.itemId);
                if (item && (!Number.isSafeInteger(item.count) || item.count < 0 || item.count > 1)) {
                    throw new Error("Invalid forest essence inventory");
                }
                const granted = !item || item.count === 0;
                if (granted) {
                    if (item) item.count = 1;
                    else items.push({ itemId: reward.itemId, count: 1, expireTime: 0x057E40 });
                    const write = await driver.execute("UPDATE player_items SET item_list = ? WHERE owner_id = ?",
                        [JSON.stringify(items), player.Uid]);
                    if (write.affectedRows !== 1) throw new Error("Forest essence was not persisted");
                }
                const write = await driver.execute(
                    "INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)",
                    [player.Uid, reward.key, 0, Math.floor(Date.now() / 1000), 1]);
                if (write.affectedRows !== 1) throw new Error("Forest first victory was not persisted");
                await driver.commit(); committed = true;
                if (granted) inventory.ItemList = items;
                return granted ? [{ itemId: reward.itemId, count: 1 }] : [];
            } catch (error) {
                if (!committed) await driver.rollback();
                throw error;
            }
        });
    } finally {
        release();
    }
}

module.exports = { ValidateCompassEntry, GrantMapVictory };
