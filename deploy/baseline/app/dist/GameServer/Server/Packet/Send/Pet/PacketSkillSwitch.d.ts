import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * PET_SKILL_SWICTH 数据包 (2312)
 * 精灵技能切换响应
 */
export declare class PacketSkillSwitch extends BaseProto {
    private _data;
    constructor(petId: number);
    serialize(): Buffer;
    deserialize(_buffer: Buffer): void;
}
//# sourceMappingURL=PacketSkillSwitch.d.ts.map