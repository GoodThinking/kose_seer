import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { LeaveRoomReqProto } from '../../../../../shared/proto/packets/req/room/LeaveRoomReqProto';
import { LeaveRoomRspProto } from '../../../../../shared/proto/packets/rsp/room/LeaveRoomRspProto';
import { EnterMapReqProto } from '../../../../../shared/proto/packets/req/map/EnterMapReqProto';
import { Logger } from '../../../../../shared/utils/Logger';

/**
 * 离开房间处理器
 * CMD 10003
 * 
 * 玩家从房间地图离开，返回普通地图
 * 
 * 客户端流程：
 * 1. 通过mainSocket发送LEAVE_ROOM
 * 2. 收到LEAVE_ROOM响应后，关闭roomSocket
 * 3. 客户端期望自动进入目标地图，但代码中缺少发送ENTER_MAP的逻辑
 * 4. 因此服务端在LEAVE_ROOM成功后，自动触发ENTER_MAP处理
 */
@Opcode(CommandID.LEAVE_ROOM, InjectType.NONE)
export class LeaveRoomHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    try {
      const req = LeaveRoomReqProto.fromBuffer(body);
      
      Logger.Info(
        `[LeaveRoomHandler] 玩家 ${player.Uid} 离开房间: ` +
        `targetMapId=${req.mapId}, catchTime=${req.catchTime}`
      );

      // 返回空响应
      const rsp = new LeaveRoomRspProto();
      await player.SendPacket(rsp);

      Logger.Info(`[LeaveRoomHandler] 离开房间成功: uid=${player.Uid}`);

      // 自动触发ENTER_MAP处理
      // 因为客户端在LEAVE_ROOM后没有发送ENTER_MAP，服务端主动触发
      if (req.mapId > 0) {
        Logger.Info(
          `[LeaveRoomHandler] 自动触发ENTER_MAP: mapId=${req.mapId}`
        );
        
        const enterMapReq = new EnterMapReqProto();
        enterMapReq.mapType = 0; // 普通地图类型
        enterMapReq.mapId = req.mapId;
        enterMapReq.x = 500; // 默认坐标
        enterMapReq.y = 300;
        
        await player.MapManager.HandleEnterMap(enterMapReq);
      }

    } catch (error) {
      Logger.Error(`[LeaveRoomHandler] 处理失败: uid=${player.Uid}`, error as Error);
      
      // 发生错误时也返回空响应
      const rsp = new LeaveRoomRspProto();
      await player.SendPacket(rsp);
    }
  }
}
