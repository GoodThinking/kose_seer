import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { PetInfoProto } from '../../../../../shared/proto/common/PetInfoProto';
/**
 * 释放精灵响应包
 * CMD 2304
 */
export declare class PacketPetRelease extends BaseProto {
    private _data;
    constructor(homeEnergy: number, firstPetTime: number, flag: number, petInfo?: PetInfoProto);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketPetRelease.d.ts.map