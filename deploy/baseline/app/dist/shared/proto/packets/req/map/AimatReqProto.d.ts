import { BaseProto } from '../../../base/BaseProto';
/**
 * 瞄准/交互请求
 * CMD: 2104 AIMAT
 */
export declare class AimatReqProto extends BaseProto {
    targetType: number;
    targetId: number;
    x: number;
    y: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=AimatReqProto.d.ts.map