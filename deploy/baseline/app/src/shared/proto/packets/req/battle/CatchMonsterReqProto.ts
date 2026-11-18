import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2409 CATCH_MONSTER] 捕捉精灵请求
 */
export class CatchMonsterReqProto extends BaseProto {
  itemId: number = 0;  // 胶囊物品ID

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): CatchMonsterReqProto {
    const proto = new CatchMonsterReqProto();
    if (buffer.length >= 4) {
      proto.itemId = buffer.readUInt32BE(0);
    }
    return proto;
  }
}
