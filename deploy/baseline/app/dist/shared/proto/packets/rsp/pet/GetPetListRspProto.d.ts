import { BaseProto } from '../../../base/BaseProto';
import { PetInfoProto } from '../../../common/PetInfoProto';
/**
 * [CMD: 2303 GET_PET_LIST] 获取精灵列表响应
 */
export declare class GetPetListRspProto extends BaseProto {
    pets: PetInfoProto[];
    constructor();
    serialize(): Buffer;
    setPets(pets: PetInfoProto[]): this;
}
//# sourceMappingURL=GetPetListRspProto.d.ts.map