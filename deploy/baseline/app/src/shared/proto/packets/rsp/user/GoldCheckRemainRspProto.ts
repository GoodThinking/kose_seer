import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 查询赛尔豆余额响应
 * CMD: 1105
 */
export class GoldCheckRemainRspProto extends BaseProto {
  public coins: number = 0;

  constructor() {
    super(CommandID.GOLD_CHECK_REMAIN);
  }

  public serialize(): Buffer {
    const buffer = Buffer.allocUnsafe(4);
    buffer.writeUInt32BE(this.coins, 0);
    return buffer;
  }

  // 链式调用方法
  public setCoins(value: number): this {
    this.coins = value;
    return this;
  }
}
