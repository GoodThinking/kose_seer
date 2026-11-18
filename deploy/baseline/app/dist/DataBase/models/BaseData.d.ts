/**
 * 数据基类
 * 提供自动保存功能（包括深度 Proxy 支持）
 *
 * 使用方法：
 * 1. 继承 BaseData
 * 2. 在 constructor 中调用 super(uid, noSaveFields, arrayFields)
 * 3. 实现 save() 方法
 */
/**
 * 数据基类
 */
export declare abstract class BaseData {
    /** 用户ID（主键） - 子类必须初始化 */
    Uid: number;
    /** 保存定时器 */
    private _saveTimer;
    /** 是否有待保存的修改 */
    private _pendingSave;
    /** 不需要自动保存的字段列表（黑名单） */
    private _noSaveFields;
    /** 需要深度 Proxy 包装的数组字段列表 */
    private _arrayFields;
    /** 缓存已包装的数组 Proxy，避免重复创建 */
    private _wrappedArrays;
    /**
     * 构造函数
     * @param uid 用户ID
     * @param noSaveFields 不需要自动保存的字段（主键、内部状态等）
     * @param arrayFields 需要深度 Proxy 包装的数组字段
     */
    constructor(uid: number, noSaveFields?: string[], arrayFields?: string[]);
    /**
     * 创建 Proxy 包装（子类在 constructor 最后调用）
     */
    protected createProxy<T extends BaseData>(target: T): T;
    /**
     * 为数组创建深度 Proxy，监听数组操作和对象属性修改
     */
    private wrapArrayWithProxy;
    /**
     * 为对象创建 Proxy，监听属性修改
     */
    private wrapObjectWithProxy;
    /**
     * 调度保存操作（防抖，100ms内的多次修改只保存一次）
     */
    protected scheduleSave(): void;
    /**
     * 立即保存到数据库（子类必须实现）
     */
    abstract save(): Promise<void>;
    /**
     * 获取数据类名称（用于日志）
     */
    protected getDataClassName(): string;
}
//# sourceMappingURL=BaseData.d.ts.map