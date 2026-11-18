import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2403 HANDLE_FIGHT_INVITE] 处理对战邀请请求
 *
 * 请求格式：
 * - inviterUserId: uint32 - 邀请者的ID
 * - accept: uint32 - 是否接受（1=接受，0=拒绝）
 * - mode: uint32 - 对战模式（1=单挑，2=多精灵）
 */
export declare class HandleFightInviteReqProto extends BaseProto {
    inviterUserId: number;
    accept: number;
    mode: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): HandleFightInviteReqProto;
}
//# sourceMappingURL=HandleFightInviteReqProto.d.ts.map