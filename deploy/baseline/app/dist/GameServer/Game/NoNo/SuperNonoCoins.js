"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperNonoCoins = void 0;
const CommitBalanceReward_1 = require("../Reward/CommitBalanceReward");
const DatabaseManager_1 = require("../../../DataBase/DatabaseManager");
const ConfigLoader_1 = require("../../../shared/config/ConfigLoader");
const ExperienceReceiver_1 = require("./ExperienceReceiver");
/** Fixed Nieo TALK_COUNT/TALK_CATE type 2001: weekly Super NoNo coin allowance. */
class SuperNonoCoins {
    player;
    constructor(player) {
        this.player = player;
    }
    Validate() {
        const data = this.player.Data;
        if (!data.superNono || !data.hasNono || !(data.nonoState & 2)) {
            throw new Error('Following Super NoNo required');
        }
    }
    async Count() {
        this.Validate();
        return DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
            const claims = await driver.query('SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?', [this.player.Uid, 'super_nono_coins', (0, ExperienceReceiver_1.ReceiverWeek)(Math.floor(Date.now() / 1000))]);
            return claims.length ? 1 : 0;
        });
    }
    async Claim() {
        this.Validate();
        const config = ConfigLoader_1.ConfigLoader.Instance.LoadJson('data/json/super_nono_coins.json');
        if (!config || !Number.isSafeInteger(config.coins) || config.coins <= 0 || config.coins > 0x7FFFFFFF) {
            throw new Error('Invalid Super NoNo coin reward configuration');
        }
        const coins = config.coins;
        await (0, CommitBalanceReward_1.CommitBalanceReward)(this.player, { coins }, async (driver, now) => {
            this.Validate();
            const week = (0, ExperienceReceiver_1.ReceiverWeek)(now);
            const claimed = await driver.query('SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?', [this.player.Uid, 'super_nono_coins', week]);
            if (claimed.length)
                throw new ExperienceReceiver_1.ReceiverAlreadyClaimed('Super NoNo coins already claimed');
            const write = await driver.execute('INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)', [this.player.Uid, 'super_nono_coins', week, now, coins]);
            if (write.affectedRows !== 1)
                throw new Error('Super NoNo coin claim was not saved');
            return () => { };
        });
        return coins;
    }
}
exports.SuperNonoCoins = SuperNonoCoins;
//# sourceMappingURL=SuperNonoCoins.js.map