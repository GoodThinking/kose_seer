import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2303 GET_PET_LIST] 获取精灵列表请求
 */
export declare class GetPetListReqProto extends BaseProto {
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): GetPetListReqProto;
}
//# sourceMappingURL=GetPetListReqProto.d.ts.map