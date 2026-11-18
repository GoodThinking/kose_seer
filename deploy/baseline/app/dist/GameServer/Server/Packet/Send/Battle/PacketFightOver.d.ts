import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 战斗结束包
 * CMD 2506
 */
export declare class PacketFightOver extends BaseProto {
    private _data;
    constructor(reason: number, winnerId: number, twoTimes?: number, threeTimes?: number, autoFightTimes?: number, energyTimes?: number, learnTimes?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketFightOver.d.ts.map