"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAnalyzer = exports.AnalyzerAlreadyClaimed = void 0;
exports.AnalyzerMonth = AnalyzerMonth;
const DatabaseManager_1 = require("../../../DataBase/DatabaseManager");
function AnalyzerMonth(unixSeconds = Math.floor(Date.now() / 1000)) {
    const d = new Date((unixSeconds + 28800) * 1000);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    return Math.floor(Date.UTC(year, month, 1) / 1000) - 28800;
}
class AnalyzerAlreadyClaimed extends Error {
}
exports.AnalyzerAlreadyClaimed = AnalyzerAlreadyClaimed;
class SuperAnalyzer {
    player;
    constructor(player) {
        this.player = player;
    }
    Validate(type) {
        if (type !== 1501 && type !== 2101) {
            throw new Error('Unsupported analyzer type');
        }
        if (this.player.Data.mapID !== 107 || this.player.Data.actionType === 1) {
            throw new Error('Super analyzer requires map 107 and non-busy state');
        }
        if (!this.player.Data.hasNono || !(this.player.Data.nonoState & 2)) {
            throw new Error('Following NoNo required');
        }
        if (type === 2101 && !this.player.Data.superNono) {
            throw new Error('Super NoNo required');
        }
    }
    async Count(type) {
        this.Validate(type);
        return DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
            const rows = await driver.query('SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?', [this.player.Uid, 'analyzer:capsule', AnalyzerMonth()]);
            return rows.length ? (rows[0].amount ?? 1) : 0;
        });
    }
    async Claim(type) {
        this.Validate(type);
        const itemId = type === 2101 ? 300007 : 300003;
        const inventory = this.player.ItemManager.ItemData;
        const release = await inventory.AcquireReward();
        try {
            this.Validate(type);
            return await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
                await driver.beginTransaction();
                let committed = false;
                try {
                    const now = Math.floor(Date.now() / 1000);
                    const month = AnalyzerMonth(now);
                    const key = 'analyzer:capsule';
                    const [claim] = await driver.query('SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?', [this.player.Uid, key, month]);
                    if (claim && claim.amount >= 1) {
                        throw new AnalyzerAlreadyClaimed('Monthly capsule already claimed');
                    }
                    const [row] = await driver.query('SELECT item_list FROM player_items WHERE owner_id = ?', [this.player.Uid]);
                    if (!row)
                        throw new Error('Inventory missing');
                    const items = JSON.parse(row.item_list);
                    const item = items.find(entry => entry.itemId === itemId);
                    if (item) {
                        if (!Number.isSafeInteger(item.count) || item.count < 0 || item.count + 1 > 0xffffffff) {
                            throw new Error('Inventory count out of range');
                        }
                        item.count += 1;
                    }
                    else {
                        items.push({ itemId, count: 1, expireTime: 0x057E40 });
                    }
                    const quotaWrite = claim
                        ? await driver.execute('UPDATE receiver_claims SET amount = ?, claimed_at = ? WHERE owner_id = ? AND reward_key = ? AND period_start = ? AND amount = ?', [claim.amount + 1, now, this.player.Uid, key, month, claim.amount])
                        : await driver.execute('INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)', [this.player.Uid, key, month, now, 1]);
                    const itemWrite = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [JSON.stringify(items), this.player.Uid]);
                    if (quotaWrite.affectedRows !== 1 || itemWrite.affectedRows !== 1) {
                        throw new Error('Capsule reward was not saved');
                    }
                    await driver.commit();
                    committed = true;
                    inventory.ItemList = items;
                    return { itemId, count: 1 };
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
exports.SuperAnalyzer = SuperAnalyzer;
//# sourceMappingURL=SuperAnalyzer.js.map