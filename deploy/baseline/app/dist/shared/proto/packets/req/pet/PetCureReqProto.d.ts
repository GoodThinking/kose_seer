import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2306 PET_CURE] 治疗精灵请求
 */
export declare class PetCureReqProto extends BaseProto {
    cureType: number;
    catchTime: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): PetCureReqProto;
}
//# sourceMappingURL=PetCureReqProto.d.ts.map