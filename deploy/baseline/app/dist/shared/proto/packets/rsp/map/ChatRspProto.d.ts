import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2102 CHAT] 聊天响应
 */
export declare class ChatRspProto extends BaseProto {
    senderId: number;
    senderNick: string;
    toId: number;
    msg: string;
    constructor();
    serialize(): Buffer;
    setSenderId(value: number): this;
    setSenderNick(value: string): this;
    setToId(value: number): this;
    setMsg(value: string): this;
}
//# sourceMappingURL=ChatRspProto.d.ts.map