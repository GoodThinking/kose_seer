import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * NoNo 跟随或回家响应包
 * CMD 9019
 */
export declare class PacketNoNoFollowOrHoom extends BaseProto {
    private _data;
    constructor(userId: number, superStage: number, state: number, isFollow: boolean, nick?: string, color?: number, power?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketNoNoFollowOrHoom.d.ts.map