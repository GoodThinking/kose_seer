/**
 * 删除所有已读邮件响应包
 * CMD 2756
 */
import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
export declare class PacketMailDelAll extends BaseProto {
    private _data;
    constructor(count: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketMailDelAll.d.ts.map