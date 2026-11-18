"use strict";
/**
 * 数据加载器
 * 负责从数据库加载数据到内存
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataLoader = void 0;
const DatabaseManager_1 = require("../DatabaseManager");
const DataCache_1 = require("../cache/DataCache");
const DataConfig_1 = require("../config/DataConfig");
const utils_1 = require("../../shared/utils");
/**
 * 数据加载器
 */
class DataLoader {
    static _instance;
    constructor() { }
    static get Instance() {
        if (!DataLoader._instance) {
            DataLoader._instance = new DataLoader();
        }
        return DataLoader._instance;
    }
    /**
     * 获取或创建数据实例
     */
    async GetOrCreate(type, uid) {
        const cache = DataCache_1.DataCache.Instance;
        // 先从缓存获取
        if (cache.Has(type, uid)) {
            return cache.Get(type, uid);
        }
        const config = DataConfig_1.DataConfigRegistry.Instance.GetConfig(type);
        // 从数据库加载
        try {
            const rows = await DatabaseManager_1.DatabaseManager.Instance.Query(`SELECT * FROM ${config.tableName} WHERE owner_id = ? LIMIT 1`, [uid]);
            let data;
            if (rows.length > 0) {
                data = config.dataClass.FromRow(rows[0]);
            }
            else {
                // 创建新数据
                data = new config.dataClass(uid);
                // 新数据需要立即保存
                await this._saveNew(type, data);
            }
            // 缓存
            cache.Set(type, uid, data);
            return data;
        }
        catch (error) {
            utils_1.Logger.Error(`[DataLoader] 加载 ${type}Data 失败: uid=${uid}`, error);
            // 出错时创建空数据并缓存
            const data = new config.dataClass(uid);
            cache.Set(type, uid, data);
            return data;
        }
    }
    /**
     * 获取数据实例（不创建新的）
     */
    Get(type, uid) {
        return DataCache_1.DataCache.Instance.Get(type, uid);
    }
    /**
     * 保存新创建的数据
     */
    async _saveNew(type, data) {
        const config = DataConfig_1.DataConfigRegistry.Instance.GetConfig(type);
        const row = config.toRow(data);
        const uid = config.getUid(data);
        utils_1.Logger.Debug(`[DataLoader] 准备新建 ${type}Data: uid=${uid}`);
        try {
            if (config.saveFields) {
                const fields = ['owner_id', ...config.saveFields];
                const placeholders = fields.map(() => '?').join(', ');
                const values = [uid, ...config.saveFields.map(f => row[f])];
                utils_1.Logger.Debug(`[DataLoader] INSERT SQL: INSERT INTO ${config.tableName} (${fields.join(', ')}) VALUES (${placeholders}), values=${JSON.stringify(values)}`);
                await DatabaseManager_1.DatabaseManager.Instance.Execute(`INSERT INTO ${config.tableName} (${fields.join(', ')}) VALUES (${placeholders})`, values);
            }
            utils_1.Logger.Info(`[DataLoader] 新建 ${type}Data 成功: uid=${uid}`);
        }
        catch (error) {
            utils_1.Logger.Error(`[DataLoader] 保存新 ${type}Data 失败: uid=${uid}`, error);
            throw error; // 重新抛出错误，让调用者知道失败了
        }
    }
}
exports.DataLoader = DataLoader;
//# sourceMappingURL=DataLoader.js.map