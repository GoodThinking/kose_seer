import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { IItemData } from '../../../../../shared/proto/packets/rsp/item/ItemListRspProto';
/**
 * 物品列表响应包
 * CMD 2605
 */
export declare class PacketItemList extends BaseProto {
    private _data;
    constructor(items: IItemData[]);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketItemList.d.ts.map