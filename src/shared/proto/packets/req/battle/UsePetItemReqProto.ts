import { BaseProto } from '../../../base/BaseProto';
import { ClientProtocol } from '../../../../protocol/ClientProtocol';

/**
 * [CMD: 2406 USE_PET_ITEM] 使用精灵道具请求
 */
export class UsePetItemReqProto extends BaseProto {
  itemId: number = 0;  // 道具ID
  catchTime?: number;

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer, profile: ClientProtocol = 'kose'): UsePetItemReqProto {
    const proto = new UsePetItemReqProto();
    // Fixed Nieo RenewBloodItemCategory also sends catchTime/itemId/reserved.
    if (profile === 'xin-20261013' || buffer.length === 12) {
      if (buffer.length !== 12 || buffer.readUInt32BE(8) !== 0) throw new RangeError('Invalid USE_PET_ITEM body');
      proto.catchTime = buffer.readUInt32BE(0);
      proto.itemId = buffer.readUInt32BE(4);
    } else {
      if (buffer.length !== 4) throw new RangeError('Invalid KOSE USE_PET_ITEM body');
      proto.itemId = buffer.readUInt32BE(0);
    }
    return proto;
  }
}
