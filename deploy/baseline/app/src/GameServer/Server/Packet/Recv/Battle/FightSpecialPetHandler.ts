import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { FightSpecialPetReqProto } from '../../../../../shared/proto/packets/req/battle/FightSpecialPetReqProto';
import { Logger } from '../../../../../shared/utils/Logger';

/**
 * [CMD: 2421 FIGHT_SPECIAL_PET] 挑战盖亚
 * 
 * 盖亚挑战逻辑：
 * - 客户端发送 param2
 * - 如果未匹配到地图配置，回退到盖亚
 */
@Opcode(CommandID.FIGHT_SPECIAL_PET, InjectType.NONE)
export class FightSpecialPetHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) {
      return;
    }

    const req = FightSpecialPetReqProto.fromBuffer(body);
    const param2 = req.param2;

    let mapId = player.Data.mapID || 1;
    if (mapId === 0) {
      mapId = 1;
    }

    Logger.Info(
      `[FightSpecialPetHandler] 收到盖亚挑战请求: UserID=${player.Uid}, ` +
      `MapID=${mapId}, Param2=${param2}`
    );

    // 调用 BattleManager 处理
    await player.BattleManager.HandleFightSpecialPet(mapId, param2);
  }
}
