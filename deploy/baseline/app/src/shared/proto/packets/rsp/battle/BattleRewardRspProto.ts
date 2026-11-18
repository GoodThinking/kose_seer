import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 战斗奖励响应（物品奖励弹窗）
 * CMD 2202: COMPLETE_TASK
 * 
 * 客户端期望的格式（NoviceFinishInfo）：
 * taskId(4) + petId(4) + captureTm(4) + itemCount(4) + [itemId(4) + itemCount(4)]...
 * 
 * 注意：虽然使用 COMPLETE_TASK 命令ID，但这是战斗奖励，不是真正的任务完成
 * 客户端会根据 monBallList 显示 ItemInBagAlert 弹窗
 */
export class BattleRewardRspProto extends BaseProto {
  public taskId: number = 0;           // 任务ID（战斗奖励时设为0）
  public petId: number = 0;            // 奖励精灵ID（无精灵奖励时为0）
  public captureTm: number = 0;        // 捕获时间（无精灵奖励时为0）
  public items: Array<{ itemId: number; itemCnt: number }> = [];  // 物品奖励列表

  constructor() {
    super(CommandID.COMPLETE_TASK);
  }

  public serialize(): Buffer {
    const itemCount = this.items.length;
    
    // 计算总长度：taskId(4) + petId(4) + captureTm(4) + itemCount(4) + items(8 * count)
    const bufferSize = 16 + (itemCount * 8);
    const buffer = Buffer.alloc(bufferSize);
    
    let offset = 0;

    // taskId
    buffer.writeUInt32BE(this.taskId, offset);
    offset += 4;

    // petId
    buffer.writeUInt32BE(this.petId, offset);
    offset += 4;

    // captureTm
    buffer.writeUInt32BE(this.captureTm, offset);
    offset += 4;

    // itemCount
    buffer.writeUInt32BE(itemCount, offset);
    offset += 4;

    // items
    for (const item of this.items) {
      buffer.writeUInt32BE(item.itemId, offset);
      offset += 4;
      buffer.writeUInt32BE(item.itemCnt, offset);
      offset += 4;
    }

    return buffer;
  }

  public deserialize(_buffer: Buffer): void {
    throw new Error('BattleRewardRspProto.deserialize not implemented (response only)');
  }
}
