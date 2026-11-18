import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 获取精灵技能响应包
 * CMD: 2336
 */
export declare class PacketGetPetSkill extends BaseProto {
    private _data;
    constructor(skills: number[]);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketGetPetSkill.d.ts.map