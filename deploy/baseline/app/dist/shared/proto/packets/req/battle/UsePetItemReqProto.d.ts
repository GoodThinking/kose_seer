import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2406 USE_PET_ITEM] 使用精灵道具请求
 */
export declare class UsePetItemReqProto extends BaseProto {
    itemId: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): UsePetItemReqProto;
}
//# sourceMappingURL=UsePetItemReqProto.d.ts.map