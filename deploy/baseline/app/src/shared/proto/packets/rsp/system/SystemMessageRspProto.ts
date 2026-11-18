import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { BufferWriter } from '../../../../utils';

/**
 * [CMD: 8002 SYSTEM_MESSAGE] 系统消息响应
 * 
 * 用途：
 * 1. 系统通知消息
 * 2. NPC 消息
 * 3. GM 操作通知
 */
export class SystemMessageRspProto extends BaseProto {
  public type: number = 0;      // 消息类型 (0 = 普通消息)
  public npc: number = 0;       // NPC ID (0 = 系统消息, 1-8 = 各种NPC)
  public msgTime: number = 0;   // 时间戳（秒）
  public msg: string = '';      // 消息内容

  constructor(message: string = '', npcId: number = 0, type: number = 0) {
    super(CommandID.SYSTEM_MESSAGE);
    this.msg = message;
    this.npc = npcId;
    this.type = type;
    this.msgTime = Math.floor(Date.now() / 1000);
  }

  public serialize(): Buffer {
    const msgBuffer = Buffer.from(this.msg, 'utf8');
    const msgLen = msgBuffer.length;
    
    const writer = new BufferWriter(12 + msgLen);
    
    writer.WriteUInt16(this.type);      // type (2 bytes)
    writer.WriteUInt16(this.npc);       // npc (2 bytes)
    writer.WriteUInt32(this.msgTime);   // msgTime (4 bytes)
    writer.WriteUInt32(msgLen);         // msgLen (4 bytes)
    writer.WriteBytes(msgBuffer);       // msg (msgLen bytes)
    
    return writer.ToBuffer();
  }

  // 链式调用
  public setType(value: number): this {
    this.type = value;
    return this;
  }

  public setNpc(value: number): this {
    this.npc = value;
    return this;
  }

  public setMsgTime(value: number): this {
    this.msgTime = value;
    return this;
  }

  public setMessage(value: string): this {
    this.msg = value;
    return this;
  }
}
