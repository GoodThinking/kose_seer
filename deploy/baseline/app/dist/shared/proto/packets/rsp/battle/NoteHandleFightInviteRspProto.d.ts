import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2502 NOTE_HANDLE_FIGHT_INVITE] 处理邀请通知
 *
 * 推送给邀请者，通知对方接受/拒绝了邀请
 *
 * 响应格式：
 * - targetUserId: uint32 - 被邀请者ID
 * - targetNick: string[16] - 被邀请者昵称
 * - accept: uint8 - 是否接受（1=接受，0=拒绝）
 */
export declare class NoteHandleFightInviteRspProto extends BaseProto {
    targetUserId: number;
    targetNick: string;
    accept: number;
    constructor();
    serialize(): Buffer;
}
//# sourceMappingURL=NoteHandleFightInviteRspProto.d.ts.map