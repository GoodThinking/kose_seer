import { CommandID } from '../../../../protocol';
import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 10007 FITMENT_ALL] 获取所有家具请求
 * 
 * 请求格式:
 * - 空请求
 */
export class FitmentAllReqProto extends BaseProto {
  constructor() {
    super(CommandID.FITMENT_ALL);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): FitmentAllReqProto {
    return new FitmentAllReqProto();
  }
}
