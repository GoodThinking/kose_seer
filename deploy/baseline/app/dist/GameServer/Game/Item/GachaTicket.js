"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GachaTicket = exports.GachaTicketAlreadyClaimed = void 0;
exports.GachaTicketDay = GachaTicketDay;
const DatabaseManager_1 = require("../../../DataBase/DatabaseManager");
/** Unix second of the Beijing midnight that starts the day containing the timestamp. */
function GachaTicketDay(unixSeconds = Math.floor(Date.now() / 1000)) {
    return Math.floor((unixSeconds + 28800) / 86400) * 86400 - 28800;
}
class GachaTicketAlreadyClaimed extends Error {
}
exports.GachaTicketAlreadyClaimed = GachaTicketAlreadyClaimed;
const TICKET_ITEM = 400501, TICKET_COUNT = 2, REWARD_KEY = 'gacha:ticket';
/** The observation deck's native daily claim (type 2051): two gacha tickets per Beijing day. */
class GachaTicket {
    player;
    constructor(player) {
        this.player = player;
    }
    Validate() {
        if (this.player.Data.mapID !== 103 || this.player.Data.actionType === 1) {
            throw new Error('Gacha tickets require map 103 and non-busy state');
        }
    }
    async Count() {
        this.Validate();
        return DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
            const rows = await driver.query('SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?', [this.player.Uid, REWARD_KEY, GachaTicketDay()]);
            return rows.length ? rows[0].amount : 0;
        });
    }
    async Claim() {
        this.Validate();
        const inventory = this.player.ItemManager.ItemData;
        const release = await inventory.AcquireReward();
        try {
            this.Validate();
            return await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
                await driver.beginTransaction();
                let committed = false;
                try {
                    const now = Math.floor(Date.now() / 1000), day = GachaTicketDay(now);
                    const [claim] = await driver.query('SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?', [this.player.Uid, REWARD_KEY, day]);
                    if (claim && claim.amount >= 1)
                        throw new GachaTicketAlreadyClaimed('Daily gacha tickets already claimed');
                    const [row] = await driver.query('SELECT item_list FROM player_items WHERE owner_id = ?', [this.player.Uid]);
                    if (!row)
                        throw new Error('Inventory missing');
                    const items = JSON.parse(row.item_list);
                    const item = items.find(entry => entry.itemId === TICKET_ITEM);
                    if (item) {
                        if (!Number.isSafeInteger(item.count) || item.count < 0 || item.count + TICKET_COUNT > 0xffffffff) {
                            throw new Error('Inventory count out of range');
                        }
                        item.count += TICKET_COUNT;
                    }
                    else {
                        items.push({ itemId: TICKET_ITEM, count: TICKET_COUNT, expireTime: 0x057E40 });
                    }
                    const quotaWrite = claim
                        ? await driver.execute('UPDATE receiver_claims SET amount = ?, claimed_at = ? WHERE owner_id = ? AND reward_key = ? AND period_start = ? AND amount = ?', [claim.amount + 1, now, this.player.Uid, REWARD_KEY, day, claim.amount])
                        : await driver.execute('INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)', [this.player.Uid, REWARD_KEY, day, now, 1]);
                    const itemWrite = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [JSON.stringify(items), this.player.Uid]);
                    if (quotaWrite.affectedRows !== 1 || itemWrite.affectedRows !== 1)
                        throw new Error('Gacha tickets were not saved');
                    await driver.commit();
                    committed = true;
                    inventory.ItemList = items;
                    return { itemId: TICKET_ITEM, count: TICKET_COUNT };
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
}
exports.GachaTicket = GachaTicket;
//# sourceMappingURL=GachaTicket.js.map