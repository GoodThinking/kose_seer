/**
 * 获取邮件列表响应包
 * CMD 2751
 */
import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { IMailInfo } from '../../../../../shared/models/MailModel';
export declare class PacketMailGetList extends BaseProto {
    private _data;
    constructor(total: number, mails: IMailInfo[]);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketMailGetList.d.ts.map