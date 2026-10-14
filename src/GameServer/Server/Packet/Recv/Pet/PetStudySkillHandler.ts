import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetStudySkillReqProto } from '../../../../../shared/proto/packets/req/pet/PetStudySkillReqProto';
import { PacketEmpty } from '../../Send/PacketEmpty';

/**
 * [CMD: 2307] 精灵学习技能（替换技能）
 */
@Opcode(CommandID.PET_STUDY_SKILL, InjectType.NONE)
export class PetStudySkillHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // 固定 XIN/旧 core 仅证实五个 UInt32、flag1/flag2=1/1 的单技能替换。
    // 不将截断、额外负载或未知标志静默解释为这一请求形式。
    if (body.length !== 20) {
      await player.SendPacket(new PacketEmpty(CommandID.PET_STUDY_SKILL).setResult(5001));
      return;
    }
    const req = PetStudySkillReqProto.fromBuffer(body);
    if (req.flag1 !== 1 || req.flag2 !== 1) {
      await player.SendPacket(new PacketEmpty(CommandID.PET_STUDY_SKILL).setResult(5001));
      return;
    }
    await player.PetManager.HandleStudySkill(req.catchTime, req.studySkillId, req.dropSkillId);
  }
}
