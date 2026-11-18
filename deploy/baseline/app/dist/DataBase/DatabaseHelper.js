"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseHelper = void 0;
const DataCache_1 = require("./cache/DataCache");
const DataSaver_1 = require("./savers/DataSaver");
const FriendDataAccessor_1 = require("./accessors/FriendDataAccessor");
const ItemDataAccessor_1 = require("./accessors/ItemDataAccessor");
const PetDataAccessor_1 = require("./accessors/PetDataAccessor");
const MailDataAccessor_1 = require("./accessors/MailDataAccessor");
const TaskDataAccessor_1 = require("./accessors/TaskDataAccessor");
const PlayerDataAccessor_1 = require("./accessors/PlayerDataAccessor");
const ChallengeProgressDataAccessor_1 = require("./accessors/ChallengeProgressDataAccessor");
/**
 * 数据库助手单例
 * 负责管理所有玩家的数据对象
 */
class DatabaseHelper {
    static _instance;
    /** 待保存的 UID 列表（向后兼容） */
    static ToSaveUidList = DataSaver_1.DataSaver.ToSaveUidList;
    constructor() { }
    static get Instance() {
        if (!DatabaseHelper._instance) {
            DatabaseHelper._instance = new DatabaseHelper();
        }
        return DatabaseHelper._instance;
    }
    // ==================== FriendData ====================
    async GetInstanceOrCreateNew_FriendData(uid) {
        return FriendDataAccessor_1.FriendDataAccessor.Instance.GetOrCreate(uid);
    }
    GetInstance_FriendData(uid) {
        return FriendDataAccessor_1.FriendDataAccessor.Instance.Get(uid);
    }
    async SaveFriendData(data) {
        return FriendDataAccessor_1.FriendDataAccessor.Instance.Save(data);
    }
    // ==================== ItemData ====================
    async GetInstanceOrCreateNew_ItemData(uid) {
        return ItemDataAccessor_1.ItemDataAccessor.Instance.GetOrCreate(uid);
    }
    GetInstance_ItemData(uid) {
        return ItemDataAccessor_1.ItemDataAccessor.Instance.Get(uid);
    }
    async SaveItemData(data, throwOnError = false) {
        return ItemDataAccessor_1.ItemDataAccessor.Instance.Save(data, throwOnError);
    }
    // ==================== PetData ====================
    async GetInstanceOrCreateNew_PetData(uid) {
        return PetDataAccessor_1.PetDataAccessor.Instance.GetOrCreate(uid);
    }
    GetInstance_PetData(uid) {
        return PetDataAccessor_1.PetDataAccessor.Instance.Get(uid);
    }
    async SavePetData(data, throwOnError = false) {
        return PetDataAccessor_1.PetDataAccessor.Instance.Save(data, throwOnError);
    }
    // ==================== MailData ====================
    async GetInstanceOrCreateNew_MailData(uid) {
        return MailDataAccessor_1.MailDataAccessor.Instance.GetOrCreate(uid);
    }
    GetInstance_MailData(uid) {
        return MailDataAccessor_1.MailDataAccessor.Instance.Get(uid);
    }
    async SaveMailData(data) {
        return MailDataAccessor_1.MailDataAccessor.Instance.Save(data);
    }
    // ==================== TaskData ====================
    async GetInstanceOrCreateNew_TaskData(uid) {
        return TaskDataAccessor_1.TaskDataAccessor.Instance.GetOrCreate(uid);
    }
    GetInstance_TaskData(uid) {
        return TaskDataAccessor_1.TaskDataAccessor.Instance.Get(uid);
    }
    async SaveTaskData(data, throwOnError = false) {
        return TaskDataAccessor_1.TaskDataAccessor.Instance.Save(data, throwOnError);
    }
    // ==================== PlayerData ====================
    async GetInstance_PlayerData(uid) {
        return PlayerDataAccessor_1.PlayerDataAccessor.Instance.Get(uid);
    }
    async GetInstanceOrCreateNew_PlayerData(uid) {
        return PlayerDataAccessor_1.PlayerDataAccessor.Instance.GetOrCreate(uid);
    }
    async SavePlayerData(data) {
        return PlayerDataAccessor_1.PlayerDataAccessor.Instance.Save(data);
    }
    // ==================== ChallengeProgressData ====================
    async GetInstance_ChallengeProgressData(uid) {
        return ChallengeProgressDataAccessor_1.ChallengeProgressDataAccessor.Instance.GetCached(uid);
    }
    async GetInstanceOrCreateNew_ChallengeProgressData(uid) {
        return ChallengeProgressDataAccessor_1.ChallengeProgressDataAccessor.Instance.GetOrCreate(uid);
    }
    async SaveChallengeProgressData(data) {
        return ChallengeProgressDataAccessor_1.ChallengeProgressDataAccessor.Instance.Save(data);
    }
    // ==================== 批量操作 ====================
    /**
     * 保存所有待保存的数据（定时调用）
     */
    async SaveAll() {
        return DataSaver_1.DataSaver.Instance.SaveAll();
    }
    /**
     * 保存指定用户的所有数据
     */
    async SaveUser(uid) {
        return DataSaver_1.DataSaver.Instance.SaveUser(uid);
    }
    /**
     * 移除缓存（玩家下线时调用）
     */
    RemoveCache(uid) {
        DataCache_1.DataCache.Instance.RemoveAll(uid);
    }
}
exports.DatabaseHelper = DatabaseHelper;
//# sourceMappingURL=DatabaseHelper.js.map