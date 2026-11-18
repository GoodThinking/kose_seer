import { BaseProto } from '../../../base/BaseProto';
/**
 * 开关飞行模式响应
 * CMD: 2112 ON_OR_OFF_FLYING
 */
export declare class OnOrOffFlyingRspProto extends BaseProto {
    userId: number;
    flyMode: number;
    constructor(userId?: number, flyMode?: number);
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=OnOrOffFlyingRspProto.d.ts.map