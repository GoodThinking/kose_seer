import { BaseProto } from '../../../base/BaseProto';
/**
 * 获取精灵技能响应
 * CMD: 2336
 *
 * 协议格式：
 * - skillCount (4 bytes) - 技能数量
 * - skillId[] (4 bytes each) - 技能ID列表
 */
export declare class GetPetSkillRspProto extends BaseProto {
    skills: number[];
    serialize(): Buffer;
}
//# sourceMappingURL=GetPetSkillRspProto.d.ts.map