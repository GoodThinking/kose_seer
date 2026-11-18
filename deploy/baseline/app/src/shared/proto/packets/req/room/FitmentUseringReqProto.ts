import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 10006 FITMENT_USERING] 使用家具请求
 * 
 * 请求格式:
 * - targetUserId: uint32 (目标用户ID，访问谁的房间)
 */
export class FitmentUseringReqProto extends BaseProto {
  targetUserId: number = 0;

  constructor() {
    super(CommandID.FITMENT_USERING);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): FitmentUseringReqProto {
    const proto = new FitmentUseringReqProto();
    if (buffer.length >= 4) {
      proto.targetUserId = buffer.readUInt32BE(0);
    }
    return proto;
  }
}
