import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2314 PET_EVOLVTION] 精灵进化响应
 *
 * 根据 Lua 端实现，返回 4 字节（通常为0表示成功）
 * 客户端会通过 PET_LIST 刷新精灵信息
 *
 * Response Body:
 * - status (uint32): 状态（0=成功）
 */
export declare class PetEvolutionRspProto extends BaseProto {
    status: number;
    constructor(status?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PetEvolutionRspProto.d.ts.map