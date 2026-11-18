import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2312] 精灵技能切换请求
 *
 * 协议格式：
 * - catchTime (4 bytes) - 精灵捕获时间
 * - slot1 (4 bytes) - 技能槽位1 (0-3)
 * - slot2 (4 bytes) - 技能槽位2 (0-3)
 * - oldSkillId (4 bytes) - 旧技能ID
 * - newSkillId (4 bytes) - 新技能ID
 */
export declare class PetSkillSwitchReqProto extends BaseProto {
    catchTime: number;
    slot1: number;
    slot2: number;
    oldSkillId: number;
    newSkillId: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): PetSkillSwitchReqProto;
}
//# sourceMappingURL=PetSkillSwitchReqProto.d.ts.map