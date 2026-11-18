import { CommandID } from '../../../../protocol';
import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2157 SEE_ONLINE] 查看在线状态请求
 * 
 * 请求格式:
 * - count (uint32) - 用户数量
 * - userIds (uint32[]) - 用户ID列表
 */
export class SeeOnlineReqProto extends BaseProto {
  count: number = 0;
  userIds: number[] = [];

  constructor() {
    super(CommandID.SEE_ONLINE);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): SeeOnlineReqProto {
    const proto = new SeeOnlineReqProto();
    
    if (buffer.length >= 4) {
      proto.count = buffer.readUInt32BE(0);
      proto.userIds = [];
      
      for (let i = 0; i < proto.count; i++) {
        const offset = 4 + i * 4;
        if (buffer.length >= offset + 4) {
          proto.userIds.push(buffer.readUInt32BE(offset));
        }
      }
    }
    
    return proto;
  }
}
