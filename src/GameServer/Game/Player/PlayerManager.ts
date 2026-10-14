import { PlayerInstance } from './PlayerInstance';
import { IClientSession } from '../../Server/Packet/IHandler';
import { PacketBuilder } from '../../../shared/protocol/PacketBuilder';
import { ServerManager } from '../Server/ServerManager';
import { Logger } from '../../../shared/utils';
import { OnlineTracker } from './OnlineTracker';

/**
 * 玩家管理器
 * 管理所有在线玩家
 */
export class PlayerManager {
  private static _instance: PlayerManager;
  private _players: Map<number, PlayerInstance> = new Map();
  private _removals: Map<number, Promise<void>> = new Map();
  private _creations: Map<number, Promise<void>> = new Map();
  private _packetBuilder: PacketBuilder;
  private _serverManager?: ServerManager;

  private constructor(packetBuilder: PacketBuilder) {
    this._packetBuilder = packetBuilder;
  }

  /**
   * 获取单例实例
   */
  public static GetInstance(packetBuilder?: PacketBuilder): PlayerManager {
    if (!PlayerManager._instance) {
      if (!packetBuilder) {
        throw new Error('PacketBuilder is required for first initialization');
      }
      PlayerManager._instance = new PlayerManager(packetBuilder);
    }
    return PlayerManager._instance;
  }

  /**
   * 设置 ServerManager（用于在线状态追踪）
   */
  public SetServerManager(serverManager: ServerManager): void {
    this._serverManager = serverManager;
  }

  /**
   * 创建玩家实例
   */
  public async CreatePlayer(session: IClientSession, userID: number, nickname: string): Promise<PlayerInstance> {
    const previous = this._creations.get(userID) ?? Promise.resolve();
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    this._creations.set(userID, pending);
    await previous;
    try {
      return await this.CreatePlayerOnce(session, userID, nickname);
    } catch (error) {
      if (!session.Player) session.UserID = 0;
      throw error;
    } finally {
      release();
      if (this._creations.get(userID) === pending) this._creations.delete(userID);
    }
  }

  private async CreatePlayerOnce(session: IClientSession, userID: number, nickname: string): Promise<PlayerInstance> {
    if (session.Socket.destroyed) throw new Error('登录连接已关闭');
    // 如果玩家已存在，先移除旧的
    if (this._players.has(userID)) {
      Logger.Warn(`[PlayerManager] 玩家已存在，移除旧实例: ${userID}`);
      await this.RemovePlayer(userID);
    }
    if (session.Socket.destroyed) throw new Error('登录连接已关闭');

    // 创建新的玩家实例（不再需要传 nickname）
    const player = new PlayerInstance(session, userID, this._packetBuilder);
    await player.Initialize();
    if (session.Socket.destroyed) {
      await player.OnLogout();
      throw new Error('登录连接已关闭');
    }

    // 添加到管理器
    this._players.set(userID, player);
    
    // 设置到Session
    session.Player = player;
    session.UserID = userID;

    // 注册到在线追踪系统
    OnlineTracker.Instance.PlayerLogin(userID, session);

    // 通知 ServerManager 用户上线
    if (this._serverManager) {
      this._serverManager.UserOnline(userID);
    }

    Logger.Info(`[PlayerManager] 创建玩家实例: userID=${userID}, nickname=${nickname}`);
    return player;
  }

  /**
   * 获取玩家实例
   */
  public GetPlayer(userID: number): PlayerInstance | undefined {
    return this._players.get(userID);
  }

  /**
   * 移除玩家实例
   */
  public async RemovePlayer(userID: number, expectedPlayer?: PlayerInstance): Promise<void> {
    if (expectedPlayer && this._players.get(userID) !== expectedPlayer) return;
    const pending = this._removals.get(userID);
    if (pending) return pending;
    const removal = this.RemovePlayerOnce(userID);
    this._removals.set(userID, removal);
    try { await removal; } finally { this._removals.delete(userID); }
  }

  private async RemovePlayerOnce(userID: number): Promise<void> {
    const player = this._players.get(userID);
    if (player) {
      await player.OnLogout();
      this._players.delete(userID);
      
      // 从在线追踪系统移除
      OnlineTracker.Instance.PlayerLogout(userID);
      
      // 通知 ServerManager 用户下线
      if (this._serverManager) {
        this._serverManager.UserOffline(userID);
      }
      
      Logger.Info(`[PlayerManager] 移除玩家实例: ${userID}`);
    }
  }

  /**
   * 获取在线玩家数量
   */
  public GetOnlineCount(): number {
    return this._players.size;
  }

  /**
   * 获取所有在线玩家
   */
  public GetAllPlayers(): PlayerInstance[] {
    return Array.from(this._players.values());
  }

  /**
   * 检查玩家是否在线
   */
  public IsPlayerOnline(userID: number): boolean {
    return this._players.has(userID);
  }
}
