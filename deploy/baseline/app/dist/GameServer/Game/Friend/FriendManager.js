"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendManager = void 0;
const BaseManager_1 = require("../Base/BaseManager");
const utils_1 = require("../../../shared/utils");
const DatabaseHelper_1 = require("../../../DataBase/DatabaseHelper");
const OnlineTracker_1 = require("../Player/OnlineTracker");
const PlayerRepository_1 = require("../../../DataBase/repositories/Player/PlayerRepository");
const Send_1 = require("../../Server/Packet/Send");
/**
 * 好友管理器
 * 负责处理好友相关的业务逻辑
 *
 * 架构特点：
 * - 继承 BaseManager，获得便捷方法
 * - 持有 FriendData 对象（直接映射数据库）
 * - 直接操作 FriendData 的属性（Array.push、Array.splice 等）
 * - FriendData 继承 BaseData，自动保存（100ms 防抖）
 * - 不需要手动调用 save()
 */
class FriendManager extends BaseManager_1.BaseManager {
    /** 好友数据 */
    FriendData;
    /** 玩家数据仓库（用于查询其他玩家信息）*/
    _playerRepo;
    constructor(player) {
        super(player);
        this._playerRepo = new PlayerRepository_1.PlayerRepository();
    }
    /**
     * 初始化（加载好友数据）
     */
    async Initialize() {
        this.FriendData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstanceOrCreateNew_FriendData(this.UserID);
        utils_1.Logger.Debug(`[FriendManager] 好友数据已加载: uid=${this.UserID}, friends=${this.FriendData.FriendList.length}`);
    }
    /**
     * 添加好友（发送好友申请）
     */
    async HandleAddFriend(targetUid) {
        try {
            // 获取目标玩家的 FriendData
            const target = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstanceOrCreateNew_FriendData(targetUid);
            if (!target) {
                await this.Player.SendPacket(new Send_1.PacketFriendAdd(1));
                return;
            }
            // 已经是好友
            if (this.FriendData.FriendList.includes(targetUid)) {
                utils_1.Logger.Warn(`[FriendManager] 已经是好友: ${this.UserID} -> ${targetUid}`);
                await this.Player.SendPacket(new Send_1.PacketFriendAdd(1));
                return;
            }
            // 在黑名单中
            if (this.FriendData.BlackList.includes(targetUid)) {
                utils_1.Logger.Warn(`[FriendManager] 对方在黑名单中: ${this.UserID} -> ${targetUid}`);
                await this.Player.SendPacket(new Send_1.PacketFriendAdd(1));
                return;
            }
            // 已经发送过申请
            if (this.FriendData.SendApplyList.includes(targetUid)) {
                utils_1.Logger.Warn(`[FriendManager] 已经发送过好友申请: ${this.UserID} -> ${targetUid}`);
                await this.Player.SendPacket(new Send_1.PacketFriendAdd(1));
                return;
            }
            // 已经收到对方的申请
            if (this.FriendData.ReceiveApplyList.includes(targetUid)) {
                utils_1.Logger.Warn(`[FriendManager] 已经收到对方的好友申请: ${this.UserID} -> ${targetUid}`);
                await this.Player.SendPacket(new Send_1.PacketFriendAdd(1));
                return;
            }
            // 添加到发送申请列表（自动保存）
            this.FriendData.SendApplyList.push(targetUid);
            target.ReceiveApplyList.push(this.UserID);
            // 如果目标玩家在线，更新内存数据
            const targetSession = OnlineTracker_1.OnlineTracker.Instance.GetPlayerSession(targetUid);
            if (targetSession?.Player?.FriendManager) {
                targetSession.Player.FriendManager.ReceiveFriendApply(this.UserID);
            }
            utils_1.Logger.Info(`[FriendManager] 发送好友申请: ${this.UserID} -> ${targetUid}`);
            // 发送响应
            await this.Player.SendPacket(new Send_1.PacketFriendAdd(0));
        }
        catch (error) {
            utils_1.Logger.Error(`[FriendManager] HandleAddFriend failed`, error);
            await this.Player.SendPacket(new Send_1.PacketFriendAdd(1));
        }
    }
    /**
     * 确认添加好友（接受好友申请）
     */
    async HandleConfirmAddFriend(targetUid) {
        try {
            // 获取目标玩家的 FriendData
            const target = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstanceOrCreateNew_FriendData(targetUid);
            if (!target) {
                await this.Player.SendPacket(new Send_1.PacketFriendAnswer(1));
                return;
            }
            // 已经是好友
            if (this.FriendData.FriendList.includes(targetUid)) {
                await this.Player.SendPacket(new Send_1.PacketFriendAnswer(1));
                return;
            }
            // 在黑名单中
            if (this.FriendData.BlackList.includes(targetUid)) {
                await this.Player.SendPacket(new Send_1.PacketFriendAnswer(1));
                return;
            }
            // 没有收到申请
            if (!this.FriendData.ReceiveApplyList.includes(targetUid)) {
                await this.Player.SendPacket(new Send_1.PacketFriendAnswer(1));
                return;
            }
            // 移除申请记录（自动保存）
            const receiveIndex = this.FriendData.ReceiveApplyList.indexOf(targetUid);
            if (receiveIndex > -1) {
                this.FriendData.ReceiveApplyList.splice(receiveIndex, 1);
            }
            const sendIndex = target.SendApplyList.indexOf(this.UserID);
            if (sendIndex > -1) {
                target.SendApplyList.splice(sendIndex, 1);
            }
            // 添加到好友列表（双向，自动保存）
            this.FriendData.FriendList.push(targetUid);
            target.FriendList.push(this.UserID);
            // 如果目标玩家在线，更新内存数据
            const targetSession = OnlineTracker_1.OnlineTracker.Instance.GetPlayerSession(targetUid);
            if (targetSession?.Player?.FriendManager) {
                targetSession.Player.FriendManager.RemoveSentApply(this.UserID);
                targetSession.Player.FriendManager.AddFriendEntry(this.UserID);
            }
            utils_1.Logger.Info(`[FriendManager] 接受好友申请: ${this.UserID} <- ${targetUid}`);
            // 发送响应
            await this.Player.SendPacket(new Send_1.PacketFriendAnswer(0));
        }
        catch (error) {
            utils_1.Logger.Error(`[FriendManager] HandleConfirmAddFriend failed`, error);
            await this.Player.SendPacket(new Send_1.PacketFriendAnswer(1));
        }
    }
    /**
     * 拒绝好友申请
     */
    async HandleRefuseAddFriend(targetUid) {
        try {
            const target = DatabaseHelper_1.DatabaseHelper.Instance.GetInstance_FriendData(targetUid);
            if (!target)
                return;
            // 没有收到申请
            if (!this.FriendData.ReceiveApplyList.includes(targetUid))
                return;
            // 移除申请记录（自动保存）
            const receiveIndex = this.FriendData.ReceiveApplyList.indexOf(targetUid);
            if (receiveIndex > -1) {
                this.FriendData.ReceiveApplyList.splice(receiveIndex, 1);
            }
            const sendIndex = target.SendApplyList.indexOf(this.UserID);
            if (sendIndex > -1) {
                target.SendApplyList.splice(sendIndex, 1);
            }
            // 如果目标玩家在线，更新内存数据
            const targetSession = OnlineTracker_1.OnlineTracker.Instance.GetPlayerSession(targetUid);
            if (targetSession?.Player?.FriendManager) {
                targetSession.Player.FriendManager.RemoveSentApply(this.UserID);
            }
            utils_1.Logger.Info(`[FriendManager] 拒绝好友申请: ${this.UserID} <- ${targetUid}`);
        }
        catch (error) {
            utils_1.Logger.Error(`[FriendManager] HandleRefuseAddFriend failed`, error);
        }
    }
    /**
     * 删除好友
     */
    async HandleRemoveFriend(targetUid) {
        try {
            // 不是好友
            if (!this.FriendData.FriendList.includes(targetUid)) {
                await this.Player.SendPacket(new Send_1.PacketFriendRemove(1));
                return;
            }
            // 移除好友关系（双向，自动保存）
            const myIndex = this.FriendData.FriendList.indexOf(targetUid);
            if (myIndex > -1) {
                this.FriendData.FriendList.splice(myIndex, 1);
            }
            const target = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstanceOrCreateNew_FriendData(targetUid);
            if (target) {
                const targetIndex = target.FriendList.indexOf(this.UserID);
                if (targetIndex > -1) {
                    target.FriendList.splice(targetIndex, 1);
                }
            }
            // 如果目标玩家在线，更新内存数据
            const targetSession = OnlineTracker_1.OnlineTracker.Instance.GetPlayerSession(targetUid);
            if (targetSession?.Player?.FriendManager) {
                targetSession.Player.FriendManager.RemoveFriendEntry(this.UserID);
            }
            utils_1.Logger.Info(`[FriendManager] 删除好友: ${this.UserID} -> ${targetUid}`);
            // 发送响应
            await this.Player.SendPacket(new Send_1.PacketFriendRemove(0));
        }
        catch (error) {
            utils_1.Logger.Error(`[FriendManager] HandleRemoveFriend failed`, error);
            await this.Player.SendPacket(new Send_1.PacketFriendRemove(1));
        }
    }
    /**
     * 添加到黑名单
     */
    async HandleAddToBlacklist(targetUid) {
        try {
            // 已经在黑名单中
            if (this.FriendData.BlackList.includes(targetUid)) {
                await this.Player.SendPacket(new Send_1.PacketBlackAdd(1));
                return;
            }
            // 如果是好友，先删除好友关系
            if (this.FriendData.FriendList.includes(targetUid)) {
                await this.HandleRemoveFriend(targetUid);
            }
            // 添加到黑名单（自动保存）
            this.FriendData.BlackList.push(targetUid);
            utils_1.Logger.Info(`[FriendManager] 添加到黑名单: ${this.UserID} -> ${targetUid}`);
            // 发送响应
            await this.Player.SendPacket(new Send_1.PacketBlackAdd(0));
        }
        catch (error) {
            utils_1.Logger.Error(`[FriendManager] HandleAddToBlacklist failed`, error);
            await this.Player.SendPacket(new Send_1.PacketBlackAdd(1));
        }
    }
    /**
     * 从黑名单移除
     */
    async HandleRemoveFromBlacklist(targetUid) {
        try {
            // 不在黑名单中
            if (!this.FriendData.BlackList.includes(targetUid)) {
                await this.Player.SendPacket(new Send_1.PacketBlackRemove(1));
                return;
            }
            // 从黑名单移除（自动保存）
            const index = this.FriendData.BlackList.indexOf(targetUid);
            if (index > -1) {
                this.FriendData.BlackList.splice(index, 1);
            }
            utils_1.Logger.Info(`[FriendManager] 从黑名单移除: ${this.UserID} -> ${targetUid}`);
            // 发送响应
            await this.Player.SendPacket(new Send_1.PacketBlackRemove(0));
        }
        catch (error) {
            utils_1.Logger.Error(`[FriendManager] HandleRemoveFromBlacklist failed`, error);
            await this.Player.SendPacket(new Send_1.PacketBlackRemove(1));
        }
    }
    /**
     * 获取好友列表
     */
    async HandleGetFriendList() {
        try {
            const friendInfos = [];
            for (const friendUid of this.FriendData.FriendList) {
                const friendData = await this._playerRepo.FindByUserId(friendUid);
                if (!friendData)
                    continue;
                const isOnline = OnlineTracker_1.OnlineTracker.Instance.IsOnline(friendUid);
                friendInfos.push({
                    userId: friendData.userID,
                    nickname: friendData.nick,
                    color: friendData.color,
                    isOnline: isOnline
                });
            }
            await this.Player.SendPacket(new Send_1.PacketFriendList(friendInfos));
        }
        catch (error) {
            utils_1.Logger.Error(`[FriendManager] HandleGetFriendList failed`, error);
        }
    }
    /**
     * 获取黑名单列表
     */
    async HandleGetBlacklist() {
        try {
            const blackInfos = [];
            for (const blackUid of this.FriendData.BlackList) {
                const blackData = await this._playerRepo.FindByUserId(blackUid);
                if (!blackData)
                    continue;
                blackInfos.push({
                    userId: blackData.userID,
                    nickname: blackData.nick,
                    color: blackData.color
                });
            }
            await this.Player.SendPacket(new Send_1.PacketBlackList(blackInfos));
        }
        catch (error) {
            utils_1.Logger.Error(`[FriendManager] HandleGetBlacklist failed`, error);
        }
    }
    /**
     * 查看在线好友
     */
    async HandleSeeOnline() {
        try {
            const onlineInfos = [];
            for (const friendUid of this.FriendData.FriendList) {
                if (OnlineTracker_1.OnlineTracker.Instance.IsOnline(friendUid)) {
                    const friendData = await this._playerRepo.FindByUserId(friendUid);
                    if (!friendData)
                        continue;
                    onlineInfos.push({
                        userId: friendData.userID,
                        serverId: 1,
                        mapType: 0,
                        mapId: friendData.mapID
                    });
                }
            }
            await this.Player.SendPacket(new Send_1.PacketSeeOnline(onlineInfos));
        }
        catch (error) {
            utils_1.Logger.Error(`[FriendManager] HandleSeeOnline failed`, error);
        }
    }
    // ==================== 公开 API（供跨玩家操作使用） ====================
    /**
     * 接收好友申请（由其他玩家的 FriendManager 调用）
     */
    ReceiveFriendApply(fromUid) {
        if (!this.FriendData.ReceiveApplyList.includes(fromUid)) {
            this.FriendData.ReceiveApplyList.push(fromUid);
        }
    }
    /**
     * 移除已发送的好友申请（对方确认/拒绝后调用）
     */
    RemoveSentApply(targetUid) {
        const idx = this.FriendData.SendApplyList.indexOf(targetUid);
        if (idx > -1) {
            this.FriendData.SendApplyList.splice(idx, 1);
        }
    }
    /**
     * 被添加为好友（对方确认申请后调用）
     */
    AddFriendEntry(friendUid) {
        if (!this.FriendData.FriendList.includes(friendUid)) {
            this.FriendData.FriendList.push(friendUid);
        }
    }
    /**
     * 被删除好友（对方删除好友后调用）
     */
    RemoveFriendEntry(friendUid) {
        const idx = this.FriendData.FriendList.indexOf(friendUid);
        if (idx > -1) {
            this.FriendData.FriendList.splice(idx, 1);
        }
    }
    /**
     * 获取好友列表（只读）
     */
    GetFriendList() {
        return this.FriendData.FriendList;
    }
    /**
     * 获取黑名单列表（只读）
     */
    GetBlackList() {
        return this.FriendData.BlackList;
    }
    // ==================== 业务方法 ====================
    /**
     * 登出清理
     */
    async OnLogout() {
        // FriendData 继承 BaseData，会自动保存
        // 这里不需要手动调用 save()
        utils_1.Logger.Debug(`[FriendManager] 玩家登出: uid=${this.UserID}`);
    }
}
exports.FriendManager = FriendManager;
//# sourceMappingURL=FriendManager.js.map