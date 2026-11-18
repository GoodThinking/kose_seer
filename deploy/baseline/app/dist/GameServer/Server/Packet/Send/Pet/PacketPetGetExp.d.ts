import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 获取精灵经验分配信息响应包
 * CMD 2319
 */
export declare class PacketPetGetExp extends BaseProto {
    private _data;
    constructor(allocatableExp: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketPetGetExp.d.ts.map