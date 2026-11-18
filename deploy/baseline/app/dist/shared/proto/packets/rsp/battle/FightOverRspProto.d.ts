import { BaseProto } from '../../../base/BaseProto';
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
export declare class FightOverRspProto extends BaseProto {
    reason: number;
    winnerId: number;
    twoTimes: number;
    threeTimes: number;
    autoFightTimes: number;
    energyTimes: number;
    learnTimes: number;
    constructor();
    serialize(): Buffer;
    setReason(value: number): this;
    setWinnerId(value: number): this;
    setTwoTimes(value: number): this;
    setThreeTimes(value: number): this;
    setAutoFightTimes(value: number): this;
    setEnergyTimes(value: number): this;
    setLearnTimes(value: number): this;
}
//# sourceMappingURL=FightOverRspProto.d.ts.map