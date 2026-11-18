import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetOneCureReqProto } from '../../../../../shared/proto/packets/req/pet/PetOneCureReqProto';
import { Logger } from '../../../../../shared/utils';

/**
 * [CMD: 2310 PET_ONE_CURE] 恢复单个精灵HP
 */
@Opcode(CommandID.PET_ONE_CURE, InjectType.NONE)
export class PetOneCureHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new PetOneCureReqProto();
    req.deserialize(body);

    Logger.Debug(`[PetOneCureHandler] CatchTime=${req.catchTime}, Coins=${req.coins}, BodyLen=${body.length}`);

    await player.PetManager.HandlePetOneCure(req.catchTime, req.coins);
  }
}
