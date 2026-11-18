import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2319 PET_GET_EXP] 获取精灵经验分配信息响应
 *
 * Response Body:
 * - allocatableExp (uint32): 可分配的经验值
 */
export declare class PetGetExpRspProto extends BaseProto {
    allocatableExp: number;
    constructor(allocatableExp: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PetGetExpRspProto.d.ts.map