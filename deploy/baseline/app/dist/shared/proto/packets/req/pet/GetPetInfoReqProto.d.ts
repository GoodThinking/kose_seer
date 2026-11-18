import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2301 GET_PET_INFO] 获取精灵信息请求
 */
export declare class GetPetInfoReqProto extends BaseProto {
    catchTime: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): GetPetInfoReqProto;
}
//# sourceMappingURL=GetPetInfoReqProto.d.ts.map