import { BaseProto } from '../../../base/BaseProto';
/**
 * 请求异色配置
 * CMD 109001
 */
export declare class ShinyConfigReqProto extends BaseProto {
    clientVersion: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=ShinyConfigReqProto.d.ts.map