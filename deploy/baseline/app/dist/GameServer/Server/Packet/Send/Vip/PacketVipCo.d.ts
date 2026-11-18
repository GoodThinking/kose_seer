import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * VIP状态变更响应包
 * CMD 8006
 *
 * 用于通知客户端VIP状态变化（开通超级NoNo、VIP到期等）
 */
export declare class PacketVipCo extends BaseProto {
    private _data;
    constructor(userId: number, vipType: number, autoCharge?: number, vipEndTime?: number, superLevel?: number, superEnergy?: number, superStage?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketVipCo.d.ts.map