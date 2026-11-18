import { BaseProto } from '../../../base/BaseProto';
/**
 * 更换服装响应
 * CMD 2604
 */
export declare class ChangeClothRspProto extends BaseProto {
    private userId;
    private clothIds;
    constructor(userId: number, clothIds: number[]);
    serialize(): Buffer;
}
//# sourceMappingURL=ChangeClothRspProto.d.ts.map