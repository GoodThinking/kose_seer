"use strict";
const { DatabaseManager } = require("../../../DataBase/DatabaseManager");
const { ConfigLoader } = require("../../../shared/config/ConfigLoader");
const { ItemSystem } = require("../Item/ItemSystem");
const { BossAbilityConfig } = require("../Battle/BossAbility");
const { CommandID } = require("../../../shared/protocol/CommandID");
const { PacketEmpty } = require("../../Server/Packet/Send/PacketEmpty");
const rules = require("../../../../config/data/json/forest_mechanisms.json");
const bosses = new Map(rules.bosses.map(boss => [boss.mapId, boss]));

class ForestRequestError extends Error {}

async function SendForestAlert(player, message) {
    const text = Buffer.from(message, "utf8");
    const body = Buffer.alloc(4 + text.length);
    body.writeUInt32BE(text.length, 0);
    text.copy(body, 4);
    await player.SendPacket({ getCmdId: () => 80002, getResult: () => 0, serialize: () => body });
}

function bossError(player, mapId, region, config) {
    const boss = bosses.get(config?.mapId ?? mapId);
    if (!boss) return undefined;
    if (player.Data.mapID !== mapId) return "请在对应地图发起挑战。";
    if (!boss.regions.includes(region) || !config || config.petId !== boss.petId || (config.param2 ?? 0) !== region) {
        return boss.name + "的对应挑战数据尚未配置，暂时无法开始战斗。";
    }
    if (region === boss.fruitRegion && player.ItemManager.GetItemCount(rules.fireFruit.itemId) < 1) {
        return "需要先获得火之果，才能挑战暗夜冰狐的火之果形态。";
    }
    return undefined;
}

async function ValidateForestBossEntry(player, mapId, region, config) {
    const error = bossError(player, mapId, region, config);
    if (!error) return true;
    await SendForestAlert(player, error);
    await player.SendPacket(new PacketEmpty(CommandID.CHALLENGE_BOSS).setResult(900));
    return false;
}

class ForestMechanisms {
    constructor(player) {
        this.player = player;
    }

    Validate() {
        if (this.player.Data.mapID !== rules.mapId || this.player.Data.actionType === 1 || this.player.BattleManager.GetCurrentBattle()) {
            throw new ForestRequestError("请在神兽谷、非战斗状态下操作。 ");
        }
    }

    GetFoxRegion() {
        this.Validate();
        const region = this.player.ItemManager.GetItemCount(rules.fireFruit.itemId) >= 1 ? 1 : 0;
        const config = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(rules.mapId, region);
        const error = bossError(this.player, rules.mapId, region, config);
        if (error) throw new ForestRequestError(error);
        return region;
    }

    async CollectFireFruit() {
        this.Validate();
        const reward = rules.fireFruit;
        const probability = ConfigLoader.Instance.LoadJson("data/json/material-sources.json")?.dropProbability;
        if (!ItemSystem.Exists(reward.itemId) || !Number.isSafeInteger(reward.count) || reward.count <= 0 ||
            !Number.isSafeInteger(reward.cooldownSeconds) || reward.cooldownSeconds < 0 ||
            !Number.isFinite(probability) || probability < 0 || probability > 1) {
            throw new Error("Invalid forest fruit policy");
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
                    const key = "forest:fire-fruit";
                    const [claim] = await driver.query(
                        "SELECT claimed_at, amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?",
                        [this.player.Uid, key, 0]);
                    if (claim && now - claim.claimed_at < reward.cooldownSeconds) {
                        await driver.commit();
                        committed = true;
                        return 0;
                    }
                    const [row] = await driver.query("SELECT item_list FROM player_items WHERE owner_id = ?", [this.player.Uid]);
                    if (!row) throw new Error("Forest inventory missing");
                    const items = JSON.parse(row.item_list);
                    const item = items.find(entry => entry.itemId === reward.itemId);
                    const count = item ? item.count : 0;
                    const total = count + reward.count;
                    if (!Number.isSafeInteger(count) || count < 0 || !Number.isSafeInteger(total)) throw new Error("Invalid fruit inventory");
                    if (total > Math.min(ItemSystem.GetMaxStack(reward.itemId), 0xffffffff)) {
                        throw new ForestRequestError("火之果已达到背包上限。");
                    }
                    const obtained = Math.random() < probability;
                    const amount = obtained ? reward.count : 0;
                    let claimWrite;
                    if (claim) {
                        claimWrite = await driver.execute(
                            "UPDATE receiver_claims SET claimed_at = ?, amount = amount + ? WHERE owner_id = ? AND reward_key = ? AND period_start = ?",
                            [now, amount, this.player.Uid, key, 0]);
                    } else {
                        claimWrite = await driver.execute(
                            "INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)",
                            [this.player.Uid, key, 0, now, amount]);
                    }
                    if (claimWrite.affectedRows !== 1) throw new Error("Forest attempt was not saved");
                    if (obtained) {
                        if (item) item.count = total;
                        else items.push({ itemId: reward.itemId, count: reward.count, expireTime: 0x057E40 });
                        const write = await driver.execute("UPDATE player_items SET item_list = ? WHERE owner_id = ?",
                            [JSON.stringify(items), this.player.Uid]);
                        if (write.affectedRows !== 1) throw new Error("Forest inventory was not saved");
                    }
                    await driver.commit();
                    committed = true;
                    if (obtained) inventory.ItemList = items;
                    return obtained ? reward.itemId : 0;
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

module.exports = { ForestMechanisms, ForestRequestError, SendForestAlert, ValidateForestBossEntry };
