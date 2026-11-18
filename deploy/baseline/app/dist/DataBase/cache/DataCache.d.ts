/**
 * 数据缓存管理器
 * 负责管理所有 Data 对象的内存缓存
 */
/**
 * 数据缓存管理器
 */
export declare class DataCache {
    private static _instance;
    /** 缓存的数据对象 */
    private _friendDataCache;
    private _playerDataCache;
    private _itemDataCache;
    private _petDataCache;
    private _mailDataCache;
    private _taskDataCache;
    private constructor();
    static get Instance(): DataCache;
    /**
     * 获取缓存 Map
     */
    GetCache<T>(type: string): Map<number, T>;
    /**
     * 设置缓存
     */
    Set<T>(type: string, uid: number, data: T): void;
    /**
     * 获取缓存
     */
    Get<T>(type: string, uid: number): T | null;
    /**
     * 检查缓存是否存在
     */
    Has(type: string, uid: number): boolean;
    /**
     * 移除指定用户的所有缓存
     */
    RemoveAll(uid: number): void;
    /**
     * 获取所有缓存的 UID
     */
    GetAllUids(type: string): number[];
    /**
     * 清空所有缓存
     */
    ClearAll(): void;
}
//# sourceMappingURL=DataCache.d.ts.map