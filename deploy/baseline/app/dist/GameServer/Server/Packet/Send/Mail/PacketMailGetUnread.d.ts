/**
 * 获取未读邮件数量响应包
 * CMD 2757
 */
import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
export declare class PacketMailGetUnread extends BaseProto {
    private _data;
    constructor(count: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketMailGetUnread.d.ts.map