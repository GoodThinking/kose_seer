import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 更换服装响应包
 * CMD 2604
 */
export declare class PacketChangeCloth extends BaseProto {
    private _data;
    constructor(userId: number, clothIds: number[]);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketChangeCloth.d.ts.map