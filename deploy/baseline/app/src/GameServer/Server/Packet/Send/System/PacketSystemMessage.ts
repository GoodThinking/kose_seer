import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { SystemMessageRspProto } from '../../../../../shared/proto/packets/rsp/system/SystemMessageRspProto';

/**
 * 系统消息响应包
 * CMD 8002
 */
export class PacketSystemMessage extends BaseProto {
  private _data: Buffer;

  constructor(message: string, npcId: number = 0, type: number = 0) {
    super(CommandID.SYSTEM_MESSAGE);
    
    const proto = new SystemMessageRspProto(message, npcId, type);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
