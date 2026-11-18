import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * [CMD: 2502 NOTE_HANDLE_FIGHT_INVITE] 处理邀请通知包装器
 */
export declare class PacketNoteHandleFightInvite extends BaseProto {
    private _data;
    constructor(targetUserId: number, targetNick: string, accept: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketNoteHandleFightInvite.d.ts.map