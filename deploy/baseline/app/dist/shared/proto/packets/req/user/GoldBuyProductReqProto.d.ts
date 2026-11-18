import { BaseProto } from '../../../base/BaseProto';
/**
 * 使用金豆购买商品请求
 * CMD: 1104
 */
export declare class GoldBuyProductReqProto extends BaseProto {
    productId: number;
    count: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=GoldBuyProductReqProto.d.ts.map