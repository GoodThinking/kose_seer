import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * [CMD: 2314 PET_EVOLVTION] 精灵进化响应包
 */
export declare class PacketPetEvolution extends BaseProto {
    private _data;
    constructor(status?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketPetEvolution.d.ts.map