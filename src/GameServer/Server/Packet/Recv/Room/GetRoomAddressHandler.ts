import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetRoomAddressReqProto } from '../../../../../shared/proto/packets/req/room/GetRoomAddressReqProto';
import { GetRoomAddressRspProto } from '../../../../../shared/proto/packets/rsp/room/GetRoomAddressRspProto';
import { Logger } from '../../../../../shared/utils/Logger';
import { PacketBuilder } from '../../../../../shared/protocol/PacketBuilder';
import { RoomTicketBinding } from './RoomTicketBinding';

/**
 * 获取房间地址处理器
 * CMD 10002
 * 
 * 返回房间服务器的连接信息（session、IP、端口）
 * 注意：当前服务端未实现独立的房间服务器，返回主服务器信息
 */
@Opcode(CommandID.GET_ROOM_ADDRES, InjectType.NONE)
export class GetRoomAddressHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    try {
      const req = GetRoomAddressReqProto.fromBuffer(body);
      
      // 确定目标用户ID
      let targetUserId = req.targetUserId;
      if (targetUserId === 0 || !targetUserId) {
        targetUserId = player.Uid;
      }
      
      Logger.Info(
        `[GetRoomAddressHandler] 玩家 ${player.Uid} 获取房间地址: ` +
        `target=${targetUserId}`
      );

      // TODO: 实现独立的房间服务器
      // 当前返回主服务器信息，客户端会检测到是同一个服务器（isIlk=true）
      
      const sessionBuffer = await RoomTicketBinding.Instance.Issue(session, targetUserId);

      // 获取当前服务器IP和端口
      // TODO: 从配置读取
      const serverIp = 0x7F000001; // 127.0.0.1 的十六进制表示
      const serverPort = 9999;

      // 构建响应
      const rsp = new GetRoomAddressRspProto();
      rsp.setAddress(sessionBuffer, serverIp, serverPort);

      await player.SendPacket(rsp);

      Logger.Debug(
        `[GetRoomAddressHandler] 返回房间地址: target=${targetUserId}, ` +
        `ip=127.0.0.1, port=${serverPort}`
      );

    } catch (error) {
      Logger.Error(`[GetRoomAddressHandler] 处理失败: uid=${player.Uid}`, error as Error);
      
      session.Socket.write(new PacketBuilder().Build(CommandID.GET_ROOM_ADDRES, session.UserID, 5001));
    }
  }
}
