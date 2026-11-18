/**
 * 读取邮件内容响应包
 * CMD 2753
 */
import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { IMailInfo } from '../../../../../shared/models/MailModel';
export declare class PacketMailGetContent extends BaseProto {
    private _data;
    constructor(mail: IMailInfo | null);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketMailGetContent.d.ts.map