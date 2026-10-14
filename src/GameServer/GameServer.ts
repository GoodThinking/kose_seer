import { createServer, Server } from 'net';
import { Config } from '../shared/config';
import { ConfigRegistry, GetGameConfigRegistrations } from '../shared/config';
import { PacketBuilder, HeadInfo } from '../shared/protocol';
import { Logger, Handlers, InjectType } from '../shared';
import { SessionManager, IInternalSession } from './Server/Session';
import { PolicyHandler } from './Server/PolicyHandler';
import { LoginManager } from './Game/Login';
import { RegisterManager } from './Game/Register';
import { ServerManager } from './Game/Server';
import { PlayerManager } from './Game/Player/PlayerManager';
// Note: ItemManager, MapManager, PetManager are now created per-player in PlayerInstance
import { IHandler, SessionType } from './Server/Packet/IHandler';
import { DatabaseManager } from '../DataBase';
import { DataSaver } from '../DataBase/savers/DataSaver';

// 导入所有Handler以触发装饰器注册
import './Server/Packet/Recv';

/**
 * 游戏服务器
 */
export class GameServer {
  private _server: Server;
  private _sessionManager: SessionManager;
  private _packetBuilder: PacketBuilder;
  private _loginManager: LoginManager;
  private _registerManager: RegisterManager;
  private _serverManager: ServerManager;
  // Note: ItemManager, MapManager, PetManager are now created per-player in PlayerInstance
  private _handlers: Map<number, IHandler>;
  private _running: boolean = false;
  private _stopping = false;
  private _stopPromise: Promise<void> | null = null;
  private _requests = new Set<Promise<void>>();
  private _logouts = new Set<Promise<void>>();

  constructor() {
    this._server = createServer();
    this._sessionManager = new SessionManager('1');
    this._packetBuilder = new PacketBuilder('1');
    this._loginManager = new LoginManager(this._packetBuilder);
    this._registerManager = new RegisterManager(this._packetBuilder);
    this._serverManager = new ServerManager(this._packetBuilder);
    // Note: ItemManager, MapManager, PetManager are now created per-player in PlayerInstance
    // this._mapManager = new MapManager();
    // this._petManager = new PetManager();
    // this._itemManager = new ItemManager();
    this._handlers = new Map();

    // 连接 PlayerManager 和 ServerManager
    const playerManager = PlayerManager.GetInstance(this._packetBuilder);
    playerManager.SetServerManager(this._serverManager);

    this.RegisterHandlers();
    this.SetupConnectionHandler();
  }

  /**
   * 注册命令处理器 (通过装饰器自动注册)
   */
  private RegisterHandlers(): void {
    const registeredHandlers = Handlers.GetAll();

    Logger.Info(`[GameServer] 开始注册包处理器，共 ${registeredHandlers.size} 个`);

    for (const [cmdID, HandlerClass] of registeredHandlers) {
      let handler: IHandler;

      // 根据装饰器声明的 InjectType 注入依赖
      switch (HandlerClass.INJECT) {
        case InjectType.LOGIN_MANAGER:
          handler = new HandlerClass(this._loginManager);
          break;
        case InjectType.REGISTER_MANAGER:
          handler = new HandlerClass(this._registerManager);
          break;
        case InjectType.SERVER_MANAGER:
          handler = new HandlerClass(this._serverManager);
          break;
        // Note: MAP_MANAGER, PET_MANAGER, ITEM_MANAGER cases removed
        // These managers are now accessed via player.XxxManager
        default:
          handler = new HandlerClass();
          break;
      }

      this._handlers.set(cmdID, handler);
    }

    Logger.Info(`[GameServer] 已注册 ${this._handlers.size} 个命令处理器`);
  }

  /**
   * 设置连接处理
   */
  private SetupConnectionHandler(): void {
    this._server.on('connection', (socket) => {
      if (this._stopping) { socket.destroy(); return; }
      const session = this._sessionManager.CreateSession(socket);

      socket.on('data', (data) => {
        this.HandleData(session, data);
      });

      socket.on('error', (err) => {
        Logger.Error(`Socket错误: ${session.Address}`, err);
      });

      socket.on('close', () => {
        const logout = this.HandleSocketClose(session);
        this._logouts.add(logout);
        void logout.then(() => this._logouts.delete(logout), err => {
          this._logouts.delete(logout);
          Logger.Error(`[GameServer] 玩家断线保存失败: ${session.UserID}`, err as Error);
        });
      });
    });
  }

  private async HandleSocketClose(session: IInternalSession): Promise<void> {
    try {
      // 只有主连接断开时才登出玩家
      // 房间连接断开不应该触发登出
      if (session.UserID > 0 && session.Type === SessionType.MAIN) {
        Logger.Info(`[GameServer] 玩家断开连接: UserID=${session.UserID}, Address=${session.Address}`);
        if (session.Player) await PlayerManager.GetInstance().RemovePlayer(session.UserID, session.Player);
      } else if (session.UserID > 0 && session.Type === SessionType.ROOM) {
        Logger.Info(`[GameServer] 房间连接断开: UserID=${session.UserID}, Address=${session.Address}`);
      }
    } finally {
      this._sessionManager.RemoveSession(session.Address);
    }
  }

  /**
   * 处理接收到的数据
   */
  private HandleData(session: IInternalSession, data: Buffer): void {
    if (this._stopping) return;
    // 检查是否是 Flash Socket Policy 请求
    if (!session.PolicyHandled) {
      if (PolicyHandler.Handle(session.Socket, data, session.Address)) {
        session.PolicyHandled = true;
        return;
      }
      session.PolicyHandled = true;
    }

    session.Parser.Append(data);

    let packet;
    while ((packet = session.Parser.TryParse()) !== null) {
      const request = this.ProcessPacket(session, packet.head, packet.body);
      this._requests.add(request);
      void request.then(() => this._requests.delete(request), () => this._requests.delete(request));
    }
  }

