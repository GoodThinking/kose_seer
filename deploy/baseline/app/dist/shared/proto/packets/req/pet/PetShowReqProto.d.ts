import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2305 PET_SHOW] 展示精灵请求
 * Request: catchTime(4) + flag(4)
 */
export declare class PetShowReqProto extends BaseProto {
    catchTime: number;
    flag: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): PetShowReqProto;
}
//# sourceMappingURL=PetShowReqProto.d.ts.map