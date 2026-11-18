import { BaseProto } from '../../../base/BaseProto';
/**
 * 查询赛尔豆余额响应
 * CMD: 1105
 */
export declare class GoldCheckRemainRspProto extends BaseProto {
    coins: number;
    constructor();
    serialize(): Buffer;
    setCoins(value: number): this;
}
//# sourceMappingURL=GoldCheckRemainRspProto.d.ts.map