import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 使用金豆购买商品请求
 * CMD: 1104
 */
export class GoldBuyProductReqProto extends BaseProto {
  public productId: number = 0;
  public count: number = 0;

  constructor() {
    super(CommandID.GOLD_BUY_PRODUCT);
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    
    // productId (4 bytes BE)
    this.productId = buffer.readUInt32BE(offset);
    offset += 4;
    
    // count (2 bytes BE)
    this.count = buffer.readUInt16BE(offset);
    offset += 2;
  }

  public serialize(): Buffer {
    // Request proto 不需要序列化
    return Buffer.alloc(0);
  }
}
