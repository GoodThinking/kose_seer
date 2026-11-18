/**
 * 数据加载器
 * 负责从数据库加载数据到内存
 */
/**
 * 数据加载器
 */
export declare class DataLoader {
    private static _instance;
    private constructor();
    static get Instance(): DataLoader;
    /**
     * 获取或创建数据实例
     */
    GetOrCreate<T>(type: string, uid: number): Promise<T>;
    /**
     * 获取数据实例（不创建新的）
     */
    Get<T>(type: string, uid: number): T | null;
    /**
     * 保存新创建的数据
     */
    private _saveNew;
}
//# sourceMappingURL=DataLoader.d.ts.map