"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengeProgressDataAccessor = void 0;
const DatabaseManager_1 = require("../DatabaseManager");
const ChallengeProgressData_1 = require("../models/ChallengeProgressData");
const Logger_1 = require("../../shared/utils/Logger");
/**
 * 挑战进度数据访问器
 * 负责挑战进度数据的数据库操作和缓存管理
 */
class ChallengeProgressDataAccessor {
    static _instance;
    _cache = new Map();
    constructor() { }
    static get Instance() {
        if (!ChallengeProgressDataAccessor._instance) {
            ChallengeProgressDataAccessor._instance = new ChallengeProgressDataAccessor();
        }
        return ChallengeProgressDataAccessor._instance;
    }
    /**
     * 获取或创建挑战进度数据
     */
    async GetOrCreate(uid) {
        // 1. 检查缓存
        if (this._cache.has(uid)) {
            return this._cache.get(uid);
        }
        // 2. 从数据库加载
        const data = await this.Load(uid);
        // 3. 缓存
        this._cache.set(uid, data);
        return data;
    }
    /**
     * 从数据库加载挑战进度数据
     */
    async Load(uid) {
        try {
            const rows = await DatabaseManager_1.DatabaseManager.Instance.Query('SELECT * FROM player_challenge_progress WHERE user_id = ?', [uid]);
            if (rows && rows.length > 0) {
                Logger_1.Logger.Debug(`[ChallengeProgressDataAccessor] 加载挑战进度数据: uid=${uid}`);
                return ChallengeProgressData_1.ChallengeProgressData.FromRow(rows[0]);
            }
            else {
                // 不存在则创建默认数据
                Logger_1.Logger.Debug(`[ChallengeProgressDataAccessor] 创建默认挑战进度数据: uid=${uid}`);
                const data = ChallengeProgressData_1.ChallengeProgressData.CreateDefault(uid);
                await this.Save(data);
                return data;
            }
        }
        catch (error) {
            Logger_1.Logger.Error(`[ChallengeProgressDataAccessor] 加载挑战进度数据失败: uid=${uid}`, error);
            // 返回默认数据
            return ChallengeProgressData_1.ChallengeProgressData.CreateDefault(uid);
        }
    }
    /**
     * 保存挑战进度数据到数据库
     */
    async Save(data) {
        return require("./AcquisitionProgress").saveProgress(data);
    }
    /**
     * 获取缓存的数据（不触发数据库查询）
     */
    GetCached(uid) {
        return this._cache.get(uid);
    }
    /**
     * 移除缓存
     */
    RemoveCache(uid) {
        this._cache.delete(uid);
        Logger_1.Logger.Debug(`[ChallengeProgressDataAccessor] 移除缓存: uid=${uid}`);
    }
    /**
     * 清空所有缓存
     */
    ClearAllCache() {
        this._cache.clear();
        Logger_1.Logger.Info(`[ChallengeProgressDataAccessor] 清空所有缓存`);
    }
    /**
     * 获取缓存统计信息
     */
    GetCacheStats() {
        return {
            size: this._cache.size
        };
    }
}
exports.ChallengeProgressDataAccessor = ChallengeProgressDataAccessor;
//# sourceMappingURL=ChallengeProgressDataAccessor.js.map