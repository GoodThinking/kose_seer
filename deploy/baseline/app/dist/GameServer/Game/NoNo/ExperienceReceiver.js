"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperienceReceiver = exports.ReceiverAlreadyClaimed = void 0;
exports.ReceiverWeek = ReceiverWeek;
const CommitBalanceReward_1 = require("../Reward/CommitBalanceReward");
const DatabaseManager_1 = require("../../../DataBase/DatabaseManager");
const ConfigLoader_1 = require("../../../shared/config/ConfigLoader");
/** User-approved private-server rule: shared weekly claim, Monday 00:00 Asia/Shanghai. */
function ReceiverWeek(unixSeconds) {
    return Math.floor((unixSeconds + 28800 + 259200) / 604800) * 604800 - 259200 - 28800;
}
class ReceiverAlreadyClaimed extends Error {
}
exports.ReceiverAlreadyClaimed = ReceiverAlreadyClaimed;
class ExperienceReceiver {
    player;
    constructor(player) {
        this.player = player;
    }
    ValidateType(type) {
        if (type !== 1004 && type !== 2002)
            throw new Error('Unsupported receiver type');
        if (type === 2002 && !this.player.Data.superNono)
            throw new Error('Super NoNo required');
    }
    async Count(type) {
        this.ValidateType(type);
        return DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
            const rows = await driver.query('SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?', [this.player.Uid, 'experience', ReceiverWeek(Math.floor(Date.now() / 1000))]);
            return rows.length ? 1 : 0;
        });
    }
    async Claim(type) {
        this.ValidateType(type);
        if (!this.player.Data.hasNono || !(this.player.Data.nonoState & 2))
            throw new Error('Following NoNo required');
        const config = ConfigLoader_1.ConfigLoader.Instance.LoadJson('data/json/experience_receiver.json');
        if (!config || !Number.isSafeInteger(config.experience) || config.experience <= 0) {
            throw new Error('Invalid receiver reward configuration');
        }
        const experience = config.experience;
        await (0, CommitBalanceReward_1.CommitBalanceReward)(this.player, { experience }, async (driver, now) => {
            const week = ReceiverWeek(now);
            const claimed = await driver.query('SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?', [this.player.Uid, 'experience', week]);
            if (claimed.length)
                throw new ReceiverAlreadyClaimed('Receiver already claimed');
            const write = await driver.execute('INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)', [this.player.Uid, 'experience', week, now, experience]);
            if (write.affectedRows !== 1)
                throw new Error('Receiver claim was not saved');
            return () => { };
        });
        return experience;
    }
}
exports.ExperienceReceiver = ExperienceReceiver;
//# sourceMappingURL=ExperienceReceiver.js.map