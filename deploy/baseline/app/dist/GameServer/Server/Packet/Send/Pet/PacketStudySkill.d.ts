import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * PET_STUDY_SKILL 数据包 (2307)
 * 精灵学习技能响应
 */
export declare class PacketStudySkill extends BaseProto {
    private _data;
    constructor();
    serialize(): Buffer;
    deserialize(_buffer: Buffer): void;
}
//# sourceMappingURL=PacketStudySkill.d.ts.map