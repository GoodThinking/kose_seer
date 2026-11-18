import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { SeeOnlineReqProto } from '../../../../../shared/proto/packets/req/friend/SeeOnlineReqProto';
import { SeeOnlineRspProto, IOnlineInfo } from '../../../../../shared/proto/packets/rsp/friend/SeeOnlineRspProto';
import { Logger } from '../../../../../shared/utils/Logger';
import { PlayerManager } from '../../../../Game/Player/PlayerManager';
import { OnlineTracker } from '../../../../Game/Player/OnlineTracker';

/**
 * 查看在线状态处理器
 * CMD 2157
 */
@Opcode(CommandID.SEE_ONLINE, InjectType.NONE)
export class SeeOnlineHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    try {
      const req = SeeOnlineReqProto.fromBuffer(body);
      
      Logger.Info(
        `[SeeOnlineHandler] 玩家 ${player.Uid} 查询在线状态: ` +
        `count=${req.count}, userIds=[${req.userIds.join(', ')}]`
      );

      // 查询在线用户
      const onlineUsers: IOnlineInfo[] = [];
      const playerManager = PlayerManager.GetInstance();
      
      for (const targetUserId of req.userIds) {
        // 检查用户是否在线
        if (OnlineTracker.Instance.IsOnline(targetUserId)) {
          const targetPlayer = playerManager.GetPlayer(targetUserId);
          
          if (targetPlayer) {
            onlineUsers.push({
              userId: targetUserId,
              serverId: 1, // 当前服务器ID
              mapType: 0,  // 默认地图类型
              mapId: targetPlayer.Data.mapID || 1
            });
          }
        }
      }

      // 构建响应
      const rsp = new SeeOnlineRspProto();
      rsp.setOnlineUsers(onlineUsers);

      await player.SendPacket(rsp);

      Logger.Info(
        `[SeeOnlineHandler] 返回在线状态: uid=${player.Uid}, ` +
        `requested=${req.count}, online=${onlineUsers.length}`
      );

    } catch (error) {
      Logger.Error(`[SeeOnlineHandler] 处理失败: uid=${player.Uid}`, error as Error);
      
      // 发生错误时返回空列表
      const rsp = new SeeOnlineRspProto();
      rsp.setOnlineUsers([]);
      await player.SendPacket(rsp);
    }
  }
}
