import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 10007 FITMENT_ALL] 获取所有家具请求
 *
 * 请求格式:
 * - 空请求
 */
export declare class FitmentAllReqProto extends BaseProto {
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): FitmentAllReqProto;
}
//# sourceMappingURL=FitmentAllReqProto.d.ts.map