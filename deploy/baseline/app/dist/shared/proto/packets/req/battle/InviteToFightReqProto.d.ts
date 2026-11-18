import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2401 INVITE_TO_FIGHT] 邀请对战请求
 *
 * 请求格式：
 * - targetUserId: uint32 - 被邀请玩家的ID
 * - mode: uint32 - 对战模式（1=单挑，2=多精灵）
 */
export declare class InviteToFightReqProto extends BaseProto {
    targetUserId: number;
    mode: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): InviteToFightReqProto;
}
//# sourceMappingURL=InviteToFightReqProto.d.ts.map