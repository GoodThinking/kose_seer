import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 使用金豆购买商品响应
 * CMD: 1104
 */
export class GoldBuyProductRspProto extends BaseProto {
  public unknown: number = 0;
  public payGold: number = 0;  // 花费的金豆 * 100
  public gold: number = 0;      // 剩余金豆 * 100

  constructor() {
    super(CommandID.GOLD_BUY_PRODUCT);
  }

  public serialize(): Buffer {
    const buffer = Buffer.allocUnsafe(12);
    let offset = 0;
    
    // unknown (4 bytes BE)
    buffer.writeUInt32BE(this.unknown, offset);
    offset += 4;
    
    // payGold (4 bytes BE)
    buffer.writeUInt32BE(this.payGold, offset);
    offset += 4;
    
    // gold (4 bytes BE)
    buffer.writeUInt32BE(this.gold, offset);
    offset += 4;
    
    return buffer;
  }

  // 链式调用方法
  public setUnknown(value: number): this {
    this.unknown = value;
    return this;
  }

  public setPayGold(value: number): this {
    this.payGold = value;
    return this;
  }

  public setGold(value: number): this {
    this.gold = value;
    return this;
  }
}
