import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2406 USE_PET_ITEM] 使用精灵道具响应
 */
export declare class UsePetItemRspProto extends BaseProto {
    userId: number;
    itemId: number;
    hp: number;
    change: number;
    constructor();
    serialize(): Buffer;
    setUserId(value: number): this;
    setItemId(value: number): this;
    setHP(hp: number, change: number): this;
}
//# sourceMappingURL=UsePetItemRspProto.d.ts.map