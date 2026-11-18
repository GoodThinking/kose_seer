/**
 * 基础仓库类
 * 提供通用的数据库访问功能
 *
 * 注意：仅用于 Player 相关的 Repository（Account/Session/EmailCode/Player）
 * 游戏数据（Item/Pet/Task/Friend/Mail）使用 DatabaseHelper + Data 模式
 */
import { DatabaseManager } from '../DatabaseManager';
export declare abstract class BaseRepository<T> {
    protected _db: DatabaseManager;
    protected abstract _tableName: string;
    constructor();
    /**
     * 根据ID查询
     */
    FindById(id: number): Promise<T | null>;
    /**
     * 查询所有
     */
    FindAll(): Promise<T[]>;
    /**
     * 根据条件查询
     */
    FindBy(conditions: Partial<T>): Promise<T[]>;
    /**
     * 根据条件查询单条
     */
    FindOneBy(conditions: Partial<T>): Promise<T | null>;
    /**
     * 插入数据
     */
    Insert(data: Partial<T>): Promise<number>;
    /**
     * 更新数据
     */
    Update(id: number, data: Partial<T>): Promise<boolean>;
    /**
     * 删除数据
     */
    Delete(id: number): Promise<boolean>;
    /**
     * 统计数量
     */
    Count(conditions?: Partial<T>): Promise<number>;
    /**
     * 检查是否存在
     */
    Exists(conditions: Partial<T>): Promise<boolean>;
    /**
     * 驼峰转蛇形
     */
    protected toSnakeCase(str: string): string;
    /**
     * 蛇形转驼峰
     */
    protected toCamelCase(str: string): string;
    /**
     * 将数据库行转换为实体对象
     */
    protected rowToEntity(row: Record<string, any>): T;
    /**
     * 将实体对象转换为数据库行
     */
    protected entityToRow(entity: Partial<T>): Record<string, any>;
}
//# sourceMappingURL=BaseRepository.d.ts.map