"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerManager = void 0;
const PlayerInstance_1 = require("./PlayerInstance");
const utils_1 = require("../../../shared/utils");
const OnlineTracker_1 = require("./OnlineTracker");
/**
 * 玩家管理器
 * 管理所有在线玩家
 */
class PlayerManager {
    static _instance;
    _players = new Map();
    _removals = new Map();
    _creations = new Map();
    _packetBuilder;
    _serverManager;
    constructor(packetBuilder) {
        this._packetBuilder = packetBuilder;
    }
    /**
     * 获取单例实例
     */
    static GetInstance(packetBuilder) {
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
    SetServerManager(serverManager) {
        this._serverManager = serverManager;
    }
    /**
     * 创建玩家实例
     */
    async CreatePlayer(session, userID, nickname) {
        const previous = this._creations.get(userID) ?? Promise.resolve();
        let release;
        const pending = new Promise(resolve => { release = resolve; });
        this._creations.set(userID, pending);
        await previous;
        try {
            return await this.CreatePlayerOnce(session, userID, nickname);
        }
        catch (error) {
            if (!session.Player)
                session.UserID = 0;
            throw error;
        }
        finally {
            release();
            if (this._creations.get(userID) === pending)
                this._creations.delete(userID);
        }
    }
    async CreatePlayerOnce(session, userID, nickname) {
        if (session.Socket.destroyed)
            throw new Error('登录连接已关闭');
        // 如果玩家已存在，先移除旧的
        if (this._players.has(userID)) {
            utils_1.Logger.Warn(`[PlayerManager] 玩家已存在，移除旧实例: ${userID}`);
            await this.RemovePlayer(userID);
        }
        if (session.Socket.destroyed)
            throw new Error('登录连接已关闭');
        // 创建新的玩家实例（不再需要传 nickname）
        const player = new PlayerInstance_1.PlayerInstance(session, userID, this._packetBuilder);
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
        OnlineTracker_1.OnlineTracker.Instance.PlayerLogin(userID, session);
        // 通知 ServerManager 用户上线
        if (this._serverManager) {
            this._serverManager.UserOnline(userID);
        }
        utils_1.Logger.Info(`[PlayerManager] 创建玩家实例: userID=${userID}, nickname=${nickname}`);
        return player;
    }
    /**
     * 获取玩家实例
     */
    GetPlayer(userID) {
        return this._players.get(userID);
    }
    /**
     * 移除玩家实例
     */
    async RemovePlayer(userID, expectedPlayer) {
        if (expectedPlayer && this._players.get(userID) !== expectedPlayer)
            return;
        const pending = this._removals.get(userID);
        if (pending)
            return pending;
        const removal = this.RemovePlayerOnce(userID);
        this._removals.set(userID, removal);
        try {
            await removal;
        }
        finally {
            this._removals.delete(userID);
        }
    }
    async RemovePlayerOnce(userID) {
        const player = this._players.get(userID);
        if (player) {
            await player.OnLogout();
            this._players.delete(userID);
            // 从在线追踪系统移除
            OnlineTracker_1.OnlineTracker.Instance.PlayerLogout(userID);
            // 通知 ServerManager 用户下线
            if (this._serverManager) {
                this._serverManager.UserOffline(userID);
            }
            utils_1.Logger.Info(`[PlayerManager] 移除玩家实例: ${userID}`);
        }
    }
    /**
     * 获取在线玩家数量
     */
    GetOnlineCount() {
        return this._players.size;
    }
    /**
     * 获取所有在线玩家
     */
    GetAllPlayers() {
        return Array.from(this._players.values());
    }
    /**
     * 检查玩家是否在线
     */
    IsPlayerOnline(userID) {
        return this._players.has(userID);
    }
}
exports.PlayerManager = PlayerManager;
//# sourceMappingURL=PlayerManager.js.map