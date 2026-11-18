import { IHandler, IClientSession, SessionType } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { RoomLoginReqProto } from '../../../../../shared/proto/packets/req/room/RoomLoginReqProto';
import { RoomLoginRspProto } from '../../../../../shared/proto/packets/rsp/room/RoomLoginRspProto';
import { EnterMapReqProto } from '../../../../../shared/proto/packets/req/map/EnterMapReqProto';
import { Logger } from '../../../../../shared/utils/Logger';
import { PlayerManager } from '../../../../Game/Player/PlayerManager';

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
      const req = RoomLoginReqProto.fromBuffer(body);
      
      // 从session中读取userId（前4字节）
      const userId = req.session.readUInt32BE(0);
      
      Logger.Info(
        `[RoomLoginHandler] 房间登录请求: userId=${userId}, roomId=${req.roomId}, ` +
        `mapType=${req.param1}, pos=(${req.param2}, ${req.param3})`
      );

      // 从PlayerManager获取已存在的Player对象
      const player = PlayerManager.GetInstance().GetPlayer(userId);
      if (!player) {
        Logger.Error(`[RoomLoginHandler] 玩家不在线: userId=${userId}`);
        const rsp = new RoomLoginRspProto();
        rsp.setResult(5001); // 玩家不存在
        
        // 直接通过socket发送（因为session还没有Player）
        const packet = Buffer.concat([
          Buffer.from([0x00, 0x00, 0x00, 0x00]), // length placeholder
          Buffer.from([0x27, 0x11]), // cmdId 10001
          Buffer.from([0x00, 0x00, 0x00, 0x00]), // userId
          Buffer.from([0x00, 0x00, 0x00, 0x00]), // seqId
          Buffer.from([0x00, 0x00, 0x13, 0xB9]), // result 5001
          rsp.serialize()
        ]);
        packet.writeUInt32BE(packet.length, 0);
        session.Socket.write(packet);
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
      await player.SendPacket(rsp);

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
    }
  }
}
