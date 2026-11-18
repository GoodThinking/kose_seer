"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteUseSkillRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
const utils_1 = require("../../../../utils");
const AttackValueProto_1 = require("../../../common/AttackValueProto");
/**
 * [CMD: 2505 NOTE_USE_SKILL] 使用技能通知响应
 * 发送双方的攻击结果
 */
class NoteUseSkillRspProto extends BaseProto_1.BaseProto {
    firstAttack; // 先手攻击
    secondAttack; // 后手攻击
    fieldEffects = [];
    shieldSnapshots = [];
    constructor() {
        super(CommandID_1.CommandID.NOTE_USE_SKILL);
        this.firstAttack = new AttackValueProto_1.AttackValueProto();
        this.secondAttack = new AttackValueProto_1.AttackValueProto();
    }
    serialize(protocol = 'kose') {
        const writer = new utils_1.BufferWriter(1024);
        writer.WriteBytes(this.firstAttack.serialize(protocol));
        writer.WriteBytes(this.secondAttack.serialize(protocol));
        if (protocol === 'xin-20261013') {
            // UseSkillInfo extension v1. Empty lists mean no engine-provided effects.
            writer.WriteUInt32(1);
            writer.WriteUInt32(this.fieldEffects.length);
            for (const effect of this.fieldEffects) {
                writer.WriteUInt32(effect.id);
                writer.WriteUInt32(effect.remainingRounds);
            }
            writer.WriteUInt32(this.shieldSnapshots.length);
            for (const shield of this.shieldSnapshots) {
                writer.WriteUInt32(shield.userId);
                for (const value of shield.values)
                    writer.WriteUInt32(value);
            }
        }
        return writer.ToBuffer();
    }
    // 链式调用
    setFirstAttack(attack) {
        this.firstAttack = attack;
        return this;
    }
    setSecondAttack(attack) {
        this.secondAttack = attack;
        return this;
    }
}
exports.NoteUseSkillRspProto = NoteUseSkillRspProto;
//# sourceMappingURL=NoteUseSkillRspProto.js.map