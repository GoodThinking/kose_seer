import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 10006 FITMENT_USERING] 使用家具请求
 *
 * 请求格式:
 * - targetUserId: uint32 (目标用户ID，访问谁的房间)
 */
export declare class FitmentUseringReqProto extends BaseProto {
    targetUserId: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): FitmentUseringReqProto;
}
//# sourceMappingURL=FitmentUseringReqProto.d.ts.map