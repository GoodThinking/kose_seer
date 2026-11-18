import { BaseManager } from '../Base/BaseManager';
import { Logger } from '../../../shared/utils';
import { GachaConfig } from '../../../shared/config/game/GachaConfig';
import { GachaRspProto } from '../../../shared/proto/packets/rsp/gacha/GachaRspProto';
import { ItemGainSource } from '../Event/EventTypes';

const GACHA_TICKET_ID = 400501;

export class GachaManager extends BaseManager {
  constructor(player: any) {
    super(player);
  }

  public async HandleGacha(times: number): Promise<void> {
    const playerData = this.Player.Data;
    const itemManager = this.Player.ItemManager;

    // 检查扭蛋牌数量
    const ticketCount = itemManager.GetItemCount(GACHA_TICKET_ID);
    if (ticketCount < times) {
      Logger.Info(`[GachaManager] 扭蛋牌不足: 需要=${times}, 已有=${ticketCount}`);
      await this.Player.SendPacket(new GachaRspProto());
      return;
    }

    // 消耗扭蛋牌
    itemManager.ConsumeItem(GACHA_TICKET_ID, times);

    const rewards: Map<number, number> = new Map();
    let lastItemId = 0;
    let lastCount = 0;

    for (let i = 0; i < times; i++) {
      const result = GachaConfig.Instance.RollGacha();
      if (result.itemID === 0) {
        Logger.Warn('[GachaManager] 奖池为空');
        continue;
      }

      // 通过 ItemManager 公开 API 添加物品
      await itemManager.GiveItem(result.itemID, result.count, ItemGainSource.GACHA);

      rewards.set(result.itemID, (rewards.get(result.itemID) || 0) + result.count);
      lastItemId = result.itemID;
      lastCount = result.count;
    }

    const rsp = new GachaRspProto();
    rsp.coins = playerData.coins || 0;
    rsp.petId = 0;
    rsp.catchTime = 0;
    rsp.itemCount = rewards.size;
    rsp.items = Array.from(rewards.entries()).map(([itemId, count]) => ({ itemId, count }));

    await this.Player.SendPacket(rsp);
    Logger.Info(`[GachaManager] 玩家 ${this.UserID} 抽${times}次, 获得${rewards.size}种物品, 最后获得: itemID=${lastItemId} count=${lastCount}`);
  }
}
