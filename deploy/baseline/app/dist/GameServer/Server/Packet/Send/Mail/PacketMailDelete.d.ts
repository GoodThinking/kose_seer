/**
 * 删除邮件响应包
 * CMD 2755
 */
import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
export declare class PacketMailDelete extends BaseProto {
    private _data;
    constructor(success: boolean, mailId: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketMailDelete.d.ts.map