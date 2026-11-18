import { BaseProto } from '../../../base/BaseProto';
/**
 * 查询赛尔豆余额请求
 * CMD: 1105
 */
export declare class GoldCheckRemainReqProto extends BaseProto {
    constructor(cmdId: number);
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=GoldCheckRemainReqProto.d.ts.map