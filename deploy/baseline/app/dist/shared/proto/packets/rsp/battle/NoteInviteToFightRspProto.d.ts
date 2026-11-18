import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2501 NOTE_INVITE_TO_FIGHT] 对战邀请通知
 *
 * 推送给被邀请者，通知有人邀请对战
 *
 * 响应格式：
 * - inviterUserId: uint32 - 邀请者ID
 * - inviterNick: string[16] - 邀请者昵称
 * - mode: uint32 - 对战模式（0=普通对战）
 */
export declare class NoteInviteToFightRspProto extends BaseProto {
    inviterUserId: number;
    inviterNick: string;
    mode: number;
    constructor();
    serialize(): Buffer;
}
//# sourceMappingURL=NoteInviteToFightRspProto.d.ts.map