import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * NoNo 信息响应包
 * CMD 9003
 *
 * 基于官方服务器抓包数据
 */
export declare class PacketNoNoInfo extends BaseProto {
    private _data;
    constructor(userID: number, flag: number, state: number, nick: string, superNono: number, color: number, power: number, mate: number, iq: number, ai: number, birth: number, chargeTime: number, superEnergy: number, superLevel: number, superStage: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketNoNoInfo.d.ts.map