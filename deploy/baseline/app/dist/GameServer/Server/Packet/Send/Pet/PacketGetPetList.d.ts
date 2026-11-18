import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { PetInfoProto } from '../../../../../shared/proto/common/PetInfoProto';
/**
 * 获取精灵列表响应包
 * CMD 2303
 */
export declare class PacketGetPetList extends BaseProto {
    private _data;
    constructor(pets: PetInfoProto[]);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketGetPetList.d.ts.map