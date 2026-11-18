"use strict";
/**
 * 数据缓存管理器
 * 负责管理所有 Data 对象的内存缓存
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCache = void 0;
/**
 * 数据缓存管理器
 */
class DataCache {
    static _instance;
    /** 缓存的数据对象 */
    _friendDataCache = new Map();
    _playerDataCache = new Map();
    _itemDataCache = new Map();
    _petDataCache = new Map();
    _mailDataCache = new Map();
    _taskDataCache = new Map();
    constructor() { }
    static get Instance() {
        if (!DataCache._instance) {
            DataCache._instance = new DataCache();
        }
        return DataCache._instance;
    }
    /**
     * 获取缓存 Map
     */
    GetCache(type) {
        switch (type) {
            case 'friend': return this._friendDataCache;
            case 'item': return this._itemDataCache;
            case 'pet': return this._petDataCache;
            case 'mail': return this._mailDataCache;
            case 'task': return this._taskDataCache;
            case 'player': return this._playerDataCache;
            default: throw new Error(`Unknown data type: ${type}`);
        }
    }
    /**
     * 设置缓存
     */
    Set(type, uid, data) {
        const cache = this.GetCache(type);
        cache.set(uid, data);
    }
    /**
     * 获取缓存
     */
    Get(type, uid) {
        const cache = this.GetCache(type);
        return cache.get(uid) || null;
    }
    /**
     * 检查缓存是否存在
     */
    Has(type, uid) {
        const cache = this.GetCache(type);
        return cache.has(uid);
    }
    /**
     * 移除指定用户的所有缓存
     */
    RemoveAll(uid) {
        this._friendDataCache.delete(uid);
        this._playerDataCache.delete(uid);
        this._itemDataCache.delete(uid);
        this._petDataCache.delete(uid);
        this._mailDataCache.delete(uid);
        this._taskDataCache.delete(uid);
    }
    /**
     * 获取所有缓存的 UID
     */
    GetAllUids(type) {
        const cache = this.GetCache(type);
        return Array.from(cache.keys());
    }
    /**
     * 清空所有缓存
     */
    ClearAll() {
        this._friendDataCache.clear();
        this._playerDataCache.clear();
        this._itemDataCache.clear();
        this._petDataCache.clear();
        this._mailDataCache.clear();
        this._taskDataCache.clear();
    }
}
exports.DataCache = DataCache;
//# sourceMappingURL=DataCache.js.map