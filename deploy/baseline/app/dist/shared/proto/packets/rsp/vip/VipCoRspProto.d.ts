import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: VIP_CO (8006)] VIP状态变更响应
 *
 * 用于通知客户端VIP状态变化（开通超级NoNo、VIP到期等）
 *
 * Response Body:
 * - userId (uint32): 玩家ID
 * - vipType (uint32): VIP类型 (0=无VIP, 1=普通VIP, 2=超级NoNo)
 * - autoCharge (uint32): 自动充电
 * - vipEndTime (uint32): VIP结束时间（秒级时间戳）
 *
 * 扩展字段（客户端会忽略，但可用于调试）:
 * - superLevel (uint32): 超级NoNo等级（仅当vipType=2时有效）
 * - superEnergy (uint32): 超级NoNo能量
 * - superStage (uint32): 超级NoNo阶段
 */
export declare class VipCoRspProto extends BaseProto {
    userId: number;
    vipType: number;
    autoCharge: number;
    vipEndTime: number;
    superLevel: number;
    superEnergy: number;
    superStage: number;
    constructor();
    serialize(): Buffer;
    setUserId(value: number): this;
    setVipType(value: number): this;
    setAutoCharge(value: number): this;
    setVipEndTime(value: number): this;
    setSuperLevel(value: number): this;
    setSuperEnergy(value: number): this;
    setSuperStage(value: number): this;
}
//# sourceMappingURL=VipCoRspProto.d.ts.map