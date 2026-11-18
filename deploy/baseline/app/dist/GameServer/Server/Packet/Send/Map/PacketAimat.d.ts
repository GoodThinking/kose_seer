import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 瞄准/交互响应包
 * CMD 1010
 */
export declare class PacketAimat extends BaseProto {
    private _data;
    constructor(userId: number, targetType: number, targetId: number, x: number, y: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketAimat.d.ts.map