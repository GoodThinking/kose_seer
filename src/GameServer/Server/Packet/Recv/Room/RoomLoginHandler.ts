import { IHandler, IClientSession, SessionType } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { RoomLoginReqProto } from '../../../../../shared/proto/packets/req/room/RoomLoginReqProto';
import { RoomLoginRspProto } from '../../../../../shared/proto/packets/rsp/room/RoomLoginRspProto';
import { EnterMapReqProto } from '../../../../../shared/proto/packets/req/map/EnterMapReqProto';
import { Logger } from '../../../../../shared/utils/Logger';
import { PacketBuilder } from '../../../../../shared/protocol/PacketBuilder';
import { RoomTicketBinding } from './RoomTicketBinding';

/**
 * 房间登录处理器
 * CMD 10001
 * 
 * 玩家进入房间时的登录验证
 * 注意：房间连接是新的TCP连接，需要通过session关联到已有的Player
 * 
 * 客户端流程：
 * 1. 连接roomSocket → 发送ROOM_LOGIN
 * 2. 收到ROOM_LOGIN响应后，客户端代码中缺少发送ENTER_MAP的逻辑
 * 3. 因此服务端在ROOM_LOGIN成功后，自动触发ENTER_MAP处理
 */
@Opcode(CommandID.ROOM_LOGIN, InjectType.NONE)
export class RoomLoginHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    try {
      if (body.length !== 44) {
        session.Socket.write(new PacketBuilder().Build(CommandID.ROOM_LOGIN, head.UserID, 5001));
        return;
      }
      const req = RoomLoginReqProto.fromBuffer(body);
      
      // 从session中读取userId（前4字节）
      const userId = req.session.readUInt32BE(0);
      
      Logger.Info(
        `[RoomLoginHandler] 房间登录请求: userId=${userId}, roomId=${req.roomId}, ` +
        `mapType=${req.param1}, pos=(${req.param2}, ${req.param3})`
      );

      // Authenticate the whole ticket before binding the room connection or entering a map.
      const player = await RoomTicketBinding.Instance.Validate(session, head.UserID, req.roomId, req.session);
      if (!player || !RoomTicketBinding.Instance.CanBind(session, player, req.roomId, req.session)) {
        Logger.Warn(`[RoomLoginHandler] 房间认证未通过: userId=${userId}, roomId=${req.roomId}`);
        session.Socket.write(new PacketBuilder().Build(CommandID.ROOM_LOGIN, head.UserID, 5001));
        return;
      }

      // 关联session到Player，并标记为ROOM类型
      session.UserID = userId;
      session.Player = player;
      session.Type = SessionType.ROOM; // 标记为房间连接

      Logger.Info(
        `[RoomLoginHandler] 房间登录成功: userId=${userId}, roomId=${req.roomId}`
      );

      // 返回成功响应（空响应）
      const rsp = new RoomLoginRspProto();
      session.Socket.write(new PacketBuilder().Build(CommandID.ROOM_LOGIN, userId, rsp.getResult(), rsp.serialize()));

      // 自动触发ENTER_MAP处理
      // 因为客户端在ROOM_LOGIN后没有发送ENTER_MAP，服务端主动触发
      Logger.Info(
        `[RoomLoginHandler] 自动触发ENTER_MAP: mapType=${req.param1}, ` +
        `mapId=${req.roomId}, pos=(${req.param2}, ${req.param3})`
      );
      
      const enterMapReq = new EnterMapReqProto();
      enterMapReq.mapType = req.param1;
      enterMapReq.mapId = req.roomId;
      enterMapReq.x = req.param2;
      enterMapReq.y = req.param3;
      
      await player.MapManager.HandleEnterMap(enterMapReq);

    } catch (error) {
      Logger.Error(`[RoomLoginHandler] 处理失败`, error as Error);
      session.Socket.write(new PacketBuilder().Build(CommandID.ROOM_LOGIN, head.UserID, 5001));
    }
  }
}
