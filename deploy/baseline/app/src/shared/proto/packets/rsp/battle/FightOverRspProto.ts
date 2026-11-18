import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { BufferWriter } from '../../../../utils';

/**
 * [CMD: 2506 FIGHT_OVER] 战斗结束响应
 * 
 * 客户端格式（FightOverInfo.as）：
 * - reason: uint32 (结束原因)
 * - winnerId: uint32 (获胜者ID)
 * - twoTimes: uint32 (双倍经验次数)
 * - threeTimes: uint32 (三倍经验次数)
 * - autoFightTimes: uint32 (自动战斗次数)
 * - energyTimes: uint32 (能源采集次数)
 * - learnTimes: uint32 (学习次数)
 */
export class FightOverRspProto extends BaseProto {
  reason: number = 0;              // 结束原因 (0=正常结束, 1=对方逃跑, 2=超时, 3=平局, 4=系统错误, 5=NPC逃跑)
  winnerId: number = 0;            // 获胜者ID (玩家ID=胜利, 0=失败)
  twoTimes: number = 0;            // 双倍经验次数
  threeTimes: number = 0;          // 三倍经验次数
  autoFightTimes: number = 0;      // 自动战斗次数
  energyTimes: number = 0;         // 能源采集次数
  learnTimes: number = 0;          // 学习次数

  constructor() {
    super(CommandID.FIGHT_OVER);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(64);
    
    writer.WriteUInt32(this.reason);
    writer.WriteUInt32(this.winnerId);
    writer.WriteUInt32(this.twoTimes);
    writer.WriteUInt32(this.threeTimes);
    writer.WriteUInt32(this.autoFightTimes);
    writer.WriteUInt32(this.energyTimes);
    writer.WriteUInt32(this.learnTimes);
    
    return writer.ToBuffer();
  }

  // 链式调用
  setReason(value: number): this {
    this.reason = value;
    return this;
  }

  setWinnerId(value: number): this {
    this.winnerId = value;
    return this;
  }

  setTwoTimes(value: number): this {
    this.twoTimes = value;
    return this;
  }

  setThreeTimes(value: number): this {
    this.threeTimes = value;
    return this;
  }

  setAutoFightTimes(value: number): this {
    this.autoFightTimes = value;
    return this;
  }

  setEnergyTimes(value: number): this {
    this.energyTimes = value;
    return this;
  }

  setLearnTimes(value: number): this {
    this.learnTimes = value;
    return this;
  }
}
