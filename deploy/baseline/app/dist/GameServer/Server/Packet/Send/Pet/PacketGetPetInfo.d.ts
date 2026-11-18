import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { PetInfoProto } from '../../../../../shared/proto/common/PetInfoProto';
/**
 * 获取精灵信息响应包
 * CMD 2301
 */
export declare class PacketGetPetInfo extends BaseProto {
    private _data;
    constructor(petInfo?: PetInfoProto, result?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketGetPetInfo.d.ts.map