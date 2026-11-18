import { BaseProto } from '../../../base/BaseProto';
/**
 * 使用金豆购买商品响应
 * CMD: 1104
 */
export declare class GoldBuyProductRspProto extends BaseProto {
    unknown: number;
    payGold: number;
    gold: number;
    constructor();
    serialize(): Buffer;
    setUnknown(value: number): this;
    setPayGold(value: number): this;
    setGold(value: number): this;
}
//# sourceMappingURL=GoldBuyProductRspProto.d.ts.map