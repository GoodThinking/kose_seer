import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { FitmentAllReqProto } from '../../../../../shared/proto/packets/req/room/FitmentAllReqProto';
import { FitmentAllRspProto, IFitmentStorageInfo } from '../../../../../shared/proto/packets/rsp/room/FitmentAllRspProto';
import { Logger } from '../../../../../shared/utils/Logger';

/**
 * 获取所有家具处理器（仓库家具列表）
 * CMD 10007
 */
@Opcode(CommandID.FITMENT_ALL, InjectType.NONE)
export class FitmentAllHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    try {
      Logger.Info(`[FitmentAllHandler] 玩家 ${player.Uid} 请求仓库家具列表`);

      const fitments: IFitmentStorageInfo[] = player.ItemManager.ItemData.ItemList
        .filter(item => item.itemId >= 500001 && item.itemId <= 599999 && item.count > 0)
        .map(item => ({ id: item.itemId, usedCount: 0, allCount: item.count }));

      // 构建响应
      const rsp = new FitmentAllRspProto();
      rsp.setFitments(fitments);

      await player.SendPacket(rsp);

      Logger.Info(
        `[FitmentAllHandler] 返回仓库家具列表: uid=${player.Uid}, count=${fitments.length}`
      );

    } catch (error) {
      Logger.Error(`[FitmentAllHandler] 处理失败: uid=${player.Uid}`, error as Error);
      
      // 发生错误时返回空列表
      const rsp = new FitmentAllRspProto();
      rsp.setFitments([]);
      await player.SendPacket(rsp);
    }
  }
}