  /**
   * 处理数据包
   */
  private async ProcessPacket(session: IInternalSession, head: HeadInfo, body: Buffer): Promise<void> {
    const handler = this._handlers.get(head.CmdID);
    if (handler) {
      try {
        await handler.Handle(session, head, body);
      } catch (err) {
        Logger.Error(`处理命令失败 CMD=${head.CmdID}`, err instanceof Error ? err : undefined);
      }
    } else {
      Logger.Warn(`未处理的命令 CMD=${head.CmdID}`);
    }
  }

  /**
   * 启动服务器
   */
  public async Start(): Promise<void> {
    if (this._running) return;
    if (this._stopPromise) await this._stopPromise;
    this._stopPromise = null;
    this._stopping = false;
    DataSaver.Instance.Resume();
    // 1. 注册游戏配置
    // 启动全部服务，Index会先注册配置，所以跳过再次注册
    if (!ConfigRegistry.Instance.GetIsInit()) {
      Logger.Info('[GameServer] 注册游戏配置...');
      const gameConfigs = GetGameConfigRegistrations();
      ConfigRegistry.Instance.RegisterBatch(gameConfigs);
      // 2. 初始化配置系统
      Logger.Info('[GameServer] 初始化配置系统...');
      await ConfigRegistry.Instance.Initialize();
    }


    // 2.5. 加载技能效果配置（原子效果系统）
    Logger.Info('[GameServer] 加载技能效果配置...');
    const { SkillEffectsConfig } = await import('../shared/config/game/SkillEffectsConfig');
    await SkillEffectsConfig.Instance.Load();
    const effectStats = SkillEffectsConfig.Instance.GetStats();
    Logger.Info(
      `[GameServer] 技能效果配置加载完成: ${effectStats.total} 个效果 ` +
      `(已实现: ${effectStats.implemented}, 未实现: ${effectStats.unimplemented})`
    );

    // 2.6. 加载异色配置
    Logger.Info('[GameServer] 加载异色配置...');
    const { ShinyConfigManager } = await import('./Game/Shiny/ShinyConfigManager');
    await ShinyConfigManager.Instance.Load();
    const shinyStats = ShinyConfigManager.Instance.GetStats();
    Logger.Info(
      `[GameServer] 异色配置加载完成: ${shinyStats.total} 个方案, version=${shinyStats.version}`
    );

    // 3. 加载任务配置
    Logger.Info('[GameServer] 加载任务配置...');
    const { TaskConfig } = await import('../shared/config/game/TaskConfig');
    TaskConfig.Instance.Load();

    // 4. 启动自动保存任务（每5分钟）
    Logger.Info('[GameServer] 启动自动保存任务...');
    const { AutoSaveTask } = await import('./Game/System/AutoSaveTask');
    AutoSaveTask.Instance.Start(300000); // 每300秒（5分钟）保存一次
    
    Logger.Info('[GameServer] 配置加载完成，游戏服务正在启动...');
    // 5. 启动网络服务
    this._server.listen(Config.Game.port, Config.Game.host, () => {
      this._running = true;
      Logger.Info(`[GameServer] 启动成功 ${Config.Game.host}:${Config.Game.port}`);
      
      // 输出配置统计
      const stats = ConfigRegistry.Instance.GetStats();
      Logger.Info(`[GameServer] 配置加载: ${stats.loaded}/${stats.registered} 个`);
    });
  }

  /**
   * 停止服务器
   */
  public async Stop(): Promise<void> {
    if (this._stopPromise) return this._stopPromise;
    if (!this._running) return;
    this._stopping = true;
    this._running = false;
    this._stopPromise = this.StopOnce();
    return this._stopPromise;
  }

  private async StopOnce(): Promise<void> {

    Logger.Info('[GameServer] 正在停止服务器...');

    // 1. 停止自动保存任务
    const { AutoSaveTask } = await import('./Game/System/AutoSaveTask');
    AutoSaveTask.Instance.Stop();

    // 2. 清理 RegisterManager 定时器
    this._registerManager.Cleanup();

    // Stop listening now; accepted requests finish before their players log out.
    const networkClosed = new Promise<void>((resolve, reject) => {
      if (!this._server.listening) { resolve(); return; }
      this._server.close(err => err ? reject(err) : resolve());
    });
    DataSaver.Instance.BeginShutdown();
    await this.Drain(this._requests);
    const removals = PlayerManager.GetInstance().GetAllPlayers().map(player =>
      PlayerManager.GetInstance().RemovePlayer(player.Uid));
    for (const session of this._sessionManager.GetAllSessions()) session.Socket.destroy();
    const settled = await Promise.allSettled(removals);
    await networkClosed;
    await this.Drain(this._logouts);
    const failed = settled.find((result): result is PromiseRejectedResult => result.status === 'rejected');
    if (failed) throw failed.reason;

    Logger.Info('[GameServer] 严格保存最终玩家数据...');
    await DataSaver.Instance.FlushForShutdown();
    await DatabaseManager.Instance.Shutdown();
    
    Logger.Info('[GameServer] 已停止');
  }

  private async Drain(operations: Set<Promise<void>>): Promise<void> {
    while (operations.size) await Promise.all(Array.from(operations));
  }

  /**
   * 是否正在运行
   */
  public get IsRunning(): boolean {
    return this._running;
  }
}
