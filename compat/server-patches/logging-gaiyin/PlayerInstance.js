"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerInstance = void 0;
const ServerConfig_1 = require("../../../shared/config/ServerConfig");
const utils_1 = require("../../../shared/utils");
const ItemManager_1 = require("../Item/ItemManager");
const MapManager_1 = require("../Map/MapManager");
const MapActionManager_1 = require("../Map/MapActionManager");
const MapBroadcastManager_1 = require("../Map/MapBroadcastManager");
const MapSpawnManager_1 = require("../Map/MapSpawnManager");
const PetManager_1 = require("../Pet/PetManager");
const SystemManager_1 = require("../System/SystemManager");
const NoNoManager_1 = require("../NoNo/NoNoManager");
const BattleManager_1 = require("../Battle/BattleManager");
const MailManager_1 = require("../Mail/MailManager");
const FriendManager_1 = require("../Friend/FriendManager");
const TaskManager_1 = require("../Task/TaskManager");
const ChallengeProgressManager_1 = require("../Challenge/ChallengeProgressManager");
const GachaManager_1 = require("../Gacha/GachaManager");
const PlayerRepository_1 = require("../../../DataBase/repositories/Player/PlayerRepository");
const DatabaseHelper_1 = require("../../../DataBase/DatabaseHelper");
const GameEventBus_1 = require("../Event/GameEventBus");
const EventTypes_1 = require("../Event/EventTypes");
/**
 * 玩家实例
 * 管理单个玩家的所有数据和 Manager
 *
 * 架构原则：
 * - 每个在线玩家对应一个 PlayerInstance
 * - 包含各种 Manager（ItemManager、MapManager、PetManager 等）
 * - 提供 SendPacket 方法用于发送数据包
 * - Manager 随 Player 实例自动创建和销毁
 * - 通过 Data 属性直接访问玩家数据
 * - Manager 持有自己的 Data 对象（如 FriendManager.FriendData）
 * - 不使用 Repository 包装器，直接操作 Data 对象
 */
