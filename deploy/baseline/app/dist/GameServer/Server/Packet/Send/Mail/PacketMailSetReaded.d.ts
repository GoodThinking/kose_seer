/**
 * 标记邮件为已读响应包
 * CMD 2754
 */
import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
export declare class PacketMailSetReaded extends BaseProto {
    private _data;
    constructor(success: boolean, mailId: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketMailSetReaded.d.ts.map