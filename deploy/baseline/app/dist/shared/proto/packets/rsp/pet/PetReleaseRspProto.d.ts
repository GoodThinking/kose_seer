import { BaseProto } from '../../../base/BaseProto';
import { PetInfoProto } from '../../../common/PetInfoProto';
/**
 * [CMD: 2304 PET_RELEASE] 释放精灵响应
 * Response: homeEnergy(4) + firstPetTime(4) + flag(4) + [PetInfo]
 */
export declare class PetReleaseRspProto extends BaseProto {
    homeEnergy: number;
    firstPetTime: number;
    flag: number;
    petInfo: PetInfoProto | null;
    constructor();
    serialize(): Buffer;
    setHomeEnergy(homeEnergy: number): this;
    setFirstPetTime(firstPetTime: number): this;
    setFlag(flag: number): this;
    setPetInfo(petInfo: PetInfoProto): this;
}
//# sourceMappingURL=PetReleaseRspProto.d.ts.map