"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GROUP = void 0;
exports.IsMutating = IsMutating;
exports.Catalog = Catalog;
exports.Slots = Slots;
exports.ApplyStats = ApplyStats;
exports.BattlePet = BattlePet;
exports.Skill = Skill;
exports.Snapshot = Snapshot;
exports.Operate = Operate;
exports.Handle = Handle;
const DatabaseManager_1 = require("../../../DataBase/DatabaseManager");
const ConfigLoader_1 = require("../../../shared/config/ConfigLoader");
const PetCalculator_1 = require("./PetCalculator");
const BaseProto_1 = require("../../../shared/proto/base/BaseProto");
const Logger_1 = require("../../../shared/utils/Logger");
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
const CommandID_1 = require("../../../shared/protocol/CommandID");
exports.GROUP = 900002;
function IsMutating(player) { return !!player.CountermarkMutation; }
const TABLE = 'CREATE TABLE IF NOT EXISTS player_countermarks (owner_id INTEGER NOT NULL, mark_id INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(owner_id, mark_id))';
class Rejected extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
function Catalog() {
    const marks = ConfigLoader_1.ConfigLoader.Instance.LoadJson('data/json/countermarks.json')?.marks;
    if (!Array.isArray(marks) || new Set(marks.map(m => m.id)).size !== marks.length)
        throw Error('Invalid countermark catalog');
    for (const m of marks) {
        if (!Number.isSafeInteger(m.id) || m.id <= 0 || !['ability', 'skill'].includes(m.kind) || !Number.isSafeInteger(m.price) || m.price <= 0)
            throw Error('Invalid countermark');
        for (const key of ['hp', 'atk', 'def', 'spAtk', 'spDef', 'speed', 'power', 'priority'])
            if (m[key] !== undefined && (!Number.isSafeInteger(m[key]) || m[key] < 0))
                throw Error('Invalid countermark stat');
    }
    return marks;
}
function Slots(pet) { return { ability: pet.countermarks?.ability || 0, skill: pet.countermarks?.skill || 0 }; }
function ApplyStats(pet, stats) {
    const id = Slots(pet).ability;
    if (!id)
        return stats;
    const mark = Catalog().find(m => m.id === id && m.kind === 'ability');
    if (!mark || pet.level < mark.minLevel)
        return stats;
    const result = { ...stats, maxHp: stats.maxHp + (mark.hp || 0) };
    for (const key of ['atk', 'def', 'spAtk', 'spDef', 'speed'])
        result[key] = stats[key] + (mark[key] || 0);
    result.hp = Math.min(result.maxHp, Math.max(0, pet.hp));
    return result;
}
function BattlePet(pet) {
    const copy = { ...pet };
    PetCalculator_1.PetCalculator.UpdatePetStats(copy);
    return copy;
}
/** Return a per-actor copy; the shared skill registry and the opposing pet are untouched. */
function Skill(pet, skill) {
    const id = pet.countermarks?.skill || 0;
    if (!id)
        return skill;
    const mark = Catalog().find(m => m.id === id && m.kind === 'skill');
    if (!mark || pet.level < mark.minLevel || mark.moveId !== skill.id || (mark.petIds?.length && !mark.petIds.includes(pet.petId)))
        return skill;
    return { ...skill, power: skill.power + (mark.power || 0), priority: (skill.priority || 0) + (mark.priority || 0) };
}
function esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c])); }
function attrs(value) { return Object.entries(value).filter(([, v]) => !Array.isArray(v)).map(([k, v]) => `${k}="${esc(v)}"`).join(' '); }
async function Snapshot(player, error = 0, message = '') {
    const db = DatabaseManager_1.DatabaseManager.Instance;
    const inventory = await db.WithConnection(async (d) => { await d.execute(TABLE); return d.query('SELECT mark_id, count FROM player_countermarks WHERE owner_id = ? ORDER BY mark_id', [player.Uid]); });
    return `<countermarks ${attrs({ coins: player.Data.coins, error, message })}><catalog>${Catalog().map(m => `<mark ${attrs({ ...m, hp: m.hp || 0, atk: m.atk || 0, def: m.def || 0, spAtk: m.spAtk || 0, spDef: m.spDef || 0, speed: m.speed || 0, petIds: m.petIds?.join(',') || '' })}/>`).join('')}</catalog><inventory>${inventory.map((m) => `<mark ${attrs({ id: m.mark_id, count: m.count })}/>`).join('')}</inventory><pets>${player.PetManager.PetData.PetList.map((p) => `<pet ${attrs({ catchTime: p.catchTime, id: p.petId, name: p.nick || GameConfig_1.GameConfig.GetPetById(p.petId)?.DefName || String(p.petId), level: p.level, inBag: p.isInBag ? 1 : 0, ...Slots(p), ...PetCalculator_1.PetCalculator.CalculateStatsFromPet(p) })}/>`).join('')}</pets></countermarks>`;
}
async function Operate(player, op, catchTime, markId, slot) {
    if (![0, 1, 2, 3].includes(op))
        throw new Rejected(5001, '无效操作');
    if (!op)
        return;
    const pets = player.PetManager.PetData, release = await pets.AcquireMutation();
    let gate, recovery;
    try {
        await pets.WaitForStagedSave();
        await player.Data.WaitForExpAllocation();
        await player.Data.WaitForCurrencyOperations();
        if (player.Session.Socket.destroyed || player.Session.Player !== player)
            throw new Rejected(5001, '会话已失效');
        if (player.BattleManager.GetCurrentBattle())
            throw new Rejected(5001, '战斗中不能更改刻印');
        recovery = player.BattleManager.BeginOutOfBattleRecovery();
        if (!recovery)
            throw new Rejected(5001, '战斗或恢复操作处理中');
        gate = player.Data.BeginBalanceReward();
        player.CountermarkMutation = true;
        const marks = Catalog(), mark = marks.find(m => m.id === markId);
        if (op !== 3 && !mark)
            throw new Rejected(5001, '未知刻印');
        if ((op === 2 || op === 3) && slot !== 0 && slot !== 1)
            throw new Rejected(5001, '无效刻印孔');
        const field = slot === 0 ? 'ability' : 'skill';
        const staged = pets.PetList.map((p) => p.catchTime === catchTime ? { ...p, countermarks: Slots(p) } : p);
        const target = staged.find((p) => p.catchTime === catchTime);
        if (op !== 1 && (!target || target.userId !== player.Uid))
            throw new Rejected(5001, '精灵不属于当前用户');
        if (op === 2 && (target.level < mark.minLevel || mark.kind !== field || (mark.petIds?.length && !mark.petIds.includes(target.petId))))
            throw new Rejected(5001, '刻印与精灵或孔位不匹配');
        const db = DatabaseManager_1.DatabaseManager.Instance;
        const transaction = async () => db.WithConnection(async (d) => {
            await d.execute(TABLE);
            await d.beginTransaction();
            try {
                const [wallet] = await d.query('SELECT coins,gold,allocatable_exp FROM players WHERE user_id = ?', [player.Uid]);
                const [stored] = await d.query('SELECT pet_list FROM player_pets WHERE owner_id = ?', [player.Uid]);
                if (!wallet || !stored)
                    throw Error('Countermark player missing');
                const keys = ['coins', 'gold', 'allocatableExp'], old = [wallet.coins, wallet.gold, wallet.allocatable_exp], dirty = player.Data.GetDirtyFields();
                const balance = keys.map((key, i) => { if (!dirty.includes(key) && player.Data[key] !== old[i])
                    throw Error('Countermark wallet stale'); return dirty.includes(key) ? player.Data[key] : old[i]; });
                if (balance.some(n => !Number.isSafeInteger(n) || n < 0 || n > 0x7fffffff))
                    throw Error('Invalid wallet');
                const inventory = await d.query('SELECT mark_id,count FROM player_countermarks WHERE owner_id = ?', [player.Uid]);
                const count = (id) => inventory.find(m => m.mark_id === id)?.count || 0;
                const set = async (id, n) => { if (inventory.some(m => m.mark_id === id))
                    await d.execute('UPDATE player_countermarks SET count = ? WHERE owner_id = ? AND mark_id = ?', [n, player.Uid, id]);
                else
                    await d.execute('INSERT INTO player_countermarks(owner_id,mark_id,count) VALUES(?,?,?)', [player.Uid, id, n]); };
                if (op === 1) {
                    if (balance[0] < mark.price)
                        throw new Rejected(10016, '赛尔豆不足');
                    balance[0] -= mark.price;
                    await set(markId, count(markId) + 1);
                }
                else {
                    const previous = target.countermarks[field];
                    if (op === 2 && previous === markId)
                        throw new Rejected(5001, '该刻印已装备');
                    if (op === 2 && count(markId) < 1)
                        throw new Rejected(5001, '未拥有该刻印');
                    if (op === 3 && !previous)
                        throw new Rejected(5001, '该孔未装备刻印');
                    if (previous)
                        await set(previous, count(previous) + 1);
                    if (op === 2)
                        await set(markId, count(markId) - 1);
                    target.countermarks[field] = op === 2 ? markId : 0;
                    PetCalculator_1.PetCalculator.UpdatePetStats(target);
                    const write = await d.execute('UPDATE player_pets SET pet_list = ? WHERE owner_id = ? AND pet_list = ?', [JSON.stringify(staged), player.Uid, stored.pet_list]);
                    if (write.affectedRows !== 1)
                        throw Error('Concurrent pet update');
                }
                const write = await d.execute('UPDATE players SET coins = ?,gold = ?,allocatable_exp = ? WHERE user_id = ? AND coins = ? AND gold = ? AND allocatable_exp = ?', [...balance, player.Uid, ...old]);
                if (write.affectedRows !== 1)
                    throw Error('Concurrent wallet update');
                await d.commit();
                gate.publish(...balance);
            }
            catch (error) {
                await d.rollback();
                throw error;
            }
        });
        if (op === 1)
            await transaction();
        else
            await pets.CommitPetUpdate(pets.PetList.find((p) => p.catchTime === catchTime), target, transaction);
    }
    finally {
        player.CountermarkMutation = false;
        gate?.release();
        recovery?.release();
        release();
    }
}
class Packet extends BaseProto_1.BaseProto {
    xml;
    error;
    constructor(xml, error) {
        super(CommandID_1.CommandID.PET_COLLECT);
        this.xml = xml;
        this.error = error;
    }
    serialize() { const head = Buffer.alloc(8); head.writeUInt32BE(exports.GROUP); head.writeUInt32BE(this.error, 4); return Buffer.concat([head, Buffer.from(this.xml, 'utf8')]); }
}
async function Handle(player, body) {
    let code = 0, message = '';
    try {
        if (body.length !== 20 || body.readUInt32BE(0) !== exports.GROUP)
            throw new Rejected(5001, '刻印请求必须为20字节');
        await Operate(player, body.readUInt32BE(4), body.readUInt32BE(8), body.readUInt32BE(12), body.readUInt32BE(16));
    }
    catch (error) {
        if (!(error instanceof Rejected))
            Logger_1.Logger.Error('[Countermarks] Operation failed', error);
        code = error instanceof Rejected ? error.code : 5000;
        message = error instanceof Rejected ? error.message : '刻印操作失败';
    }
    await player.SendPacket(new Packet(await Snapshot(player, code, message), code));
}
