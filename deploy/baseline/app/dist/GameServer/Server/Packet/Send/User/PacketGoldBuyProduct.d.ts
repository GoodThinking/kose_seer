import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 使用金豆购买商品响应包
 * CMD 1104
 */
export declare class PacketGoldBuyProduct extends BaseProto {
    private _data;
    constructor(payGold: number, remainingGold: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketGoldBuyProduct.d.ts.map