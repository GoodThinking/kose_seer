import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ShinyConfigReqProto } from '../../../../../shared/proto/packets/req/config/ShinyConfigReqProto';
import { ShinyConfigRspProto } from '../../../../../shared/proto/packets/rsp/config/ShinyConfigRspProto';
import { ShinyConfigManager } from '../../../../Game/Shiny/ShinyConfigManager';
import { Logger } from '../../../../../shared/utils/Logger';

/**
 * 异色配置请求处理器
 * CMD 109001
 */
@Opcode(CommandID.SHINY_CONFIG_GET, InjectType.NONE)
export class ShinyConfigHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    try {
      const req = new ShinyConfigReqProto();
      req.deserialize(body);

      Logger.Debug(`[ShinyConfigHandler] 客户端请求异色配置: uid=${player.Uid}`);

      // 获取服务端配置版本和数据
      const serverVersion = ShinyConfigManager.Instance.GetVersion();
      const configs = ShinyConfigManager.Instance.GetAllConfigs();

      // 构造响应
      const rsp = new ShinyConfigRspProto();
      rsp.version = serverVersion;
      rsp.configs = configs;

      // 添加当前地图的野怪异色信息
      const mapId = player.Data.mapID || 1;
      const ogres = player.MapSpawnManager.GetMapOgres(mapId);
      
      Logger.Debug(`[ShinyConfigHandler] 地图 ${mapId} 野怪列表:`);
      for (let i = 0; i < ogres.length; i++) {
        if (ogres[i].petId > 0) {
          Logger.Debug(
            `[ShinyConfigHandler]   槽位 ${i}: petId=${ogres[i].petId}, ` +
            `shiny=${ogres[i].shiny}, originalPetId=${ogres[i].originalPetId}`
          );
        }
      }
      
      for (let i = 0; i < ogres.length; i++) {
        if (ogres[i].shiny > 0) {
          rsp.mapOgres.push({
            index: i,
            shinyId: ogres[i].shiny
          });
          Logger.Debug(`[ShinyConfigHandler] 添加异色野怪: 槽位=${i}, shinyId=${ogres[i].shiny}`);
        }
      }

      Logger.Debug(
        `[ShinyConfigHandler] 发送异色配置: version=${serverVersion}, ` +
        `configs=${configs.length}, mapOgres=${rsp.mapOgres.length}`
      );

      // 发送响应
      await player.SendPacket(rsp);
    } catch (error) {
      Logger.Error(`[ShinyConfigHandler] 处理异色配置请求失败: uid=${player.Uid}`, error as Error);
    }
  }
}
