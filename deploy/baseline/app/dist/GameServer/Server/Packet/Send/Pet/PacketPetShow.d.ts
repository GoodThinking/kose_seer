import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 展示精灵响应包
 * CMD 2305
 */
export declare class PacketPetShow extends BaseProto {
    private _data;
    constructor(userId: number, catchTime: number, petId: number, flag: number, dv: number, skinId: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketPetShow.d.ts.map