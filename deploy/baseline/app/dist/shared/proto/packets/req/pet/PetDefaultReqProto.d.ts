import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2308 PET_DEFAULT] 设置默认精灵请求
 */
export declare class PetDefaultReqProto extends BaseProto {
    catchTime: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): PetDefaultReqProto;
}
//# sourceMappingURL=PetDefaultReqProto.d.ts.map