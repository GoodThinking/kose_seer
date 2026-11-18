import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2405 USE_SKILL] 使用技能请求
 */
export declare class UseSkillReqProto extends BaseProto {
    skillId: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): UseSkillReqProto;
}
//# sourceMappingURL=UseSkillReqProto.d.ts.map