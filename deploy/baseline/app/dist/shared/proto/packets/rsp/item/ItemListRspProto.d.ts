import { BaseProto } from '../../../base/BaseProto';
/**
 * 物品信息接口
 */
export interface IItemData {
    itemId: number;
    count: number;
    expireTime: number;
    unknown: number;
}
/**
 * 物品列表响应
 * CMD 2605
 */
export declare class ItemListRspProto extends BaseProto {
    private items;
    constructor(items: IItemData[]);
    serialize(): Buffer;
}
//# sourceMappingURL=ItemListRspProto.d.ts.map