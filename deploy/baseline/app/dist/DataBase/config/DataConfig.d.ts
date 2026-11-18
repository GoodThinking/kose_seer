/**
 * 数据配置
 * 定义每种数据类型的数据库映射配置
 */
/**
 * 数据类型接口
 */
export interface IDataClass<T> {
    FromRow(row: any): T;
    new (uid: number): T;
}
/**
 * 数据配置接口
 */
export interface IDataConfig<T> {
    tableName: string;
    dataClass: IDataClass<T>;
    toRow: (data: T) => any;
    getUid: (data: T) => number;
    saveFields?: string[];
}
/**
 * 数据配置注册表
 */
export declare class DataConfigRegistry {
    private static _instance;
    private _configs;
    private constructor();
    static get Instance(): DataConfigRegistry;
    /**
     * 初始化所有数据配置
     */
    private _initConfigs;
    /**
     * 获取数据配置
     */
    GetConfig<T>(type: string): IDataConfig<T>;
    /**
     * 注册新的数据配置
     */
    Register<T>(type: string, config: IDataConfig<T>): void;
    /**
     * 获取所有数据类型
     */
    GetAllTypes(): string[];
}
//# sourceMappingURL=DataConfig.d.ts.map