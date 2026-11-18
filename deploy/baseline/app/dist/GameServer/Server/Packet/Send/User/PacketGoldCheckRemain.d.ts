import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 查询赛尔豆余额响应包
 * CMD 1105
 */
export declare class PacketGoldCheckRemain extends BaseProto {
    private _data;
    constructor(coins: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketGoldCheckRemain.d.ts.map