import { DatabaseHelper } from '../../DataBase/DatabaseHelper';
import { Logger } from '../../shared/utils/Logger';
import { PlayerService } from './PlayerService';
import { ServerService } from './ServerService';
import { OnlineTracker } from '../../GameServer/Game/Player/OnlineTracker';
import { PlayerManager } from '../../GameServer/Game/Player/PlayerManager';
import { PacketItemBuy } from '../../GameServer/Server/Packet/Send/Item/PacketItemBuy';

export class GMService {
  private playerService: PlayerService;
  private serverService: ServerService;

  constructor() {
    this.playerService = new PlayerService();
    this.serverService = new ServerService();
  }
  // ==================== 玩家管理 ====================

  public async getPlayers(page: number, limit: number, search?: string, onlineOnly?: boolean): Promise<any> {
    return this.playerService.getPlayers(page, limit, search, onlineOnly);
  }

  public async getPlayerDetail(uid: number): Promise<any> {
    return this.playerService.getPlayerDetail(uid);
  }

  public async updatePlayer(uid: number, field: string, value: any): Promise<void> {
    return this.playerService.updatePlayer(uid, field, value);
  }

  public async banPlayer(uid: number, banType: number, reason?: string): Promise<void> {
    return this.playerService.banPlayer(uid, banType, reason);
  }

  public async kickPlayer(uid: number, reason?: string): Promise<void> {
    return this.playerService.kickPlayer(uid, reason);
  }

  // ==================== 物品管理 ====================

  public async giveItem(uid: number, itemId: number, count: number, expireTime: number = 0): Promise<void> {
    const itemData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_ItemData(uid);
    itemData.AddItem(itemId, count, expireTime);
    Logger.Info(`[GMService] 发送物品: uid=${uid}, itemId=${itemId}, count=${count}, expireTime=${expireTime}`);
    
    // 如果玩家在线，发送通知
    try {
      if (OnlineTracker.Instance.IsOnline(uid)) {
        const player = PlayerManager.GetInstance().GetPlayer(uid);
        if (player) {
          // 发送物品购买通知 (ITEM_BUY - CMD 2601)
          await player.SendPacket(new PacketItemBuy(
            player.Data.coins,  // 当前金币（不变）
            itemId,
            count,
            expireTime
          ));
          Logger.Info(`[GMService] 已发送物品通知给在线玩家: uid=${uid}, itemId=${itemId}, count=${count}`);
        }
      }
    } catch (error) {
      Logger.Warn(`[GMService] 发送物品通知失败: uid=${uid}, error=${error}`);
      // 不影响主流程，继续执行
    }
  }

  public async givePet(uid: number, petId: number, level: number, shiny: boolean): Promise<void> {
    const petData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(uid);
    // TODO: 实现发送精灵逻辑
    Logger.Info(`[GMService] 发送精灵: uid=${uid}, petId=${petId}, level=${level}, shiny=${shiny}`);
  }

  public async modifyCoins(uid: number, amount: number): Promise<void> {
    const playerData = await DatabaseHelper.Instance.GetInstance_PlayerData(uid);
    if (!playerData) {
      throw new Error('玩家不存在');
    }

    playerData.coins += amount;
    Logger.Info(`[GMService] 修改金币: uid=${uid}, amount=${amount}, newCoins=${playerData.coins}`);
  }

  // ==================== 服务器管理 ====================

  public async getServerStatus(): Promise<any> {
    return this.serverService.getServerStatus();
  }

  public async sendAnnouncement(message: string, type: string): Promise<void> {
    return this.serverService.sendAnnouncement(message, type);
  }

  // ==================== 日志查询 ====================

  public async getLogs(page: number, limit: number, type?: string, uid?: number): Promise<any> {
    // TODO: 实现日志查询
    // 从数据库查询操作日志
    return {
      total: 0,
      page,
      limit,
      logs: []
    };
  }
}
