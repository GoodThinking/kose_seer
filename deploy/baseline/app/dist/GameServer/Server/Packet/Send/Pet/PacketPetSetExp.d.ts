import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * [CMD: 2318 PET_SET_EXP] 设置精灵经验分配响应包
 *
 * 根据 Lua 端实现，只返回经验池剩余经验（4字节）
 */
export declare class PacketPetSetExp extends BaseProto {
    private _data;
    constructor(remainingAllocExp: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketPetSetExp.d.ts.map