"use strict";
/**
 * PlayerData 访问器
 * 提供 PlayerData 的便捷访问接口
 *
 * 注意：PlayerData 使用 PlayerRepository 加载，不使用通用 DataLoader
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerDataAccessor = void 0;
const PlayerData_1 = require("../models/PlayerData");
const DataCache_1 = require("../cache/DataCache");
const PlayerRepository_1 = require("../repositories/Player/PlayerRepository");
const utils_1 = require("../../shared/utils");
const DatabaseManager_1 = require("../DatabaseManager");
/**
 * PlayerData 访问器
 */
class PlayerDataAccessor {
    static _instance;
    _playerRepo;
    static PROP_TO_COLUMN = {
        userID: 'user_id',
        mapID: 'map_id',
        posX: 'pos_x',
        posY: 'pos_y',
    };
    constructor() {
        this._playerRepo = new PlayerRepository_1.PlayerRepository();
    }
    static get Instance() {
        if (!PlayerDataAccessor._instance) {
            PlayerDataAccessor._instance = new PlayerDataAccessor();
        }
        return PlayerDataAccessor._instance;
    }
    /**
     * 获取 PlayerData（不创建）
     */
    async Get(uid) {
        const cache = DataCache_1.DataCache.Instance;
        // 先从缓存获取
        if (cache.Has('player', uid)) {
            return cache.Get('player', uid);
        }
        // 从数据库加载
        try {
            const playerInfo = await this._playerRepo.FindByUserId(uid);
            if (!playerInfo)
                return null;
            const data = new PlayerData_1.PlayerData(playerInfo);
            cache.Set('player', uid, data);
            return data;
        }
        catch (error) {
            utils_1.Logger.Error(`[PlayerDataAccessor] 加载 PlayerData 失败: uid=${uid}`, error);
            return null;
        }
    }
    /**
     * 获取或创建 PlayerData
     * 注意：PlayerData 不应该自动创建，如果不存在会抛出错误
     */
    async GetOrCreate(uid) {
        const existing = await this.Get(uid);
        if (existing)
            return existing;
        // 玩家不存在，抛出错误
        throw new Error(`[PlayerDataAccessor] PlayerData 不存在: uid=${uid}`);
    }
    /**
     * 保存 PlayerData 到数据库
     */
    async Save(data) {
        let dirtyFields = [];
        try {
            // Metadata lookup must happen outside the exclusive driver connection.
            const columnsMeta = await this._playerRepo.GetPlayerColumnsMeta();
            let saved = false;
            while (!saved) {
                await data.WaitForExpAllocation();
                saved = await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
                    // Allocation may start while this save waits for the connection.
                    if (data.HasExpAllocation())
                        return false;
                    dirtyFields = data.GetDirtyFields();
                    const values = new Map(dirtyFields.map(field => [field, JSON.stringify(data[field])]));
                    const updates = this.buildColumnUpdates(data, dirtyFields, columnsMeta);
                    if (Object.keys(updates).length > 0) {
                        await this._playerRepo.UpdateByUserIdColumns(data.userID, updates, driver);
                    }
                    // A later mutation during the await still needs its own save.
                    data.ClearDirtyFields(dirtyFields.filter(field => JSON.stringify(data[field]) === values.get(field)));
                    return true;
                });
            }
            utils_1.Logger.Debug(`[PlayerDataAccessor] PlayerData saved: uid=${data.userID}`);
            return;
        }
        catch (error) {
            for (const field of dirtyFields) {
                data.MarkDirty(field);
            }
            utils_1.Logger.Error(`[PlayerDataAccessor] Save PlayerData failed: uid=${data.userID}`, error);
            throw error;
        }
    }
    buildColumnUpdates(data, dirtyFields, columnsMeta) {
        const updates = {};
        const sourceFields = dirtyFields.length > 0
            ? dirtyFields
            : Object.keys(data);
        for (const prop of sourceFields) {
            // Clean cached wallet fields must not overwrite committed balances.
            if (['coins', 'gold', 'allocatableExp'].includes(prop) && !dirtyFields.includes(prop))
                continue;
            const rawValue = data[prop];
            const column = this.toColumnName(prop);
            if (!column || column === 'user_id')
                continue;
            const meta = columnsMeta.get(column);
            if (!meta)
                continue;
            const serialized = this.serializeValueForColumn(rawValue, meta.type);
            if (serialized === undefined)
                continue;
            updates[column] = serialized;
        }
        if (columnsMeta.has('team_id') && data.teamInfo) {
            updates.team_id = Number(data.teamInfo.id) || 0;
        }
        return updates;
    }
    toColumnName(prop) {
        if (!prop)
            return '';
        if (PlayerDataAccessor.PROP_TO_COLUMN[prop]) {
            return PlayerDataAccessor.PROP_TO_COLUMN[prop];
        }
        return prop
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
            .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
            .toLowerCase();
    }
    serializeValueForColumn(value, columnType) {
        if (value === undefined)
            return undefined;
        if (value === null)
            return null;
        if (typeof value === 'boolean') {
            return value ? 1 : 0;
        }
        if (Array.isArray(value) || typeof value === 'object') {
            return this.isJsonLikeColumn(columnType) ? JSON.stringify(value) : undefined;
        }
        return value;
    }
    isJsonLikeColumn(columnType) {
        const t = String(columnType || '').toLowerCase();
        return t.includes('json') || t.includes('text') || t.includes('char') || t.includes('blob');
    }
}
exports.PlayerDataAccessor = PlayerDataAccessor;
//# sourceMappingURL=PlayerDataAccessor.js.map