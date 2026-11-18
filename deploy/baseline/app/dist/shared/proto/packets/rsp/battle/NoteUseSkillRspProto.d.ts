import { BaseProto } from '../../../base/BaseProto';
import { AttackValueProto } from '../../../common/AttackValueProto';
/**
 * [CMD: 2505 NOTE_USE_SKILL] 使用技能通知响应
 * 发送双方的攻击结果
 */
export declare class NoteUseSkillRspProto extends BaseProto {
    firstAttack: AttackValueProto;
    secondAttack: AttackValueProto;
    constructor();
    serialize(): Buffer;
    setFirstAttack(attack: AttackValueProto): this;
    setSecondAttack(attack: AttackValueProto): this;
}
//# sourceMappingURL=NoteUseSkillRspProto.d.ts.map