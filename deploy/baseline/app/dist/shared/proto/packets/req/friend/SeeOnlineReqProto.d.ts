import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2157 SEE_ONLINE] 查看在线状态请求
 *
 * 请求格式:
 * - count (uint32) - 用户数量
 * - userIds (uint32[]) - 用户ID列表
 */
export declare class SeeOnlineReqProto extends BaseProto {
    count: number;
    userIds: number[];
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): SeeOnlineReqProto;
}
//# sourceMappingURL=SeeOnlineReqProto.d.ts.map