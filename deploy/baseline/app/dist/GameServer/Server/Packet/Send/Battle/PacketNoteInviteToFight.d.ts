import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * [CMD: 2501 NOTE_INVITE_TO_FIGHT] 对战邀请通知包装器
 */
export declare class PacketNoteInviteToFight extends BaseProto {
    private _data;
    constructor(inviterUserId: number, inviterNick: string, mode?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketNoteInviteToFight.d.ts.map