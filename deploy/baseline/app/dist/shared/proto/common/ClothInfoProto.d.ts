import { BaseProto } from '../base/BaseProto';
/**
 * 服装信息Proto
 */
export declare class ClothInfoProto extends BaseProto {
    id: number;
    type: number;
    expireTime: number;
    constructor();
    serialize(): Buffer;
}
/**
 * 服装列表Proto
 */
export declare class ClothListProto extends BaseProto {
    clothes: ClothInfoProto[];
    constructor();
    serialize(): Buffer;
}
//# sourceMappingURL=ClothInfoProto.d.ts.map