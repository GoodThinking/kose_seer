"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummoningField = void 0;
const DatabaseManager_1 = require("../../../DataBase/DatabaseManager");
const CommandID_1 = require("../../../shared/protocol/CommandID");
const BaseProto_1 = require("../../../shared/proto/base/BaseProto");
const PacketEmpty_1 = require("../../Server/Packet/Send/PacketEmpty");
const PacketBattleReward_1 = require("../../Server/Packet/Send/Battle/PacketBattleReward");
const BossAbilityConfig_1 = require("../Battle/BossAbility/BossAbilityConfig");
const EventTypes_1 = require("../Event/EventTypes");
/** Native map 502 uses a local summoning animation and five flame hits in one minute. */
class SummoningField {
    player;
    static MAP_ID = 502;
    static sessions = new WeakMap();
    summoned = false;
    hits = 0;
    windowStart = 0;
    joining = false;
    visit = 0;
    constructor(player) {
        this.player = player;
        player.EventBus.On(EventTypes_1.BattleEventType.BATTLE_END, this.OnVictory.bind(this));
        player.EventBus.On(EventTypes_1.PlayerEventType.LOGOUT, async () => SummoningField.Reset(player));
    }
    static For(player) {
        let state = this.sessions.get(player);
        if (!state) {
            state = new SummoningField(player);
            this.sessions.set(player, state);
        }
        return state;
    }
    static Reset(player) {
        const state = this.sessions.get(player);
        if (state) {
            state.summoned = false;
            state.hits = 0;
            state.windowStart = 0;
            state.joining = false;
            ++state.visit;
        }
    }
    async Join(pad) {
        if (this.player.Data.mapID !== SummoningField.MAP_ID || ![1, 2, 3].includes(pad) || this.summoned || this.joining) {
            await this.player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.JOIN_GAME).setResult(5001));
            return;
        }
        this.joining = true;
        const visit = this.visit;
        try {
            await this.player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.JOIN_GAME));
            if (this.player.Data.mapID !== SummoningField.MAP_ID || this.visit !== visit)
                return;
            this.summoned = true;
            this.windowStart = Date.now();
            await this.player.SendPacket(new SummoningComplete(this.player.Uid));
        }
        finally {
            if (this.visit === visit)
                this.joining = false;
        }
    }
    Hit(region) {
        if (this.player.Data.mapID !== SummoningField.MAP_ID || !this.summoned || region !== 0)
            return false;
        if (this.hits >= 5)
            return true;
        const now = Date.now();
        if (now - this.windowStart >= 60000) {
            this.hits = 0;
            this.windowStart = now;
        }
        ++this.hits;
        return true;
    }
    CanChallenge(region) {
        return this.player.Data.mapID === SummoningField.MAP_ID && this.summoned && this.hits >= 5 && region === 0;
    }
    async OnVictory(event) {
        if (!event.isVictory || event.playerId !== this.player.Uid || event.extra.sptId !== 115 || !this.CanChallenge(0))
            return;
        const config = BossAbilityConfig_1.BossAbilityConfig.Instance.GetBossConfigByMapAndParam(SummoningField.MAP_ID, 0);
        const itemId = config?.spt?.rewardItemId;
        if (!itemId)
            throw new Error('Summoning first-victory reward is not configured');
        const inventory = this.player.ItemManager.ItemData;
        const release = await inventory.AcquireReward();
        const database = DatabaseManager_1.DatabaseManager.Instance;
        try {
            const granted = await database.WithConnection(async (driver) => {
                await driver.beginTransaction();
                let committed = false;
                try {
                    const key = 'boss:502:first-victory';
                    const [claim] = await driver.query('SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?', [this.player.Uid, key, 0]);
                    if (claim) {
                        await driver.commit();
                        committed = true;
                        return false;
                    }
                    const [row] = await driver.query('SELECT item_list FROM player_items WHERE owner_id = ?', [this.player.Uid]);
                    if (!row)
                        throw new Error('Summoning reward inventory missing');
                    const items = JSON.parse(row.item_list);
                    const item = items.find(entry => entry.itemId === itemId);
                    const added = !item || item.count === 0;
                    // This essence has Max=1. An already owned essence satisfies the first-victory grant.
                    if (item)
                        item.count = Math.max(1, item.count);
                    else
                        items.push({ itemId, count: 1, expireTime: 0x057E40 });
                    const claimWrite = await driver.execute('INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)', [this.player.Uid, key, 0, Math.floor(Date.now() / 1000), 1]);
                    const itemWrite = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [JSON.stringify(items), this.player.Uid]);
                    if (claimWrite.affectedRows !== 1 || itemWrite.affectedRows !== 1)
                        throw new Error('Summoning reward was not saved');
                    await driver.commit();
                    committed = true;
                    inventory.ItemList = items;
                    return added;
                }
                catch (error) {
                    if (!committed)
                        await driver.rollback();
                    throw error;
                }
            });
            if (granted)
                await this.player.SendPacket(new PacketBattleReward_1.PacketBattleReward([{ itemId, itemCnt: 1 }]));
        }
        finally {
            release();
        }
    }
}
exports.SummoningField = SummoningField;
class SummoningComplete extends BaseProto_1.BaseProto {
    userId;
    constructor(userId) {
        super(CommandID_1.CommandID.FB_GAME_OVER);
        this.userId = userId;
    }
    serialize() {
        const data = Buffer.alloc(16);
        data.writeUInt32BE(1, 0);
        data.writeUInt32BE(this.userId, 4);
        // Move off the pads before the appearance animation; these coordinates are walkable map floor.
        data.writeUInt32BE(512, 8);
        data.writeUInt32BE(420, 12);
        return data;
    }
}
//# sourceMappingURL=SummoningField.js.map