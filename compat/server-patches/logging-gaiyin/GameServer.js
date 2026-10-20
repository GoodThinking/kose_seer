"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameServer = void 0;
const net_1 = require("net");
const config_1 = require("../shared/config");
const config_2 = require("../shared/config");
const protocol_1 = require("../shared/protocol");
const shared_1 = require("../shared");
const Session_1 = require("./Server/Session");
const PolicyHandler_1 = require("./Server/PolicyHandler");
const Login_1 = require("./Game/Login");
const Register_1 = require("./Game/Register");
const Server_1 = require("./Game/Server");
const PlayerManager_1 = require("./Game/Player/PlayerManager");
// Note: ItemManager, MapManager, PetManager are now created per-player in PlayerInstance
const IHandler_1 = require("./Server/Packet/IHandler");
const DataBase_1 = require("../DataBase");
const DataSaver_1 = require("../DataBase/savers/DataSaver");
// 导入所有Handler以触发装饰器注册
require("./Server/Packet/Recv");
/**
 * 游戏服务器
 */
class GameServer {
    _server;
    _sessionManager;
    _packetBuilder;
    _loginManager;
    _registerManager;
    _serverManager;
    // Note: ItemManager, MapManager, PetManager are now created per-player in PlayerInstance
    _handlers;
    _running = false;
    _stopping = false;
    _stopPromise = null;
    _requests = new Set();
    _logouts = new Set();
    constructor() {
        this._server = (0, net_1.createServer)();
        this._sessionManager = new Session_1.SessionManager('1');
        this._packetBuilder = new protocol_1.PacketBuilder('1');
        this._loginManager = new Login_1.LoginManager(this._packetBuilder);
        this._registerManager = new Register_1.RegisterManager(this._packetBuilder);
        this._serverManager = new Server_1.ServerManager(this._packetBuilder);
        // Note: ItemManager, MapManager, PetManager are now created per-player in PlayerInstance
        // this._mapManager = new MapManager();
        // this._petManager = new PetManager();
        // this._itemManager = new ItemManager();
        this._handlers = new Map();
        // 连接 PlayerManager 和 ServerManager
        const playerManager = PlayerManager_1.PlayerManager.GetInstance(this._packetBuilder);
        playerManager.SetServerManager(this._serverManager);
        this.RegisterHandlers();
        this.SetupConnectionHandler();
    }
    /**
     * 注册命令处理器 (通过装饰器自动注册)
     */
    RegisterHandlers() {
        const registeredHandlers = shared_1.Handlers.GetAll();
        shared_1.Logger.Info(`[GameServer] 开始注册包处理器，共 ${registeredHandlers.size} 个`);
        for (const [cmdID, HandlerClass] of registeredHandlers) {
            let handler;
            // 根据装饰器声明的 InjectType 注入依赖
            switch (HandlerClass.INJECT) {
                case shared_1.InjectType.LOGIN_MANAGER:
                    handler = new HandlerClass(this._loginManager);
                    break;
                case shared_1.InjectType.REGISTER_MANAGER:
                    handler = new HandlerClass(this._registerManager);
                    break;
                case shared_1.InjectType.SERVER_MANAGER:
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
        shared_1.Logger.Info(`[GameServer] 已注册 ${this._handlers.size} 个命令处理器`);
    }
    /**
     * 设置连接处理
     */
    SetupConnectionHandler() {
        this._server.on('connection', (socket) => {
            if (this._stopping) {
                socket.destroy();
                return;
            }
            const session = this._sessionManager.CreateSession(socket);
            socket.on('data', (data) => {
                this.HandleData(session, data);
            });
            socket.on('error', (err) => {
                shared_1.Logger.Error(`Socket错误: ${session.Address}`, err);
            });
            socket.on('close', () => {
                const logout = this.HandleSocketClose(session);
                this._logouts.add(logout);
                void logout.then(() => this._logouts.delete(logout), err => {
                    this._logouts.delete(logout);
                    shared_1.Logger.Error(`[GameServer] 玩家断线保存失败: ${session.UserID}`, err);
                });
            });
        });
    }
    async HandleSocketClose(session) {
        try {
            // 只有主连接断开时才登出玩家
            // 房间连接断开不应该触发登出
            if (session.UserID > 0 && session.Type === IHandler_1.SessionType.MAIN) {
                shared_1.Logger.Info(`[GameServer] 玩家断开连接: UserID=${session.UserID}, Address=${session.Address}`);
                if (session.Player)
                    await PlayerManager_1.PlayerManager.GetInstance().RemovePlayer(session.UserID, session.Player);
            }
            else if (session.UserID > 0 && session.Type === IHandler_1.SessionType.ROOM) {
                shared_1.Logger.Info(`[GameServer] 房间连接断开: UserID=${session.UserID}, Address=${session.Address}`);
            }
        }
        finally {
            this._sessionManager.RemoveSession(session.Address);
        }
    }
    /**
     * 处理接收到的数据
     */
    HandleData(session, data) {
        if (this._stopping)
            return;
        // 检查是否是 Flash Socket Policy 请求
        if (!session.PolicyHandled) {
            if (PolicyHandler_1.PolicyHandler.Handle(session.Socket, data, session.Address)) {
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
    async ProcessPacket(session, head, body) {
        const handler = this._handlers.get(head.CmdID);
        const uid = session.Player?.Uid || session.UserId || 0;
        const mapId = session.Player?.MapId || 0;
        if (handler) {
            try {
                await handler.Handle(session, head, body);
            }
            catch (err) {
                shared_1.Logger.Error(`[HANDLER_ERROR] 处理命令失败 CMD=${head.CmdID} UserID=${uid} MapId=${mapId}`, err instanceof Error ? err : undefined);
            }
        }
        else {
            const hex = body && body.length > 0 ? body.toString('hex').slice(0, 32) : '';
            shared_1.Logger.Warn(`[UNHANDLED_CMD] 未处理的命令 CMD=${head.CmdID} UserID=${uid} MapId=${mapId} BodyLen=${body ? body.length : 0}${hex ? ` Hex=${hex}` : ''}`);
        }
    }
    /**
     * 启动服务器
     */
    async Start() {
        if (this._running)
            return;
        if (this._stopPromise)
            await this._stopPromise;
        this._stopPromise = null;
        this._stopping = false;
        DataSaver_1.DataSaver.Instance.Resume();
        // 1. 注册游戏配置
        // 启动全部服务，Index会先注册配置，所以跳过再次注册
        if (!config_2.ConfigRegistry.Instance.GetIsInit()) {
            shared_1.Logger.Info('[GameServer] 注册游戏配置...');
            const gameConfigs = (0, config_2.GetGameConfigRegistrations)();
            config_2.ConfigRegistry.Instance.RegisterBatch(gameConfigs);
            // 2. 初始化配置系统
            shared_1.Logger.Info('[GameServer] 初始化配置系统...');
            await config_2.ConfigRegistry.Instance.Initialize();
        }
        // 2.5. 加载技能效果配置（原子效果系统）
        shared_1.Logger.Info('[GameServer] 加载技能效果配置...');
        const { SkillEffectsConfig } = await Promise.resolve().then(() => __importStar(require('../shared/config/game/SkillEffectsConfig')));
        await SkillEffectsConfig.Instance.Load();
        const effectStats = SkillEffectsConfig.Instance.GetStats();
        shared_1.Logger.Info(`[GameServer] 技能效果配置加载完成: ${effectStats.total} 个效果 ` +
            `(已实现: ${effectStats.implemented}, 未实现: ${effectStats.unimplemented})`);
        // 2.6. 加载异色配置
        shared_1.Logger.Info('[GameServer] 加载异色配置...');
        const { ShinyConfigManager } = await Promise.resolve().then(() => __importStar(require('./Game/Shiny/ShinyConfigManager')));
        await ShinyConfigManager.Instance.Load();
        const shinyStats = ShinyConfigManager.Instance.GetStats();
        shared_1.Logger.Info(`[GameServer] 异色配置加载完成: ${shinyStats.total} 个方案, version=${shinyStats.version}`);
        // 3. 加载任务配置
        shared_1.Logger.Info('[GameServer] 加载任务配置...');
        const { TaskConfig } = await Promise.resolve().then(() => __importStar(require('../shared/config/game/TaskConfig')));
        TaskConfig.Instance.Load();
        // 4. 启动自动保存任务（每5分钟）
        shared_1.Logger.Info('[GameServer] 启动自动保存任务...');
        const { AutoSaveTask } = await Promise.resolve().then(() => __importStar(require('./Game/System/AutoSaveTask')));
        AutoSaveTask.Instance.Start(300000); // 每300秒（5分钟）保存一次
        shared_1.Logger.Info('[GameServer] 配置加载完成，游戏服务正在启动...');
        // 5. 启动网络服务
        this._server.listen(config_1.Config.Game.port, config_1.Config.Game.host, () => {
            this._running = true;
            shared_1.Logger.Info(`[GameServer] 启动成功 ${config_1.Config.Game.host}:${config_1.Config.Game.port}`);
            // 输出配置统计
            const stats = config_2.ConfigRegistry.Instance.GetStats();
            shared_1.Logger.Info(`[GameServer] 配置加载: ${stats.loaded}/${stats.registered} 个`);
        });
    }
    /**
     * 停止服务器
     */
    async Stop() {
        if (this._stopPromise)
            return this._stopPromise;
        if (!this._running)
            return;
        this._stopping = true;
        this._running = false;
        this._stopPromise = this.StopOnce();
        return this._stopPromise;
    }
    async StopOnce() {
        shared_1.Logger.Info('[GameServer] 正在停止服务器...');
        // 1. 停止自动保存任务
        const { AutoSaveTask } = await Promise.resolve().then(() => __importStar(require('./Game/System/AutoSaveTask')));
        AutoSaveTask.Instance.Stop();
        // 2. 清理 RegisterManager 定时器
        this._registerManager.Cleanup();
        // Stop listening now; accepted requests finish before their players log out.
        const networkClosed = new Promise((resolve, reject) => {
            if (!this._server.listening) {
                resolve();
                return;
            }
            this._server.close(err => err ? reject(err) : resolve());
        });
        DataSaver_1.DataSaver.Instance.BeginShutdown();
        await this.Drain(this._requests);
        const removals = PlayerManager_1.PlayerManager.GetInstance().GetAllPlayers().map(player => PlayerManager_1.PlayerManager.GetInstance().RemovePlayer(player.Uid));
        for (const session of this._sessionManager.GetAllSessions())
            session.Socket.destroy();
        const settled = await Promise.allSettled(removals);
        await networkClosed;
        await this.Drain(this._logouts);
        const failed = settled.find((result) => result.status === 'rejected');
        if (failed)
            throw failed.reason;
        shared_1.Logger.Info('[GameServer] 严格保存最终玩家数据...');
        await DataSaver_1.DataSaver.Instance.FlushForShutdown();
        await DataBase_1.DatabaseManager.Instance.Shutdown();
        shared_1.Logger.Info('[GameServer] 已停止');
    }
    async Drain(operations) {
        while (operations.size)
            await Promise.all(Array.from(operations));
    }
    /**
     * 是否正在运行
     */
    get IsRunning() {
        return this._running;
    }
}
exports.GameServer = GameServer;
//# sourceMappingURL=GameServer.js.map