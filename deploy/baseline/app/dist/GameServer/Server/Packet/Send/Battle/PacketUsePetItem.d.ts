import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 使用精灵道具包
 * CMD 2406
 */
export declare class PacketUsePetItem extends BaseProto {
    private _data;
    constructor(userId: number, itemId: number, hp: number, change: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketUsePetItem.d.ts.map