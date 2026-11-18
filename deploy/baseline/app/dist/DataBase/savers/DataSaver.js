"use strict";
/**
 * 数据保存器
 * 负责将内存数据保存到数据库
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSaver = void 0;
const DatabaseManager_1 = require("../DatabaseManager");
const DataCache_1 = require("../cache/DataCache");
const DataConfig_1 = require("../config/DataConfig");
const utils_1 = require("../../shared/utils");
const PlayerDataAccessor_1 = require("../accessors/PlayerDataAccessor");
const PlayerRepository_1 = require("../repositories/Player/PlayerRepository");
const committedRow = Symbol('DataSaver.committedRow');
/**
 * 数据保存器
 */
class DataSaver {
    static _instance;
    /** 待保存的 UID 列表 */
    static ToSaveUidList = new Set();
    shutdownRequested = false;
    closed = false;
    activeSaves = new Set();
    playerRepository = new PlayerRepository_1.PlayerRepository();
    failedPlayerFields = new WeakMap();
    constructor() { }
    static get Instance() {
        if (!DataSaver._instance) {
            DataSaver._instance = new DataSaver();
        }
        return DataSaver._instance;
    }
    /**
     * 保存单个数据
     */
    async Save(type, data, throwOnError = false) {
        if (this.closed) {
            const row = JSON.stringify(DataConfig_1.DataConfigRegistry.Instance.GetConfig(type).toRow(data));
            // A delayed debounce may finish after final flush. Only an unchanged,
            // already committed snapshot can complete without another DB operation.
            if (data[committedRow] === row)
                return;
            throw new Error(`停服后数据发生变化，未保存: ${type}`);
        }
        const operation = this.SaveData(type, data, throwOnError);
        this.activeSaves.add(operation);
        try {
            await operation;
        }
        finally {
            this.activeSaves.delete(operation);
        }
    }
    async SaveData(type, data, throwOnError) {
        const config = DataConfig_1.DataConfigRegistry.Instance.GetConfig(type);
        try {
            let saved = false;
            while (!saved) {
                if (type === 'pet')
                    await data.WaitForStagedSave();
                saved = await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
                    // A staged pet save may start while this save waits for the DB connection.
                    // Release the connection before waiting again; the candidate needs it too.
                    if (type === 'pet' && data.HasStagedSave())
                        return false;
                    const row = config.toRow(data);
                    const uid = config.getUid(data);
                    // 调试日志
                    //Logger.Debug(`[DataSaver] 准备保存 ${type}Data: uid=${uid}, row=${JSON.stringify(row)}`);
                    // 检查 uid 是否有效
                    if (!uid || uid === 0) {
                        utils_1.Logger.Error(`[DataSaver] Invalid uid for ${type}Data: uid=${uid}`);
                        throw new Error(`Invalid uid: ${uid}`);
                    }
                    // 检查是否存在
                    const exists = await driver.query(`SELECT owner_id FROM ${config.tableName} WHERE owner_id = ? LIMIT 1`, [uid]);
                    //Logger.Debug(`[DataSaver] 检查结果: ${type}Data, uid=${uid}, exists=${exists.length > 0}`);
                    if (exists.length > 0) {
                        // 更新
                        if (config.saveFields) {
                            const setClause = config.saveFields.map(f => `${f} = ?`).join(', ');
                            const values = config.saveFields.map(f => row[f]);
                            values.push(uid);
                            const sql = `UPDATE ${config.tableName} SET ${setClause} WHERE owner_id = ?`;
                            // Logger.Debug(`[DataSaver] 执行 UPDATE: ${sql}`);
                            // Logger.Debug(`[DataSaver] 参数: ${JSON.stringify(values.map((v, i) => i === values.length - 1 ? v : (typeof v === 'string' && v.length > 100 ? v.substring(0, 100) + '...' : v)))}`);
                            const result = await driver.execute(sql, values);
                            //Logger.Debug(`[DataSaver] UPDATE 结果: ${JSON.stringify(result)}`);
                        }
                    }
                    else {
                        // 插入
                        if (config.saveFields) {
                            const fields = ['owner_id', ...config.saveFields];
                            const placeholders = fields.map(() => '?').join(', ');
                            const values = [uid, ...config.saveFields.map(f => row[f])];
                            await driver.execute(`INSERT INTO ${config.tableName} (${fields.join(', ')}) VALUES (${placeholders})`, values);
                        }
                    }
                    if (throwOnError || this.shutdownRequested) {
                        const fields = config.saveFields;
                        if (!fields?.length)
                            throw new Error(`缺少最终保存字段: ${type}`);
                        const persisted = await driver.query(`SELECT ${fields.join(', ')} FROM ${config.tableName} WHERE owner_id = ?`, [uid]);
                        if (!persisted[0] || fields.some(field => persisted[0][field] !== row[field])) {
                            throw new Error(`最终保存读回不一致: ${type}`);
                        }
                    }
                    // BaseData's debounce calls through its raw target, while cache saves
                    // use the Proxy. Symbol metadata is shared by both aliases; defining
                    // it does not trigger Proxy.set or schedule another autosave.
                    Object.defineProperty(data, committedRow, { value: JSON.stringify(row), configurable: true });
                    return true;
                });
            }
        }
        catch (error) {
            utils_1.Logger.Error(`[DataSaver] 保存 ${type}Data 失败`, error);
            // 显式业务保存可请求错误传播；既有自动保存调用保持原契约。
            if (throwOnError || this.shutdownRequested)
                throw error;
        }
    }
    /**
     * 批量保存所有待保存的数据
     */
    async SaveAll() {
        if (DataSaver.ToSaveUidList.size === 0)
            return;
        const uids = Array.from(DataSaver.ToSaveUidList);
        DataSaver.ToSaveUidList.clear();
        // Logger.Debug(`[DataSaver] 开始保存数据: ${uids.length} 个玩家`);
        const dataTypes = DataConfig_1.DataConfigRegistry.Instance.GetAllTypes();
        const cache = DataCache_1.DataCache.Instance;
        for (const uid of uids) {
            for (const type of dataTypes) {
                const data = cache.Get(type, uid);
                if (data) {
                    await this.Save(type, data);
                    // 清理定时器（如果有 cleanup 方法）
                    if (typeof data.cleanup === 'function') {
                        data.cleanup();
                    }
                }
            }
        }
        utils_1.Logger.Debug(`[DataSaver] 数据保存完成`);
    }
    /**
     * 保存指定用户的所有数据
     */
    async SaveUser(uid) {
        const dataTypes = DataConfig_1.DataConfigRegistry.Instance.GetAllTypes();
        const cache = DataCache_1.DataCache.Instance;
        const player = cache.Get('player', uid);
        if (player) {
            let expected;
            try {
                // Wait outside the DB queue so the wallet operation can commit and
                // publish before the final dirty-field save. No balance is recalculated.
                await player.WaitForCurrencyOperations();
                await player.WaitForExpAllocation();
                // A failed logout must retain dirty intent even if a later best-effort
                // debounce clears the model's dirty flags after a zero-row write.
                for (const field of this.failedPlayerFields.get(player) ?? [])
                    player.MarkDirty(field);
                expected = new Map(player.GetDirtyFields().map(field => [field, JSON.stringify(player[field])]));
                await PlayerDataAccessor_1.PlayerDataAccessor.Instance.Save(player);
                {
                    const reloaded = await this.playerRepository.FindByUserId(uid);
                    const columns = await this.playerRepository.GetPlayerColumnsMeta();
                    const mismatched = Array.from(expected).filter(([field, value]) => {
                        const column = field.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
                            .replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
                        if (!columns.has(column))
                            return false;
                        const actual = reloaded?.[field];
                        const normalized = typeof player[field] === 'boolean' ? Boolean(actual) : actual;
                        return !reloaded || JSON.stringify(normalized) !== value;
                    });
                    if (!reloaded || mismatched.length) {
                        for (const [field] of mismatched)
                            player.MarkDirty(field);
                        throw new Error('最终保存读回不一致: player');
                    }
                }
                player.cleanup();
                this.failedPlayerFields.delete(player);
            }
            catch (error) {
                const failed = new Set(this.failedPlayerFields.get(player));
                for (const field of expected?.keys() ?? []) {
                    failed.add(field);
                    player.MarkDirty(field);
                }
                this.failedPlayerFields.set(player, failed);
                utils_1.Logger.Error('[DataSaver] 保存 playerData 失败', error);
                throw error;
            }
        }
        for (const type of dataTypes) {
            const data = cache.Get(type, uid);
            if (data) {
                await this.Save(type, data, true);
                // 清理定时器（如果有 cleanup 方法）
                if (typeof data.cleanup === 'function') {
                    data.cleanup();
                }
            }
        }
        utils_1.Logger.Debug(`[DataSaver] 用户数据已保存: uid=${uid}`);
    }
    BeginShutdown() { this.shutdownRequested = true; }
    Resume() {
        if (this.activeSaves.size)
            throw new Error('数据保存仍在进行，不能恢复服务');
        this.shutdownRequested = false;
        this.closed = false;
    }
    /** Called after request and logout producers have stopped. */
    async FlushForShutdown() {
        this.BeginShutdown();
        await this.WaitForSaves();
        const cache = DataCache_1.DataCache.Instance;
        const types = DataConfig_1.DataConfigRegistry.Instance.GetAllTypes();
        const uids = new Set();
        for (const uid of cache.GetCache('player').keys())
            uids.add(uid);
        for (const type of types)
            for (const uid of cache.GetCache(type).keys())
                uids.add(uid);
        // Final flush is independent of the legacy pending-UID list.
        for (const uid of uids)
            await this.SaveUser(uid);
        await this.WaitForSaves();
        this.closed = true;
        DataSaver.ToSaveUidList.clear();
    }
    async WaitForSaves() {
        while (this.activeSaves.size) {
            await Promise.all(Array.from(this.activeSaves));
        }
    }
}
exports.DataSaver = DataSaver;
//# sourceMappingURL=DataSaver.js.map