class PlayerInstance {
    // ===== 核心属性 =====
    _session;
    _packetBuilder;
    _playerRepo; // 仅用于初始化加载
    Uid; // 用户ID
    Initialized = false; // 是否已初始化
    // ===== 数据对象 =====
    Data; // 玩家数据
    // ===== Managers =====
    ItemManager;
    MapManager;
    MapActionManager;
    MapBroadcastManager;
    MapSpawnManager;
    PetManager;
    SystemManager;
    NoNoManager;
    BattleManager;
    MailManager;
    FriendManager;
    TaskManager;
    ChallengeProgressManager;
    GachaManager;
    EventBus;
    constructor(session, userID, packetBuilder) {
        this._session = session;
        this.Uid = userID;
        this._packetBuilder = packetBuilder;
        this._playerRepo = new PlayerRepository_1.PlayerRepository();
        // 初始化所有 Manager
        this.ItemManager = new ItemManager_1.ItemManager(this);
        this.MapManager = new MapManager_1.MapManager(this);
        this.MapActionManager = new MapActionManager_1.MapActionManager(this);
        this.MapBroadcastManager = new MapBroadcastManager_1.MapBroadcastManager(this);
        this.MapSpawnManager = new MapSpawnManager_1.MapSpawnManager(this);
        this.PetManager = new PetManager_1.PetManager(this);
        this.SystemManager = new SystemManager_1.SystemManager(this);
        this.NoNoManager = new NoNoManager_1.NoNoManager(this);
        this.BattleManager = new BattleManager_1.BattleManager(this);
        this.MailManager = new MailManager_1.MailManager(this);
        this.FriendManager = new FriendManager_1.FriendManager(this);
        this.TaskManager = new TaskManager_1.TaskManager(this);
        this.ChallengeProgressManager = new ChallengeProgressManager_1.ChallengeProgressManager(this);
        this.GachaManager = new GachaManager_1.GachaManager(this);
        this.EventBus = new GameEventBus_1.GameEventBus();
        this.RegisterAllEvents();
    }
    /**
     * 让每个 Manager 注册自己关心的事件
     * 各 Manager 在 RegisterEvents() 中自行注册，PlayerInstance 不关心具体事件
     */
    RegisterAllEvents() {
        this.ItemManager.RegisterEvents(this.EventBus);
        this.MapManager.RegisterEvents(this.EventBus);
        this.MapActionManager.RegisterEvents(this.EventBus);
        this.MapBroadcastManager.RegisterEvents(this.EventBus);
        this.MapSpawnManager.RegisterEvents(this.EventBus);
        this.PetManager.RegisterEvents(this.EventBus);
        this.SystemManager.RegisterEvents(this.EventBus);
        this.NoNoManager.RegisterEvents(this.EventBus);
        this.BattleManager.RegisterEvents(this.EventBus);
        this.MailManager.RegisterEvents(this.EventBus);
        this.FriendManager.RegisterEvents(this.EventBus);
        this.TaskManager.RegisterEvents(this.EventBus);
        this.ChallengeProgressManager.RegisterEvents(this.EventBus);
        this.GachaManager.RegisterEvents(this.EventBus);
    }
    /**
     * 当前实例配置的客户端报文格式（不改变包头版本）
     */
    get ClientProtocol() {
        return ServerConfig_1.Config.Game.clientProtocol ?? 'kose';
    }
    /** 获取 Session */
    get Session() {
        return this._session;
    }
    /**
     * 发送数据包
     * @param proto Proto对象（自动获取cmdId和result）
     */
    async SendPacket(proto) {
        try {
            const cmdId = proto.getCmdId();
            const result = proto.getResult();
            const bodyData = proto.serialize(this.ClientProtocol);
            const packet = this._packetBuilder.Build(cmdId, this.Uid, result, bodyData);
            this._session.Socket.write(packet);
            if (result !== 0) {
                utils_1.Logger.Warn(`[PACKET_ERROR] 用户 ${this.Uid} CMD=${cmdId} Result=${result} Map=${this.MapId}`);
            }
            else {
                utils_1.Logger.Info(`[Player ${this.Uid}] 发送数据包: cmdId=${cmdId}, result=${result}, bodyLen=${bodyData.length}, packetLen=${packet.length}`);
            }
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error(`[Player ${this.Uid}] 发送数据包失败`, error);
        }
    }
    /**
     * 玩家登录
     */
    async OnLogin() {
        utils_1.Logger.Info(`[Player ${this.Uid}] 玩家登录: ${this.Data.nick}`);
        // 注意：不在这里调用 NoNoManager.OnLogin()
        // 原因：
        // 1. 如果玩家有 NoNo，客户端会根据登录响应中的 hasNono 字段主动请求 NoNo 信息或召唤
        // 2. 如果玩家没有 NoNo，不需要任何处理
        // 3. 服务器不应该主动推送 NoNo 信息
        // 派发登录事件
        await this.EventBus.Emit({
            type: EventTypes_1.PlayerEventType.LOGIN,
            timestamp: Date.now(),
            playerId: this.Uid,
        });
    }
    /**
     * 玩家登出
     */
    async OnLogout() {
        utils_1.Logger.Info(`[Player ${this.Uid}] 玩家登出: ${this.Data.nick}`);
        // 在清理前先派发登出事件，让各 Manager 自行处理退出逻辑
        await this.EventBus.Emit({
            type: EventTypes_1.PlayerEventType.LOGOUT,
            timestamp: Date.now(),
            playerId: this.Uid,
        });
        // 实时保存该玩家的所有数据
        await DatabaseHelper_1.DatabaseHelper.Instance.SaveUser(this.Uid);
        // 清理 Session 中的 Player 引用
        this._session.Player = undefined;
        // A replaced connection may close later; it no longer owns this UID.
        this._session.UserID = 0;
        // 销毁事件总线
        this.EventBus.Destroy();
        // 移除缓存
        DatabaseHelper_1.DatabaseHelper.Instance.RemoveCache(this.Uid);
    }
    /**
     * 初始化玩家数据
     */
    async Initialize() {
        // 加载玩家数据（通过 DatabaseHelper）
        this.Data = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstanceOrCreateNew_PlayerData(this.Uid);
        utils_1.Logger.Info(`[PlayerInstance] 玩家数据已加载 userId=${this.Uid}, nickname=${this.Data.nick}`);
        // 初始化所有 Manager（加载各自的 Data）
        await this.ItemManager.Initialize();
        await this.PetManager.Initialize();
        await this.MailManager.Initialize();
        await this.FriendManager.Initialize();
        await this.TaskManager.Initialize();
        await this.NoNoManager.Initialize();
        await this.ChallengeProgressManager.Initialize();
        await this.GachaManager.Initialize();
        // 同步服装数据：从 ItemData 提取服装物品到 PlayerData.clothes
        this.syncClothesData();
        this.Initialized = true;
    }
    /**
     * 同步服装数据：从 ItemData 提取服装物品到 PlayerData.clothes
     */
    syncClothesData() {
        // 从 ItemManager 中筛选出服装类物品
        const clothItems = this.ItemManager.GetClothItems();
        // 转换为 clothes 格式
        this.Data.clothes = clothItems.map(item => ({
            id: item.itemId,
            level: 0, // 服装没有等级概念，默认为0
            count: item.count
        }));
        this.Data.clothCount = this.Data.clothes.length;
        utils_1.Logger.Debug(`[PlayerInstance] 同步服装数据: UserID=${this.Uid}, 服装数量=${this.Data.clothCount}`);
    }
    // ===== 便捷方法 =====
    /**
     * 更新玩家昵称
     */
    async UpdateNickname(newNick) {
        const success = await this._playerRepo.UpdateNickname(this.Uid, newNick);
        if (success) {
            this.Data.nick = newNick;
        }
        return success;
    }
    /**
     * 添加货币
     */
    async AddCurrency(energy, coins) {
        await this.Data.WaitForExpAllocation();
        const release = this.Data.BeginCurrencyOperation();
        if (!release)
            return false;
        try {
            const success = await this._playerRepo.AddCurrency(this.Uid, energy, coins);
            if (success) {
                if (energy !== undefined)
                    this.Data.energy += energy;
                if (coins !== undefined)
                    this.Data.coins += coins;
            }
            return success;
        }
        finally {
            release();
        }
    }
    /**
     * 更新位置
     */
    async UpdatePosition(mapId, posX, posY) {
        const success = await this._playerRepo.UpdatePosition(this.Uid, mapId, posX, posY);
        if (success) {
            this.Data.mapID = mapId;
            this.Data.posX = posX;
            this.Data.posY = posY;
        }
        return success;
    }
}
exports.PlayerInstance = PlayerInstance;
//# sourceMappingURL=PlayerInstance.js.map