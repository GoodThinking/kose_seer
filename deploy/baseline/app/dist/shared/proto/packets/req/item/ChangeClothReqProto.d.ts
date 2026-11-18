import { BaseProto } from '../../../base/BaseProto';
/**
 * 更换服装请求
 * CMD 2604
 */
export declare class ChangeClothReqProto extends BaseProto {
    clothIds: number[];
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=ChangeClothReqProto.d.ts.map