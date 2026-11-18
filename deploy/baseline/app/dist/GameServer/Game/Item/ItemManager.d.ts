import { BaseManager } from '../Base/BaseManager';
import { PlayerInstance } from '../Player/PlayerInstance';
import { ItemData } from '../../../DataBase/models/ItemData';
import { ItemGainSource } from '../Event/EventTypes';
/**
 * 物品管理器
 * 处理物品相关的所有逻辑：购买物品、更换服装、物品列表等
 *
 * 架构说明：
 * - 继承 BaseManager 获得便捷方法（Player、UserID、SendPacket）
 * - 持有 ItemData 对象，直接操作数组
 * - 使用 DatabaseHelper 实时保存数据
 */
export declare class ItemManager extends BaseManager {
    /** 物品数据 */
    ItemData: ItemData;
    private _broadcastService;
    constructor(player: PlayerInstance);
    /**
     * 初始化（加载数据）
     */
    Initialize(): Promise<void>;
    /**
     * 同步服装数据到 PlayerData
     * 从 ItemData 提取服装物品（ID >= 100000）到 PlayerData.clothes
     */
    private syncClothesToPlayerData;
    /**
     * 处理购买物品
     *
     * @param itemId 物品ID
     * @param count 购买数量
     */
    HandleItemBuy(itemId: number, count: number): Promise<void>;
    /**
     * 赠送物品（用于邮件附件、任务奖励等）
     *
     * @param itemId 物品ID
     * @param count 数量
     * @returns 是否成功
     */
    GiveItem(itemId: number, count: number, source?: ItemGainSource): Promise<boolean>;
    /**
     * 检查玩家是否拥有某物品
     */
    HasItem(itemId: number): boolean;
    /**
     * 获取某物品的数量
     */
    GetItemCount(itemId: number): number;
    /**
     * 消耗物品
     * @returns 是否成功消耗
     */
    ConsumeItem(itemId: number, count: number): boolean;
    /**
     * 获取服装物品列表（ID >= 100000 且 < 200000）
     */
    GetClothItems(): Array<{
        itemId: number;
        count: number;
    }>;
    /**
     * 处理更换服装
     *
     * @param clothIds 服装ID列表
     */
    HandleChangeCloth(clothIds: number[]): Promise<void>;
    /**
     * 处理物品列表
     *
     * @param itemType1 物品类型范围起始
     * @param itemType2 物品类型范围结束
     * @param itemType3 单个物品类型
     */
    HandleItemList(itemType1: number, itemType2: number, itemType3: number): Promise<void>;
    /**
     * 处理金豆购买商品
     * @param productId 商品ID
     * @param count 购买数量
     */
    HandleGoldBuyProduct(productId: number, count: number): Promise<void>;
    /**
     * 获取物品价格
     */
    private getItemPrice;
}
//# sourceMappingURL=ItemManager.d.ts.map