import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * [CMD: 1106 GOLD_ONLINE_CHECK_REMAIN] 检查金币余额响应包
 */
export declare class PacketGoldOnlineCheckRemain extends BaseProto {
    private _data;
    constructor(gold: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketGoldOnlineCheckRemain.d.ts.map