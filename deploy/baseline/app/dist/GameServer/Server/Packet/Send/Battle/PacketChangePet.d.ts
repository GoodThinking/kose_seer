import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 更换精灵包
 * CMD 2407
 */
export declare class PacketChangePet extends BaseProto {
    private _data;
    constructor(userId: number, petId: number, petName: string, level: number, hp: number, maxHp: number, catchTime: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketChangePet.d.ts.map