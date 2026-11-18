/**
 * ItemData 访问器
 * 提供 ItemData 的便捷访问接口
 */
import { ItemData } from '../models/ItemData';
/**
 * ItemData 访问器
 */
export declare class ItemDataAccessor {
    private static _instance;
    private constructor();
    static get Instance(): ItemDataAccessor;
    /**
     * 获取或创建 ItemData
     */
    GetOrCreate(uid: number): Promise<ItemData>;
    /**
     * 获取 ItemData（不创建）
     */
    Get(uid: number): ItemData | null;
    /**
     * 保存 ItemData
     */
    Save(data: ItemData): Promise<void>;
}
//# sourceMappingURL=ItemDataAccessor.d.ts.map