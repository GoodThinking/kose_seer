/**
 * 物品系统
 * 负责物品配置的读取和物品相关的逻辑处理
 *
 * 移植自: luvit/luvit_version/game/seer_items.lua
 *
 * 功能：
 * - 物品配置读取
 * - 物品信息查询
 * - 物品分类管理
 * - 物品属性获取
 */
import { IItem } from '../../../shared/config/XmlConfigInterfaces';
/**
 * 物品分类枚举
 */
export declare enum ItemCategory {
    MEDICINE = 1,// 药品
    CAPTURE = 2,// 捕捉道具
    EQUIPMENT = 3,// 装备
    CLOTH_HEAD = 4,// 服装-头部
    CLOTH_BODY = 5,// 服装-身体
    CLOTH_FOOT = 6,// 服装-脚部
    CLOTH_WAIST = 7,// 服装-腰部
    CLOTH_HAND = 8,// 服装-手部
    CLOTH_EYE = 9,// 服装-眼部
    CLOTH_BACK = 10,// 服装-背部
    MATERIAL = 11,// 材料
    GIFT = 12,// 礼物
    SPECIAL = 13
}
/**
 * 物品可交易性枚举
 */
export declare enum ItemTradability {
    NOT_TRADABLE = 0,// 不可交易
    TRADABLE = 1,// 可交易
    SELLABLE = 2,// 可出售
    FULL = 3
}
/**
 * 物品信息接口（扩展）
 */
export interface IItemInfo extends IItem {
    catId: number;
    isVipOnly: boolean;
    tradability: number;
    vipTradability: number;
}
/**
 * 物品系统类
 */
export declare class ItemSystem {
    /**
     * 物品缓存
     * itemId -> IItemInfo
     */
    private static itemCache;
    /**
     * 分类缓存
     * catId -> itemIds[]
     */
    private static categoryCache;
    /**
     * 唯一物品ID集合
     */
    private static uniqueItemIds;
    /**
     * 唯一物品范围列表
     */
    private static uniqueRanges;
    /**
     * 加载物品数据
     */
    private static LoadItemData;
    /**
     * 加载唯一物品配置
     */
    private static LoadUniqueItemsConfig;
    /**
     * 获取物品信息
     *
     * @param itemId 物品ID
     * @returns 物品信息，不存在返回null
     */
    static GetItem(itemId: number): IItemInfo | null;
    /**
     * 检查物品是否存在
     *
     * @param itemId 物品ID
     * @returns 是否存在
     */
    static Exists(itemId: number): boolean;
    /**
     * 获取物品名称
     *
     * @param itemId 物品ID
     * @returns 物品名称
     */
    static GetName(itemId: number): string;
    /**
     * 获取物品价格
     *
     * @param itemId 物品ID
     * @returns 价格
     */
    static GetPrice(itemId: number): number;
    /**
     * 获取物品出售价格
     *
     * @param itemId 物品ID
     * @returns 出售价格
     */
    static GetSellPrice(itemId: number): number;
    /**
     * 获取物品最大堆叠数量
     *
     * @param itemId 物品ID
     * @returns 最大堆叠数量（0或未设置表示99999）
     */
    static GetMaxStack(itemId: number): number;
    /**
     * 获取物品分类ID
     *
     * @param itemId 物品ID
     * @returns 分类ID
     */
    static GetCategoryId(itemId: number): number;
    /**
     * 获取指定分类的所有物品ID
     *
     * @param catId 分类ID
     * @returns 物品ID数组
     */
    static GetItemsByCategory(catId: number): number[];
    /**
     * 获取所有物品ID
     *
     * @returns 物品ID数组
     */
    static GetAllItemIds(): number[];
    /**
     * 获取所有分类ID
     *
     * @returns 分类ID数组
     */
    static GetAllCategoryIds(): number[];
    /**
     * 检查物品是否为VIP专属
     *
     * @param itemId 物品ID
     * @returns 是否VIP专属
     */
    static IsVipOnly(itemId: number): boolean;
    /**
     * 检查物品是否可交易
     *
     * @param itemId 物品ID
     * @param isVip 是否VIP（默认false）
     * @returns 是否可交易
     */
    static IsTradable(itemId: number, isVip?: boolean): boolean;
    /**
     * 检查物品是否可出售
     *
     * @param itemId 物品ID
     * @param isVip 是否VIP（默认false）
     * @returns 是否可出售
     */
    static IsSellable(itemId: number, isVip?: boolean): boolean;
    /**
     * 检查物品是否为服装
     *
     * @param itemId 物品ID
     * @returns 是否为服装
     */
    static IsCloth(itemId: number): boolean;
    /**
     * 检查物品是否为装备
     *
     * @param itemId 物品ID
     * @returns 是否为装备
     */
    static IsEquipment(itemId: number): boolean;
    /**
     * 检查物品是否为药品
     *
     * @param itemId 物品ID
     * @returns 是否为药品
     */
    static IsMedicine(itemId: number): boolean;
    /**
     * 检查物品是否为捕捉道具
     *
     * @param itemId 物品ID
     * @returns 是否为捕捉道具
     */
    static IsCaptureItem(itemId: number): boolean;
    /**
     * 获取装备的属性加成
     *
     * @param itemId 物品ID
     * @returns 属性加成对象
     */
    static GetEquipmentStats(itemId: number): {
        hp: number;
        atk: number;
        def: number;
    };
    /**
     * 检查物品是否可使用
     *
     * @param itemId 物品ID
     * @returns 是否可使用
     */
    static IsUsable(itemId: number): boolean;
    /**
     * 获取物品的功能ID
     *
     * @param itemId 物品ID
     * @returns 功能ID
     */
    static GetFunctionId(itemId: number): number;
    /**
     * 获取物品系统统计信息
     *
     * @returns 统计信息
     */
    static GetStats(): {
        totalItems: number;
        totalCategories: number;
        vipOnlyItems: number;
        tradableItems: number;
    };
    /**
     * 打印物品系统信息（调试用）
     */
    static PrintStats(): void;
    /**
     * 根据物品ID判断物品类型（快速判断）
     *
     * 常见ID范围：
     * - 100001-191001: 服装
     * - 300001-399999: 药品
     * - 400001-499999: 捕捉道具
     *
     * @param itemId 物品ID
     * @returns 物品类型描述
     */
    static GetItemTypeByIdRange(itemId: number): string;
    /**
     * 检查物品是否为唯一物品（不可重复拥有）
     *
     * 从配置文件读取唯一物品列表和范围
     *
     * @param itemId 物品ID
     * @returns 是否唯一
     */
    static IsUniqueItem(itemId: number): boolean;
    /**
     * 添加唯一物品ID（运行时动态添加）
     *
     * @param itemId 物品ID
     */
    static AddUniqueItem(itemId: number): void;
    /**
     * 移除唯一物品ID（运行时动态移除）
     *
     * @param itemId 物品ID
     */
    static RemoveUniqueItem(itemId: number): void;
    /**
     * 添加唯一物品范围（运行时动态添加）
     *
     * @param start 起始ID
     * @param end 结束ID
     */
    static AddUniqueRange(start: number, end: number): void;
    /**
     * 获取所有唯一物品ID
     *
     * @returns 唯一物品ID数组
     */
    static GetAllUniqueItemIds(): number[];
    /**
     * 获取所有唯一物品范围
     *
     * @returns 唯一物品范围数组
     */
    static GetAllUniqueRanges(): Array<{
        start: number;
        end: number;
    }>;
}
//# sourceMappingURL=ItemSystem.d.ts.map