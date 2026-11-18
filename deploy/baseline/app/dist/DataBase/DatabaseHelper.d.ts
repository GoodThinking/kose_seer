/**
 * 数据库助手（统一入口）
 * 提供向后兼容的接口，内部委托给各个专门的模块
 *
 * 架构说明：
 * - DatabaseHelper 是统一入口，保持接口兼容
 * - DataCache 管理内存缓存
 * - DataLoader 负责加载数据
 * - DataSaver 负责保存数据
 * - DataAccessor 提供类型安全的访问接口
 */
import { FriendData } from './models/FriendData';
import { PlayerData } from './models/PlayerData';
import { ItemData } from './models/ItemData';
import { PetData } from './models/PetData';
import { MailData } from './models/MailData';
import { TaskData } from './models/TaskData';
import { ChallengeProgressData } from './models/ChallengeProgressData';
/**
 * 数据库助手单例
 * 负责管理所有玩家的数据对象
 */
export declare class DatabaseHelper {
    private static _instance;
    /** 待保存的 UID 列表（向后兼容） */
    static ToSaveUidList: Set<number>;
    private constructor();
    static get Instance(): DatabaseHelper;
    GetInstanceOrCreateNew_FriendData(uid: number): Promise<FriendData>;
    GetInstance_FriendData(uid: number): FriendData | null;
    SaveFriendData(data: FriendData): Promise<void>;
    GetInstanceOrCreateNew_ItemData(uid: number): Promise<ItemData>;
    GetInstance_ItemData(uid: number): ItemData | null;
    SaveItemData(data: ItemData): Promise<void>;
    GetInstanceOrCreateNew_PetData(uid: number): Promise<PetData>;
    GetInstance_PetData(uid: number): PetData | null;
    SavePetData(data: PetData): Promise<void>;
    GetInstanceOrCreateNew_MailData(uid: number): Promise<MailData>;
    GetInstance_MailData(uid: number): MailData | null;
    SaveMailData(data: MailData): Promise<void>;
    GetInstanceOrCreateNew_TaskData(uid: number): Promise<TaskData>;
    GetInstance_TaskData(uid: number): TaskData | null;
    SaveTaskData(data: TaskData): Promise<void>;
    GetInstance_PlayerData(uid: number): Promise<PlayerData | null>;
    GetInstanceOrCreateNew_PlayerData(uid: number): Promise<PlayerData>;
    SavePlayerData(data: PlayerData): Promise<void>;
    GetInstance_ChallengeProgressData(uid: number): Promise<ChallengeProgressData | undefined>;
    GetInstanceOrCreateNew_ChallengeProgressData(uid: number): Promise<ChallengeProgressData>;
    SaveChallengeProgressData(data: ChallengeProgressData): Promise<void>;
    /**
     * 保存所有待保存的数据（定时调用）
     */
    SaveAll(): Promise<void>;
    /**
     * 保存指定用户的所有数据
     */
    SaveUser(uid: number): Promise<void>;
    /**
     * 移除缓存（玩家下线时调用）
     */
    RemoveCache(uid: number): void;
}
//# sourceMappingURL=DatabaseHelper.d.ts.map