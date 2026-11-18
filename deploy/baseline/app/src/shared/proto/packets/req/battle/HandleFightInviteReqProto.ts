import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2403 HANDLE_FIGHT_INVITE] 处理对战邀请请求
 * 
 * 请求格式：
 * - inviterUserId: uint32 - 邀请者的ID
 * - accept: uint32 - 是否接受（1=接受，0=拒绝）
 * - mode: uint32 - 对战模式（1=单挑，2=多精灵）
 */
export class HandleFightInviteReqProto extends BaseProto {
  inviterUserId: number = 0;
  accept: number = 0;
  mode: number = 2;

  constructor() {
    super(CommandID.HANDLE_FIGHT_INVITE);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): HandleFightInviteReqProto {
    const proto = new HandleFightInviteReqProto();
    // 客户端发送的数据全部使用大端序（BE）
    // Hex: 000000010000000100000002
    // - inviterUserId: 00 00 00 01 (BE) = 1
    // - accept: 00 00 00 01 (BE) = 1
    // - mode: 00 00 00 02 (BE) = 2
    if (buffer.length >= 4) {
      proto.inviterUserId = buffer.readUInt32BE(0);
    }
    if (buffer.length >= 8) {
      proto.accept = buffer.readUInt32BE(4);
    }
    if (buffer.length >= 12) {
      proto.mode = buffer.readUInt32BE(8);
    }
    return proto;
  }
}
