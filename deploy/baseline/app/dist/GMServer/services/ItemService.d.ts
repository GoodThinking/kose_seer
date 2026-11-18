/**
 * 物品管理服务
 */
export declare class ItemService {
    /**
     * 发送物品
     */
    giveItem(uid: number, itemId: number, count: number): Promise<void>;
    /**
     * 批量发送物品
     */
    giveItemBatch(uid: number, items: Array<{
        itemId: number;
        count: number;
    }>): Promise<void>;
    /**
     * 删除物品
     */
    removeItem(uid: number, itemId: number, count: number): Promise<void>;
    /**
     * 获取玩家物品列表
     */
    getPlayerItems(uid: number): Promise<any[]>;
}
//# sourceMappingURL=ItemService.d.ts.map