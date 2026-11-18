import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2052] 获取更多用户信息请求
 *
 * 请求格式：
 * - userId: uint32 (要查询的用户ID)
 */
export declare class GetMoreUserInfoReqProto extends BaseProto {
    userId: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): GetMoreUserInfoReqProto;
}
//# sourceMappingURL=GetMoreUserInfoReqProto.d.ts.map