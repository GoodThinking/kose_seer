/**
 * [CMD: 2756 MAIL_DEL_ALL] 删除所有已读邮件响应
 *
 * 响应格式:
 * - count: uint32 (删除的邮件数量)
 */
import { BaseProto } from '../../../base/BaseProto';
export declare class MailDelAllRspProto extends BaseProto {
    count: number;
    constructor();
    serialize(): Buffer;
}
//# sourceMappingURL=MailDelAllRspProto.d.ts.map