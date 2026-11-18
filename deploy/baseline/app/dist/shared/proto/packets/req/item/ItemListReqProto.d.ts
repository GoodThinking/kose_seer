import { BaseProto } from '../../../base/BaseProto';
/**
 * 物品列表请求
 * CMD 2605
 */
export declare class ItemListReqProto extends BaseProto {
    itemType1: number;
    itemType2: number;
    itemType3: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=ItemListReqProto.d.ts.map