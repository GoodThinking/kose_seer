import { BaseProto } from '../../../base/BaseProto';
/**
 * 扭蛋机响应
 * CMD 3201
 *
 * 响应格式：
 * - coins(4): 赛尔豆余额
 * - petID(4): 精灵ID（扭蛋机只发道具，置0）
 * - catchTime(4): 捕获时间（保留字段，置0）
 * - itemCount(4): 物品数量
 * - items: [itemID(4) + itemNum(4)] * itemCount
 */
export declare class GachaRspProto extends BaseProto {
    coins: number;
    petId: number;
    catchTime: number;
    itemCount: number;
    items: {
        itemId: number;
        count: number;
    }[];
    constructor();
    serialize(): Buffer;
}
//# sourceMappingURL=GachaRspProto.d.ts.map