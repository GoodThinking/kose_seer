import { BaseProto } from '../../../base/BaseProto';
/**
 * 修改颜色请求
 * CMD: 2063 CHANGE_COLOR
 */
export declare class ChangeColorReqProto extends BaseProto {
    newColor: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=ChangeColorReqProto.d.ts.map