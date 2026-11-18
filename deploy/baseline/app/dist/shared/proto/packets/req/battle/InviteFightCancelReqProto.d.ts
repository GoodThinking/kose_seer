import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2402 INVITE_FIGHT_CANCEL] 取消邀请请求
 *
 * 请求格式：
 * - targetUserId: uint32 - 被邀请玩家的ID
 */
export declare class InviteFightCancelReqProto extends BaseProto {
    targetUserId: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): InviteFightCancelReqProto;
}
//# sourceMappingURL=InviteFightCancelReqProto.d.ts.map