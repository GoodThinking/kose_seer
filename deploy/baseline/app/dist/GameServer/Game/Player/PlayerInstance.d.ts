import { IClientSession } from '../../Server/Packet/IHandler';
import { PacketBuilder } from '../../../shared/protocol/PacketBuilder';
import { BaseProto } from '../../../shared/proto';
import { ItemManager } from '../Item/ItemManager';
import { MapManager } from '../Map/MapManager';
import { MapActionManager } from '../Map/MapActionManager';
import { MapBroadcastManager } from '../Map/MapBroadcastManager';
import { MapSpawnManager } from '../Map/MapSpawnManager';
import { PetManager } from '../Pet/PetManager';
import { SystemManager } from '../System/SystemManager';
import { NoNoManager } from '../NoNo/NoNoManager';
import { BattleManager } from '../Battle/BattleManager';
import { MailManager } from '../Mail/MailManager';
import { FriendManager } from '../Friend/FriendManager';
import { TaskManager } from '../Task/TaskManager';
import { ChallengeProgressManager } from '../Challenge/ChallengeProgressManager';
import { GachaManager } from '../Gacha/GachaManager';
import { PlayerData } from '../../../DataBase/models/PlayerData';
import { GameEventBus } from '../Event/GameEventBus';
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
export declare class PlayerInstance {
    private _session;
    private _packetBuilder;
    private _playerRepo;
    Uid: number;
    Initialized: boolean;
    Data: PlayerData;
    ItemManager: ItemManager;
    MapManager: MapManager;
    MapActionManager: MapActionManager;
    MapBroadcastManager: MapBroadcastManager;
    MapSpawnManager: MapSpawnManager;
    PetManager: PetManager;
    SystemManager: SystemManager;
    NoNoManager: NoNoManager;
    BattleManager: BattleManager;
    MailManager: MailManager;
    FriendManager: FriendManager;
    TaskManager: TaskManager;
    ChallengeProgressManager: ChallengeProgressManager;
    GachaManager: GachaManager;
    EventBus: GameEventBus;
    constructor(session: IClientSession, userID: number, packetBuilder: PacketBuilder);
    /**
     * 让每个 Manager 注册自己关心的事件
     * 各 Manager 在 RegisterEvents() 中自行注册，PlayerInstance 不关心具体事件
     */
    private RegisterAllEvents;
    /**
     * 获取 Session
     */
    get Session(): IClientSession;
    /**
     * 发送数据包
     * @param proto Proto对象（自动获取cmdId和result）
     */
    SendPacket(proto: BaseProto): Promise<void>;
    /**
     * 玩家登录
     */
    OnLogin(): Promise<void>;
    /**
     * 玩家登出
     */
    OnLogout(): Promise<void>;
    /**
     * 初始化玩家数据
     */
    Initialize(): Promise<void>;
    /**
     * 同步服装数据：从 ItemData 提取服装物品到 PlayerData.clothes
     */
    private syncClothesData;
    /**
     * 更新玩家昵称
     */
    UpdateNickname(newNick: string): Promise<boolean>;
    /**
     * 添加货币
     */
    AddCurrency(energy?: number, coins?: number): Promise<boolean>;
    /**
     * 更新位置
     */
    UpdatePosition(mapId: number, posX: number, posY: number): Promise<boolean>;
}
//# sourceMappingURL=PlayerInstance.d.ts.map