import { BaseProto } from '../../../base/BaseProto';
/**
 * 修改颜色响应
 * CMD: 2063 CHANGE_COLOR
 */
export declare class ChangeColorRspProto extends BaseProto {
    userId: number;
    newColor: number;
    cost: number;
    remain: number;
    constructor(userId?: number, newColor?: number, cost?: number, remain?: number);
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=ChangeColorRspProto.d.ts.map