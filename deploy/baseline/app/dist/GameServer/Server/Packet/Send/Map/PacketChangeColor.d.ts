import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 修改颜色响应包
 * CMD 1008
 */
export declare class PacketChangeColor extends BaseProto {
    private _data;
    constructor(userId: number, newColor: number, cost: number, remain: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketChangeColor.d.ts.map