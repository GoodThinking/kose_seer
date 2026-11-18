import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GachaReqProto } from '../../../../../shared/proto/packets/req/gacha/GachaReqProto';

/**
 * 扭蛋机处理器
 * CMD 3201
 */
@Opcode(CommandID.EGG_GAME_PLAY, InjectType.NONE)
export class GachaHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new GachaReqProto();
    req.deserialize(body);

    await player.GachaManager.HandleGacha(req.times);
  }
}
