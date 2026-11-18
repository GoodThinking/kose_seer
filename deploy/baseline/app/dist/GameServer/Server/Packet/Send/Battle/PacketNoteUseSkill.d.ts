import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { AttackValueProto } from '../../../../../shared/proto/common/AttackValueProto';
/**
 * 使用技能通知包
 * CMD 2505
 */
export declare class PacketNoteUseSkill extends BaseProto {
    private _data;
    constructor(firstAttack: AttackValueProto, secondAttack: AttackValueProto);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketNoteUseSkill.d.ts.map