import { BaseProto } from '../../../base/BaseProto';
/**
 * 物品购买/获得响应协议
 * CommandID: ITEM_BUY (2601)
 *
 * 用途：
 * 1. 购买物品后的响应
 * 2. 战斗掉落物品的通知
 * 3. 任务奖励物品的通知
 */
export declare class ItemBuyRspProto extends BaseProto {
    cash: number;
    itemID: number;
    itemNum: number;
    itemLevel: number;
    constructor(cash?: number, itemID?: number, itemNum?: number, itemLevel?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=ItemBuyRspProto.d.ts.map