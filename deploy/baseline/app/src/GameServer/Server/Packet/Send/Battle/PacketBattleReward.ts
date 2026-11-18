import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { BattleRewardRspProto } from '../../../../../shared/proto/packets/rsp/battle/BattleRewardRspProto';

/**
 * 战斗奖励包（显示物品奖励弹窗）
 * 
 * 客户端会显示 ItemInBagAlert 弹窗：
 * - 如果有物品奖励，逐个显示物品获得弹窗
 * - 如果有精灵奖励，显示精灵获得提示
 * 
 * 特殊物品ID：
 * - 1: 赛尔豆（金币）
 * - 3: 积累经验
 * - 500001-600000: 基地仓库物品
 * - 600001-700000: 投掷道具
 * - 其他: 储存箱物品
 */
export class PacketBattleReward extends BaseProto {
  private _data: Buffer;

  /**
   * @param items 物品奖励列表
   * @param petId 奖励精灵ID（可选）
   * @param captureTm 捕获时间（可选）
   * @param result 结果码（0=成功）
   */
  constructor(
    items: Array<{ itemId: number; itemCnt: number }>,
    petId: number = 0,
    captureTm: number = 0,
    result: number = 0
  ) {
    super(CommandID.COMPLETE_TASK);

    const proto = new BattleRewardRspProto();
    proto.taskId = 0;  // 战斗奖励不是任务，设为0
    proto.petId = petId;
    proto.captureTm = captureTm;
    proto.items = items;

    this._data = proto.serialize();
    this.setResult(result);
  }

  public serialize(): Buffer {
    return this._data;
  }

  public deserialize(_buffer: Buffer): void {
    throw new Error('PacketBattleReward.deserialize not implemented (response only)');
  }
}
