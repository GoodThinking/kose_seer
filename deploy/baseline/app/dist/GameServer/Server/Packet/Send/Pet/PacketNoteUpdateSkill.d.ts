import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { IUpdateSkillInfo } from '../../../../../shared/proto/packets/rsp/pet/NoteUpdateSkillRspProto';
/**
 * NOTE_UPDATE_SKILL 数据包 (2507)
 * 推送精灵技能更新信息
 */
export declare class PacketNoteUpdateSkill extends BaseProto {
    private _data;
    constructor(pets: IUpdateSkillInfo[]);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketNoteUpdateSkill.d.ts.map