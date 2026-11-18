import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 聊天响应包
 * CMD 1014
 */
export declare class PacketChat extends BaseProto {
    private _data;
    constructor(senderId: number, senderNick: string, toId: number, msg: string);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketChat.d.ts.map