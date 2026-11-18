import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 1106 GOLD_ONLINE_CHECK_REMAIN] 检查金币余额响应
 */
export declare class GoldOnlineCheckRemainRspProto extends BaseProto {
    gold: number;
    constructor();
    serialize(): Buffer;
    setGold(gold: number): this;
}
//# sourceMappingURL=GoldOnlineCheckRemainRspProto.d.ts.map