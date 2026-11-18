import { BaseProto } from '../../../base/BaseProto';
/**
 * 购买物品请求
 * CMD 2601
 */
export declare class ItemBuyReqProto extends BaseProto {
    itemId: number;
    count: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=ItemBuyReqProto.d.ts.map