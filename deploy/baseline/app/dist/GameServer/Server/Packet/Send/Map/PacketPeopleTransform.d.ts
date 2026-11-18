import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 玩家变身响应包
 * CMD 1011
 */
export declare class PacketPeopleTransform extends BaseProto {
    private _data;
    constructor(userId: number, transId: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketPeopleTransform.d.ts.map