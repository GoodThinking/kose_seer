import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 9019 NONO_FOLLOW_OR_HOOM] NoNo 跟随或回家请求
 */
export declare class NoNoFollowOrHoomReqProto extends BaseProto {
    action: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): NoNoFollowOrHoomReqProto;
}
//# sourceMappingURL=NoNoFollowOrHoomReqProto.d.ts.map