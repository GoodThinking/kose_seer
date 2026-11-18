import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * NoNo 玩耍响应包
 * CMD 9013
 */
export declare class PacketNoNoPlay extends BaseProto {
    private _data;
    constructor(power: number, ai: number, mate: number, iq: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketNoNoPlay.d.ts.map