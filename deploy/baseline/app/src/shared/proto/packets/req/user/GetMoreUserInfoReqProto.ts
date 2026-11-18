import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2052] 获取更多用户信息请求
 * 
 * 请求格式：
 * - userId: uint32 (要查询的用户ID)
 */
export class GetMoreUserInfoReqProto extends BaseProto {
  userId: number = 0;

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): GetMoreUserInfoReqProto {
    const proto = new GetMoreUserInfoReqProto();
    if (buffer.length >= 4) {
      proto.userId = buffer.readUInt32BE(0);
    }
    return proto;
  }
}
