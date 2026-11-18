import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 扭蛋机响应
 * CMD 3201
 * 
 * 响应格式：
 * - coins(4): 赛尔豆余额
 * - petID(4): 精灵ID（扭蛋机只发道具，置0）
 * - catchTime(4): 捕获时间（保留字段，置0）
 * - itemCount(4): 物品数量
 * - items: [itemID(4) + itemNum(4)] * itemCount
 */
export class GachaRspProto extends BaseProto {
  public coins: number = 0;
  public petId: number = 0;
  public catchTime: number = 0;
  public itemCount: number = 0;
  public items: { itemId: number; count: number }[] = [];

  constructor() {
    super(CommandID.EGG_GAME_PLAY);
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(16 + this.items.length * 8);
    let offset = 0;

    buffer.writeUInt32BE(this.coins, offset);
    offset += 4;

    buffer.writeUInt32BE(this.petId, offset);
    offset += 4;

    buffer.writeUInt32BE(this.catchTime, offset);
    offset += 4;

    buffer.writeUInt32BE(this.itemCount, offset);
    offset += 4;

    for (const item of this.items) {
      buffer.writeUInt32BE(item.itemId, offset);
      offset += 4;
      buffer.writeUInt32BE(item.count, offset);
      offset += 4;
    }

    return buffer;
  }
}
