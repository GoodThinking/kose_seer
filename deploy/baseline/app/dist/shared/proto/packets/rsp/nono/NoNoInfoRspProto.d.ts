import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 9003 NONO_INFO] NoNo 信息响应
 *
 * 基于官方服务器抓包数据
 *
 * 字段列表（按官方顺序）：
 * - userID (4)
 * - flag (4)
 * - state (4)
 * - nick (16)
 * - superNono (4)
 * - color (4)
 * - power (4)
 * - mate (4)
 * - iq (4)
 * - ai (2) ← 注意：2字节！
 * - birth (4)
 * - chargeTime (4)
 * - func (20 bytes) ← 160位功能列表
 * - superEnergy (4)
 * - superLevel (4)
 * - superStage (4)
 *
 * 总长度：94字节
 */
export declare class NoNoInfoRspProto extends BaseProto {
    userID: number;
    flag: number;
    state: number;
    nick: string;
    superNono: number;
    color: number;
    power: number;
    mate: number;
    iq: number;
    ai: number;
    birth: number;
    chargeTime: number;
    func: boolean[];
    superEnergy: number;
    superLevel: number;
    superStage: number;
    constructor();
    serialize(): Buffer;
}
//# sourceMappingURL=NoNoInfoRspProto.d.ts.map