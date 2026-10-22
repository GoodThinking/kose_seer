"use strict";
// 北斗七星殿前四道封印（2012-05/06 的 4399、7k7k 攻略）。实验室客户端走 2313/2311 的 900003 组：
//   贪狼：每天解除一次，得火星灵精元。
//   巨门：每次 50000 赛尔豆，每天最多 2 次，解除 4 次得水星灵的精元。
//   禄存：挑战守护者芙洛（733/0 的 BOSS），首胜由 SPT 发飞星灵的精元；本模块只读进度。
//   文曲：开始解除后等 72 小时，得冰星灵的精元。
// 进度记在 receiver_claims：beidou:1 每个北京日一行；beidou:2 每次解除一行，period = 当日起点 + 当日序号；
// beidou:2r 记巨门精元已发；beidou:4s 记开始时间，beidou:4 记领取。发精元失败时记录不留，下次点击重发。
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandleStatus = HandleStatus;
exports.HandleAction = HandleAction;
exports.CountClaims = CountClaims;
const DatabaseManager_1 = require("../../../DataBase/DatabaseManager");
const CommandID_1 = require("../../../shared/protocol/CommandID");
const BaseProto_1 = require("../../../shared/proto/base/BaseProto");
const Logger_1 = require("../../../shared/utils/Logger");
const ItemSystem_1 = require("../Item/ItemSystem");
const EventTypes_1 = require("../Event/EventTypes");
const GROUP = 900003;
const TANLANG = { key: 'beidou:1', item: 400315 };
const JUMEN = { key: 'beidou:2', reward: 'beidou:2r', item: 400318, cost: 50000, perDay: 2, total: 4 };
const LUCUN_SPT = 66;
const WENQU = { start: 'beidou:4s', key: 'beidou:4', item: 400336, wait: 72 * 3600 };
const ERROR = { ORDER: 1, TODAY: 2, COINS: 3, DONE: 4, WAIT: 5, FULL: 6, FAILED: 7 };
class Rejected extends Error {
    constructor(code) {
        super('Beidou seal rejected: ' + code);
        this.code = code;
    }
}
class Packet extends BaseProto_1.BaseProto {
    constructor(command, values) {
        super(command);
        this.values = values;
    }
    serialize() {
        const body = Buffer.alloc(this.values.length * 4);
        this.values.forEach((n, i) => body.writeUInt32BE(n >>> 0, i * 4));
        return body;
    }
}
const dayStart = now => Math.floor((now + 8 * 3600) / 86400) * 86400 - 8 * 3600;
const busy = new Set();
async function claims(uid) {
    return DatabaseManager_1.DatabaseManager.Instance.WithConnection(driver => driver.query("SELECT reward_key, period_start, claimed_at FROM receiver_claims WHERE owner_id = ? AND reward_key LIKE 'beidou:%'", [uid]));
}
async function CountClaims(uid, key) {
    const [row] = await DatabaseManager_1.DatabaseManager.Instance.WithConnection(driver => driver.query('SELECT COUNT(*) AS n FROM receiver_claims WHERE owner_id = ? AND reward_key = ?', [uid, key]));
    return Number(row.n);
}
function progress(player, rows, now) {
    const today = dayStart(now);
    const of = key => rows.filter(row => row.reward_key === key);
    const jumen = of(JUMEN.key);
    const started = of(WENQU.start)[0];
    return {
        tanlangDays: of(TANLANG.key).length,
        tanlangToday: of(TANLANG.key).some(row => Number(row.period_start) === today) ? 1 : 0,
        jumen: jumen.length,
        jumenToday: jumen.filter(row => Number(row.period_start) >= today && Number(row.period_start) < today + JUMEN.perDay).length,
        jumenReward: of(JUMEN.reward).length ? 1 : 0,
        lucun: player.ChallengeProgressManager.HasDefeatedSPTBoss(LUCUN_SPT) ? 1 : 0,
        wenquStart: started ? Number(started.claimed_at) : 0,
        wenqu: of(WENQU.key).length ? 1 : 0,
    };
}
async function HandleStatus(player) {
    const now = Math.floor(Date.now() / 1000);
    const p = progress(player, await claims(player.Uid), now);
    await player.SendPacket(new Packet(CommandID_1.CommandID.IS_COLLECT, [GROUP, p.tanlangDays, p.tanlangToday, p.jumen, p.jumenToday, p.lucun, p.wenquStart, p.wenqu, now]));
}
async function insertClaim(driver, uid, key, period, now) {
    const write = await driver.execute('INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)', [uid, key, period, now, 1]);
    if (write.affectedRows !== 1)
        throw new Error('Beidou claim was not saved');
}
async function grant(player, key, period, item) {
    if (player.ItemManager.GetItemCount(item) >= ItemSystem_1.ItemSystem.GetMaxStack(item))
        throw new Rejected(ERROR.FULL);
    const now = Math.floor(Date.now() / 1000);
    await DatabaseManager_1.DatabaseManager.Instance.WithConnection(driver => insertClaim(driver, player.Uid, key, period, now));
    if (!await player.ItemManager.GiveItem(item, 1, EventTypes_1.ItemGainSource.GIVE)) {
        await DatabaseManager_1.DatabaseManager.Instance.WithConnection(driver => driver.execute('DELETE FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?', [player.Uid, key, period]));
        throw new Rejected(ERROR.FAILED);
    }
    return item;
}
/** 巨门：扣 50000 赛尔豆与记录同一事务提交，钱包按每日签到的方式校验缓存。 */
async function payJumen(player, period) {
    await player.Data.WaitForExpAllocation();
    await player.Data.WaitForCurrencyOperations();
    const wallet = player.Data.BeginBalanceReward();
    try {
        await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
            await driver.beginTransaction();
            try {
                const [stored] = await driver.query('SELECT coins, gold, allocatable_exp FROM players WHERE user_id = ?', [player.Uid]);
                if (!stored)
                    throw new Error('Beidou player missing');
                const keys = ['coins', 'gold', 'allocatableExp'];
                const previous = [stored.coins, stored.gold, stored.allocatable_exp];
                const dirty = player.Data.GetDirtyFields();
                const balance = keys.map((key, i) => {
                    const cached = player.Data[key];
                    if (!dirty.includes(key) && cached !== previous[i])
                        throw new Error('Beidou wallet cache stale');
                    return dirty.includes(key) ? cached : previous[i];
                });
                if (balance[0] < JUMEN.cost)
                    throw new Rejected(ERROR.COINS);
                balance[0] -= JUMEN.cost;
                const walletWrite = await driver.execute('UPDATE players SET coins = ?, gold = ?, allocatable_exp = ? WHERE user_id = ?', [...balance, player.Uid]);
                if (walletWrite.affectedRows !== 1)
                    throw new Error('Beidou wallet was not saved');
                await insertClaim(driver, player.Uid, JUMEN.key, period, Math.floor(Date.now() / 1000));
                await driver.commit();
                wallet.publish(balance[0], balance[1], balance[2]);
            }
            catch (error) {
                await driver.rollback();
                throw error;
            }
        });
    }
    finally {
        wallet.release();
    }
}
async function act(player, seal) {
    const now = Math.floor(Date.now() / 1000);
    const today = dayStart(now);
    const p = progress(player, await claims(player.Uid), now);
    if (seal === 1) {
        if (p.tanlangToday)
            throw new Rejected(ERROR.TODAY);
        return grant(player, TANLANG.key, today, TANLANG.item);
    }
    if (seal === 2) {
        if (!p.tanlangDays)
            throw new Rejected(ERROR.ORDER);
        if (p.jumen >= JUMEN.total) {
            if (p.jumenReward)
                throw new Rejected(ERROR.DONE);
            return grant(player, JUMEN.reward, 0, JUMEN.item);
        }
        if (p.jumenToday >= JUMEN.perDay)
            throw new Rejected(ERROR.TODAY);
        await payJumen(player, today + p.jumenToday);
        return p.jumen + 1 < JUMEN.total ? 0 : grant(player, JUMEN.reward, 0, JUMEN.item);
    }
    if (seal === 4) {
        if (!p.lucun)
            throw new Rejected(ERROR.ORDER);
        if (p.wenqu)
            throw new Rejected(ERROR.DONE);
        if (!p.wenquStart) {
            await DatabaseManager_1.DatabaseManager.Instance.WithConnection(driver => insertClaim(driver, player.Uid, WENQU.start, 0, now));
            return 0;
        }
        if (now - p.wenquStart < WENQU.wait)
            throw new Rejected(ERROR.WAIT);
        return grant(player, WENQU.key, 0, WENQU.item);
    }
    throw new Rejected(ERROR.FAILED);
}
async function HandleAction(player, seal) {
    let item = 0, error = 0;
    if (busy.has(player.Uid)) {
        error = ERROR.FAILED;
    }
    else {
        busy.add(player.Uid);
        try {
            item = await act(player, seal);
        }
        catch (failure) {
            error = failure instanceof Rejected ? failure.code : ERROR.FAILED;
            if (!(failure instanceof Rejected))
                Logger_1.Logger.Error('[BeidouSeals] Action failed', failure);
        }
        finally {
            busy.delete(player.Uid);
        }
    }
    await player.SendPacket(new Packet(CommandID_1.CommandID.PET_COLLECT, [GROUP, seal, error, item, player.Data.coins]));
}
