import { BaseProto } from '../../../base/BaseProto';

/**
 * 查询赛尔豆余额请求
 * CMD: 1105
 */
export class GoldCheckRemainReqProto extends BaseProto {
  constructor(cmdId: number) {
    super(cmdId);
  }

  public deserialize(buffer: Buffer): void {
    // 无请求参数
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
