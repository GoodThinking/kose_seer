import { BaseProto } from '../../../base/BaseProto';
/**
 * 瞄准/交互响应
 * CMD: 2104 AIMAT
 */
export declare class AimatRspProto extends BaseProto {
    userId: number;
    targetType: number;
    targetId: number;
    x: number;
    y: number;
    constructor(userId?: number, targetType?: number, targetId?: number, x?: number, y?: number);
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=AimatRspProto.d.ts.map