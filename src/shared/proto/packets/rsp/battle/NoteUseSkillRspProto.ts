import { ClientProtocol } from '../../../../protocol/ClientProtocol';
import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { BufferWriter } from '../../../../utils';
import { AttackValueProto } from '../../../common/AttackValueProto';

/**
 * [CMD: 2505 NOTE_USE_SKILL] 使用技能通知响应
 * 发送双方的攻击结果
 */
export class NoteUseSkillRspProto extends BaseProto {
  firstAttack: AttackValueProto;   // 先手攻击
  secondAttack: AttackValueProto;  // 后手攻击

  fieldEffects: Array<{ id: number; remainingRounds: number }> = [];
  shieldSnapshots: Array<{ userId: number; values: [number, number, number, number] }> = [];

  constructor() {
    super(CommandID.NOTE_USE_SKILL);
    this.firstAttack = new AttackValueProto();
    this.secondAttack = new AttackValueProto();
  }

  serialize(protocol: ClientProtocol = 'kose'): Buffer {
    const writer = new BufferWriter(1024);
    
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
        for (const value of shield.values) writer.WriteUInt32(value);
      }
    }
    
    return writer.ToBuffer();
  }

  // 链式调用
  setFirstAttack(attack: AttackValueProto): this {
    this.firstAttack = attack;
    return this;
  }

  setSecondAttack(attack: AttackValueProto): this {
    this.secondAttack = attack;
    return this;
  }
}
