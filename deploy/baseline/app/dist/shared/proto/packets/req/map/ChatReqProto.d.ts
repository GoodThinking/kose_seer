import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2102 CHAT] 聊天请求
 */
export declare class ChatReqProto extends BaseProto {
    chatType: number;
    msg: string;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): ChatReqProto;
}
//# sourceMappingURL=ChatReqProto.d.ts.map