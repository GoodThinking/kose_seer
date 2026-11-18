import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2304 PET_RELEASE] 释放精灵请求
 * Request: catchId(4) + flag(4)
 */
export declare class PetReleaseReqProto extends BaseProto {
    catchId: number;
    flag: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): PetReleaseReqProto;
}
//# sourceMappingURL=PetReleaseReqProto.d.ts.map