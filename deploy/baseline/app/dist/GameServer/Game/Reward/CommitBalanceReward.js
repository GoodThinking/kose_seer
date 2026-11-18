"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitBalanceReward = CommitBalanceReward;
const DatabaseManager_1 = require("../../../DataBase/DatabaseManager");
/** Caller provides the durable claim/task write; both it and balances commit together. */
async function CommitBalanceReward(player, reward, record) {
    const amounts = [reward.coins ?? 0, reward.gold ?? 0, reward.experience ?? 0];
    if (amounts.some(n => !Number.isSafeInteger(n) || n < 0 || n > 0x7FFFFFFF)) {
        throw new Error('Invalid balance reward');
    }
    const releaseInventory = await player.ItemManager.ItemData.AcquireReward();
    let gate;
    try {
        await player.Data.WaitForExpAllocation();
        await player.Data.WaitForCurrencyOperations();
        gate = player.Data.BeginBalanceReward();
        const held = gate;
        await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
            await driver.beginTransaction();
            let committed = false;
            try {
                const rows = await driver.query('SELECT coins, gold, allocatable_exp FROM players WHERE user_id = ?', [player.Uid]);
                if (!rows[0])
                    throw new Error('Reward player missing');
                const keys = ['coins', 'gold', 'allocatableExp'];
                const stored = [rows[0].coins, rows[0].gold, rows[0].allocatable_exp];
                const dirty = player.Data.GetDirtyFields();
                const balances = keys.map((key, i) => {
                    const cached = player.Data[key];
                    if (!dirty.includes(key) && cached !== stored[i])
                        throw new Error('Reward wallet cache is stale');
                    const base = dirty.includes(key) ? cached : stored[i];
                    const result = base + amounts[i];
                    if (!Number.isSafeInteger(base) || base < 0 || !Number.isSafeInteger(result) || result > 0x7FFFFFFF) {
                        throw new Error('Reward balance out of range');
                    }
                    return result;
                });
                const publish = await record(driver, Math.floor(Date.now() / 1000));
                const write = await driver.execute('UPDATE players SET coins = ?, gold = ?, allocatable_exp = ? WHERE user_id = ?', [...balances, player.Uid]);
                if (write.affectedRows !== 1)
                    throw new Error('Reward player disappeared');
                await driver.commit();
                committed = true;
                // Both publications happen synchronously while the connection is still owned.
                held.publish(balances[0], balances[1], balances[2]);
                publish();
            }
            catch (error) {
                if (!committed)
                    await driver.rollback();
                throw error;
            }
        });
    }
    finally {
        gate?.release();
        releaseInventory();
    }
}
//# sourceMappingURL=CommitBalanceReward.js.map