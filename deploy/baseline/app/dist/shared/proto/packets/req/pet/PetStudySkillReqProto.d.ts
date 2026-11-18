import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2307] 精灵学习技能请求
 *
 * 请求格式：
 * - catchTime: uint32 (精灵捕获时间)
 * - flag1: uint32 (未知标志，通常为1)
 * - flag2: uint32 (未知标志，通常为1)
 * - dropSkillId: uint32 (要替换掉的技能ID)
 * - studySkillId: uint32 (要学习的新技能ID)
 */
export declare class PetStudySkillReqProto extends BaseProto {
    catchTime: number;
    flag1: number;
    flag2: number;
    dropSkillId: number;
    studySkillId: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): PetStudySkillReqProto;
}
//# sourceMappingURL=PetStudySkillReqProto.d.ts.map