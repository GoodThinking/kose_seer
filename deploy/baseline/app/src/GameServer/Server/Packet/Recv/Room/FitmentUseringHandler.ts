import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { FitmentUseringReqProto } from '../../../../../shared/proto/packets/req/room/FitmentUseringReqProto';
import { FitmentUseringRspProto, IFitmentInfo } from '../../../../../shared/proto/packets/rsp/room/FitmentUseringRspProto';
import { Logger } from '../../../../../shared/utils/Logger';

/**
 * 使用家具处理器（查看房间家具）
 * CMD 10006
 */
@Opcode(CommandID.FITMENT_USERING, InjectType.NONE)
export class FitmentUseringHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    try {
      const req = FitmentUseringReqProto.fromBuffer(body);
      
      // 确定目标用户ID（访问谁的房间）
      let targetUserId = req.targetUserId;
      if (targetUserId === 0 || !targetUserId) {
        targetUserId = player.Uid;
      }
      
      Logger.Info(
        `[FitmentUseringHandler] 玩家 ${player.Uid} 访问房间: ` +
        `owner=${targetUserId}`
      );

      // TODO: 从数据库加载目标用户的家具列表
      // 暂时返回空列表
      const fitments: IFitmentInfo[] = [];

      // 构建响应
      const rsp = new FitmentUseringRspProto();
      rsp.setOwner(targetUserId, targetUserId); // roomId 默认使用 userId
      rsp.setFitments(fitments);

      await player.SendPacket(rsp);

      Logger.Info(
        `[FitmentUseringHandler] 返回家具列表: owner=${targetUserId}, ` +
        `visitor=${player.Uid}, count=${fitments.length}`
      );

    } catch (error) {
      Logger.Error(`[FitmentUseringHandler] 处理失败: uid=${player.Uid}`, error as Error);
      
      // 发生错误时返回空列表
      const rsp = new FitmentUseringRspProto();
      rsp.setOwner(player.Uid, player.Uid);
      rsp.setFitments([]);
      await player.SendPacket(rsp);
    }
  }
}
