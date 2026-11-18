import { BaseProto } from '../../../base/BaseProto';
import { PetInfoProto } from '../../../common/PetInfoProto';
/**
 * [CMD: 2301 GET_PET_INFO] 获取精灵信息响应
 */
export declare class GetPetInfoRspProto extends BaseProto {
    petInfo: PetInfoProto | null;
    constructor();
    serialize(): Buffer;
    setPetInfo(petInfo: PetInfoProto): this;
}
//# sourceMappingURL=GetPetInfoRspProto.d.ts.map