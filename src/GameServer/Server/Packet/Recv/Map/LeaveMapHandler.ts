import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { SummoningField } from '../../../../Game/Map/SummoningField';

/**
 * 离开地图处理器
 * CMD 1002
 */
@Opcode(CommandID.LEAVE_MAP, InjectType.NONE)
export class LeaveMapHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    SummoningField.Reset(player);
    await player.MapManager.HandleLeaveMap();
  }
}
