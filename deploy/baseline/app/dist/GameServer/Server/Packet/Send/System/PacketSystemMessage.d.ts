import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 系统消息响应包
 * CMD 8002
 */
export declare class PacketSystemMessage extends BaseProto {
    private _data;
    constructor(message: string, npcId?: number, type?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketSystemMessage.d.ts.map