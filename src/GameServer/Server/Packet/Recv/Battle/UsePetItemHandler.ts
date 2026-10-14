import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { UsePetItemReqProto } from '../../../../../shared/proto/packets/req/battle/UsePetItemReqProto';
import { PacketEmpty } from '../../Send/PacketEmpty';

/**
 * [CMD: 2406 USE_PET_ITEM] 使用精灵道具
 */
@Opcode(CommandID.USE_PET_ITEM, InjectType.NONE)
export class UsePetItemHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    let req: UsePetItemReqProto;
    try {
      req = UsePetItemReqProto.fromBuffer(body, player.ClientProtocol);
    } catch {
      await player.SendPacket(new PacketEmpty(CommandID.USE_PET_ITEM).setResult(5001));
      return;
    }
    await player.BattleManager.HandleUsePetItem(req.itemId, req.catchTime);
  }
}
