import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { CatchMonsterReqProto } from '../../../../../shared/proto/packets/req/battle/CatchMonsterReqProto';

/**
 * [CMD: 2409 CATCH_MONSTER] 捕捉精灵
 */
@Opcode(CommandID.CATCH_MONSTER, InjectType.NONE)
export class CatchMonsterHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = CatchMonsterReqProto.fromBuffer(body);
    const capsuleID = req.itemId > 0 ? req.itemId : 300001;

    await player.BattleManager.HandleCatchMonster(capsuleID);
  }
}
