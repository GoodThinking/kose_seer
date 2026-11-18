import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 恢复单个精灵HP包
 * CMD 2310
 */
export declare class PacketPetOneCure extends BaseProto {
    private _data;
    constructor(catchTime: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketPetOneCure.d.ts.map