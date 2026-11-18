/**
 * 数据保存器
 * 负责将内存数据保存到数据库
 */
/**
 * 数据保存器
 */
export declare class DataSaver {
    private static _instance;
    /** 待保存的 UID 列表 */
    static ToSaveUidList: Set<number>;
    private constructor();
    static get Instance(): DataSaver;
    /**
     * 保存单个数据
     */
    Save<T>(type: string, data: T): Promise<void>;
    /**
     * 批量保存所有待保存的数据
     */
    SaveAll(): Promise<void>;
    /**
     * 保存指定用户的所有数据
     */
    SaveUser(uid: number): Promise<void>;
}
//# sourceMappingURL=DataSaver.d.ts.map