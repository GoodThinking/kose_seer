import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 物品购买/获得响应协议
 * CommandID: ITEM_BUY (2601)
 * 
 * 用途：
 * 1. 购买物品后的响应
 * 2. 战斗掉落物品的通知
 * 3. 任务奖励物品的通知
 */
export class ItemBuyRspProto extends BaseProto {
  public cash: number = 0;      // 当前金币
  public itemID: number = 0;    // 物品ID
  public itemNum: number = 0;   // 物品数量
  public itemLevel: number = 0; // 物品等级

  constructor(cash: number = 0, itemID: number = 0, itemNum: number = 0, itemLevel: number = 0) {
    super(CommandID.ITEM_BUY);
    this.cash = cash;
    this.itemID = itemID;
    this.itemNum = itemNum;
    this.itemLevel = itemLevel;
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(16);
    buffer.writeUInt32LE(this.cash, 0);
    buffer.writeUInt32LE(this.itemID, 4);
    buffer.writeUInt32LE(this.itemNum, 8);
    buffer.writeUInt32LE(this.itemLevel, 12);
    return buffer;
  }
}
