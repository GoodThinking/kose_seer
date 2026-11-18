import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 8002 SYSTEM_MESSAGE] 系统消息响应
 *
 * 用途：
 * 1. 系统通知消息
 * 2. NPC 消息
 * 3. GM 操作通知
 */
export declare class SystemMessageRspProto extends BaseProto {
    type: number;
    npc: number;
    msgTime: number;
    msg: string;
    constructor(message?: string, npcId?: number, type?: number);
    serialize(): Buffer;
    setType(value: number): this;
    setNpc(value: number): this;
    setMsgTime(value: number): this;
    setMessage(value: string): this;
}
//# sourceMappingURL=SystemMessageRspProto.d.ts.map