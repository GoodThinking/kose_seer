/**
 * 物品数据类
 * 直接映射数据库表，提供静态方法便捷访问
 *
 * 特性：继承 BaseData，使用深度 Proxy 实现属性修改时自动保存到数据库
 */
import { BaseData } from './BaseData';
/**
 * 单个物品信息
 */
export interface IItemInfo {
    itemId: number;
    count: number;
    expireTime: number;
}
/**
 * 物品数据（对应数据库表 items）
 *
 * 架构说明：
 * - 继承 BaseData，自动获得深度 Proxy 自动保存功能
 * - 通过 DatabaseHelper 统一管理加载和保存
 * - 提供静态方法 GetItemDataByUid 便捷访问
 */
export declare class ItemData extends BaseData {
    /** 用户ID（主键） */
    Uid: number;
    /** 物品列表 */
    ItemList: IItemInfo[];
    constructor(uid: number);
    /**
     * 立即保存到数据库
     */
    save(): Promise<void>;
    /**
     * 从数据库行创建 ItemData
     */
    static FromRow(row: any): ItemData;
    /**
     * 转换为数据库行
     */
    ToRow(): any;
    /**
     * 静态方法：根据 UID 获取物品数据
     */
    static GetItemDataByUid(uid: number): Promise<ItemData | null>;
    /**
     * 添加物品
     */
    AddItem(itemId: number, count: number, expireTime?: number): void;
    /**
     * 移除物品
     */
    RemoveItem(itemId: number, count: number): boolean;
    /**
     * 检查是否拥有物品
     */
    HasItem(itemId: number): boolean;
    /**
     * 获取物品数量
     */
    GetItemCount(itemId: number): number;
}
//# sourceMappingURL=ItemData.d.ts.map