import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2318 PET_SET_EXP] 设置精灵经验分配响应
 *
 * 根据 Lua 端实现，只返回经验池剩余经验（4字节）
 * 客户端会通过 PET_LIST 刷新精灵信息
 *
 * Response Body:
 * - remainingAllocExp (uint32): 剩余可分配经验
 */
export declare class PetSetExpRspProto extends BaseProto {
    remainingAllocExp: number;
    constructor(remainingAllocExp: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PetSetExpRspProto.d.ts.map