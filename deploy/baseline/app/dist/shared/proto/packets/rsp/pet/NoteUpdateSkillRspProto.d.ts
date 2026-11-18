import { BaseProto } from '../../../base/BaseProto';
/**
 * NOTE_UPDATE_SKILL 响应协议 (2507)
 * 推送精灵技能更新信息（用于显示技能学习界面）
 *
 * 数据结构：
 * - count: uint32 (更新的精灵数量)
 * - pets: UpdateSkillInfo[] (精灵技能更新信息数组)
 *
 * UpdateSkillInfo 结构：
 * - catchTime: uint32
 * - activeSkillCount: uint32 (已激活技能数量，技能槽未满时直接学习)
 * - unactiveSkillCount: uint32 (未激活技能数量，技能槽已满时需要替换)
 * - activeSkills: uint32[] (已激活技能ID列表)
 * - unactiveSkills: uint32[] (未激活技能ID列表)
 */
export interface IUpdateSkillInfo {
    catchTime: number;
    activeSkills: number[];
    unactiveSkills: number[];
}
export declare class NoteUpdateSkillRspProto extends BaseProto {
    pets: IUpdateSkillInfo[];
    constructor();
    serialize(): Buffer;
    deserialize(buffer: Buffer): void;
}
//# sourceMappingURL=NoteUpdateSkillRspProto.d.ts.map