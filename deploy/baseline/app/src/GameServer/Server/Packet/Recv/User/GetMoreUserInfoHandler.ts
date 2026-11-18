import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetMoreUserInfoReqProto } from '../../../../../shared/proto/packets/req/user/GetMoreUserInfoReqProto';
import { PacketGetMoreUserInfo } from '../../Send/User/PacketGetMoreUserInfo';
import { DatabaseHelper } from '../../../../../DataBase/DatabaseHelper';
import { Logger } from '../../../../../shared/utils/Logger';

/**
 * [CMD: 2052] 获取更多用户信息
 */
@Opcode(CommandID.GET_MORE_USERINFO, InjectType.NONE)
export class GetMoreUserInfoHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = GetMoreUserInfoReqProto.fromBuffer(body);

    try {
      // 获取目标用户的数据（跟GM一样的逻辑）
      let targetPlayerData = await DatabaseHelper.Instance.GetInstance_PlayerData(req.userId);
      if (!targetPlayerData) {
        // 如果缓存中没有，从数据库加载
        targetPlayerData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PlayerData(req.userId);
        if (!targetPlayerData) {
          Logger.Warn(`[GetMoreUserInfoHandler] 玩家不存在: TargetUserId=${req.userId}`);
          return;
        }
      }

      // 使用 GetInstanceOrCreateNew 从数据库加载精灵数据
      const petData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(req.userId);

      // 实时更新精灵统计信息（跟GM一样）
      if (petData) {
        targetPlayerData.petAllNum = petData.PetList.length;
        if (petData.PetList.length > 0) {
          targetPlayerData.petMaxLev = Math.max(...petData.PetList.map(p => p.level));
        } else {
          targetPlayerData.petMaxLev = 0;
        }
        Logger.Info(`[GetMoreUserInfoHandler] 实时更新精灵统计: userId=${req.userId}, petAllNum=${targetPlayerData.petAllNum}, petMaxLev=${targetPlayerData.petMaxLev}`);
      }

      // 发送响应
      await player.SendPacket(new PacketGetMoreUserInfo(targetPlayerData));
      
    } catch (error) {
      Logger.Error(`[GetMoreUserInfoHandler] 查询用户信息失败: TargetUserId=${req.userId}`, error as Error);
    }
  }
}
