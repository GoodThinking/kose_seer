import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2328 Skill_Sort] 技能排序请求
 *
 * 请求格式：
 * - catchTime (uint32): 精灵捕获时间
 * - skill1 (uint32): 技能槽1的技能ID
 * - skill2 (uint32): 技能槽2的技能ID
 * - skill3 (uint32): 技能槽3的技能ID
 * - skill4 (uint32): 技能槽4的技能ID
 */
export declare class SkillSortReqProto extends BaseProto {
    catchTime: number;
    skill1: number;
    skill2: number;
    skill3: number;
    skill4: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
    getSkillArray(): number[];
}
//# sourceMappingURL=SkillSortReqProto.d.ts.map