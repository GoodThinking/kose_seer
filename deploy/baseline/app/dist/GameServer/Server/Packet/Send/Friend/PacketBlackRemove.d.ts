import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 移除黑名单响应包
 * CMD 2155
 */
export declare class PacketBlackRemove extends BaseProto {
    private _data;
    constructor(result?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketBlackRemove.d.ts.map