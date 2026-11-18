import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 捕捉精灵包
 * CMD 2409
 */
export declare class PacketCatchMonster extends BaseProto {
    private _data;
    constructor(catchTime: number, petId: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketCatchMonster.d.ts.map