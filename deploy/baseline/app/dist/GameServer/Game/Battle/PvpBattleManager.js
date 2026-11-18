"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PvpBattleManager = void 0;
const utils_1 = require("../../../shared/utils");
const OnlineTracker_1 = require("../Player/OnlineTracker");
/**
 * PVP对战管理器（单例）
 * 管理玩家之间的对战邀请和匹配
 */
class PvpBattleManager {
    static _instance;
    // 邀请列表: inviterId_targetId -> IPvpInvite
    _invites = new Map();
    // 玩家的待处理邀请: userId -> inviterId[]
    _pendingInvites = new Map();
    // PVP战斗房间: roomKey -> IPvpBattleRoom
    _battleRooms = new Map();
    // 玩家所在房间: userId -> roomKey
    _playerRooms = new Map();
    // 邀请超时时间（毫秒）
    INVITE_TIMEOUT = 60000; // 60秒
    // 房间超时时间（毫秒）
    ROOM_TIMEOUT = 300000; // 5分钟
    constructor() {
        // 定期清理超时邀请和房间
        setInterval(() => {
            this.CleanupExpiredInvites();
            this.CleanupExpiredRooms();
        }, 10000);
    }
    static get Instance() {
        if (!PvpBattleManager._instance) {
            PvpBattleManager._instance = new PvpBattleManager();
        }
        return PvpBattleManager._instance;
    }
    /**
     * 创建邀请
     */
    CreateInvite(inviterId, inviterNick, targetId, targetNick) {
        // 检查目标玩家是否在线
        if (!OnlineTracker_1.OnlineTracker.Instance.IsOnline(targetId)) {
            utils_1.Logger.Warn(`[PvpBattleManager] 目标玩家不在线: targetId=${targetId}`);
            return false;
        }
        // 检查是否已有邀请
        const key = this.GetInviteKey(inviterId, targetId);
        if (this._invites.has(key)) {
            utils_1.Logger.Warn(`[PvpBattleManager] 邀请已存在: inviterId=${inviterId}, targetId=${targetId}`);
            return false;
        }
        // 创建邀请
        const invite = {
            inviterId,
            inviterNick,
            targetId,
            targetNick,
            timestamp: Date.now()
        };
        this._invites.set(key, invite);
        // 添加到待处理列表
        let pending = this._pendingInvites.get(targetId);
        if (!pending) {
            pending = [];
            this._pendingInvites.set(targetId, pending);
        }
        pending.push(inviterId);
        utils_1.Logger.Info(`[PvpBattleManager] 创建邀请: inviterId=${inviterId}, inviterNick=${inviterNick}, ` +
            `targetId=${targetId}, targetNick=${targetNick}`);
        return true;
    }
    /**
     * 取消邀请
     */
    CancelInvite(inviterId, targetId) {
        const key = this.GetInviteKey(inviterId, targetId);
        const invite = this._invites.get(key);
        if (!invite) {
            utils_1.Logger.Warn(`[PvpBattleManager] 邀请不存在: inviterId=${inviterId}, targetId=${targetId}`);
            return false;
        }
        // 移除邀请
        this._invites.delete(key);
        // 从待处理列表移除
        const pending = this._pendingInvites.get(targetId);
        if (pending) {
            const index = pending.indexOf(inviterId);
            if (index !== -1) {
                pending.splice(index, 1);
            }
            if (pending.length === 0) {
                this._pendingInvites.delete(targetId);
            }
        }
        utils_1.Logger.Info(`[PvpBattleManager] 取消邀请: inviterId=${inviterId}, targetId=${targetId}`);
        return true;
    }
    /**
     * 处理邀请（接受/拒绝）
     */
    HandleInvite(inviterId, targetId, accept) {
        const key = this.GetInviteKey(inviterId, targetId);
        const invite = this._invites.get(key);
        if (!invite) {
            utils_1.Logger.Warn(`[PvpBattleManager] 邀请不存在: inviterId=${inviterId}, targetId=${targetId}`);
            return null;
        }
        // 移除邀请
        this._invites.delete(key);
        // 从待处理列表移除
        const pending = this._pendingInvites.get(targetId);
        if (pending) {
            const index = pending.indexOf(inviterId);
            if (index !== -1) {
                pending.splice(index, 1);
            }
            if (pending.length === 0) {
                this._pendingInvites.delete(targetId);
            }
        }
        utils_1.Logger.Info(`[PvpBattleManager] 处理邀请: inviterId=${inviterId}, targetId=${targetId}, accept=${accept}`);
        return invite;
    }
    /**
     * 创建PVP战斗房间
     */
    CreateBattleRoom(player1Id, player2Id) {
        const roomKey = this.GetRoomKey(player1Id, player2Id);
        // 检查是否已有房间
        if (this._battleRooms.has(roomKey)) {
            utils_1.Logger.Warn(`[PvpBattleManager] 房间已存在: ${roomKey}`);
            return roomKey;
        }
        const room = {
            player1Id,
            player2Id,
            battle: null,
            player1Ready: false,
            player2Ready: false,
            player1Action: null,
            player2Action: null,
            player1LoadPercent: 0,
            player2LoadPercent: 0,
            createdAt: Date.now()
        };
        this._battleRooms.set(roomKey, room);
        this._playerRooms.set(player1Id, roomKey);
        this._playerRooms.set(player2Id, roomKey);
        utils_1.Logger.Info(`[PvpBattleManager] 创建战斗房间: ${roomKey}`);
        return roomKey;
    }
    /**
     * 设置玩家准备状态
     */
    SetPlayerReady(userId) {
        const roomKey = this._playerRooms.get(userId);
        if (!roomKey) {
            utils_1.Logger.Warn(`[PvpBattleManager] 玩家不在任何房间: userId=${userId}`);
            return false;
        }
        const room = this._battleRooms.get(roomKey);
        if (!room) {
            utils_1.Logger.Warn(`[PvpBattleManager] 房间不存在: ${roomKey}`);
            return false;
        }
        if (room.player1Id === userId) {
            room.player1Ready = true;
        }
        else if (room.player2Id === userId) {
            room.player2Ready = true;
        }
        utils_1.Logger.Info(`[PvpBattleManager] 玩家准备: userId=${userId}, room=${roomKey}`);
        return room.player1Ready && room.player2Ready;
    }
    /**
     * 设置玩家加载进度
     */
    SetPlayerLoadPercent(userId, percent) {
        const roomKey = this._playerRooms.get(userId);
        if (!roomKey)
            return;
        const room = this._battleRooms.get(roomKey);
        if (!room)
            return;
        if (room.player1Id === userId) {
            room.player1LoadPercent = percent;
        }
        else if (room.player2Id === userId) {
            room.player2LoadPercent = percent;
        }
    }
    /**
     * 获取对方玩家的加载进度
     */
    GetOpponentLoadPercent(userId) {
        const roomKey = this._playerRooms.get(userId);
        if (!roomKey)
            return 0;
        const room = this._battleRooms.get(roomKey);
        if (!room)
            return 0;
        if (room.player1Id === userId) {
            return room.player2LoadPercent;
        }
        else if (room.player2Id === userId) {
            return room.player1LoadPercent;
        }
        return 0;
    }
    /**
     * 获取玩家所在房间
     */
    GetPlayerRoom(userId) {
        const roomKey = this._playerRooms.get(userId);
        if (!roomKey)
            return null;
        return this._battleRooms.get(roomKey) || null;
    }
    /**
     * 设置房间战斗实例
     */
    SetRoomBattle(roomKey, battle) {
        const room = this._battleRooms.get(roomKey);
        if (room) {
            room.battle = battle;
        }
    }
    /**
     * 移除战斗房间
     */
    RemoveBattleRoom(roomKey) {
        const room = this._battleRooms.get(roomKey);
        if (room) {
            this._playerRooms.delete(room.player1Id);
            this._playerRooms.delete(room.player2Id);
            this._battleRooms.delete(roomKey);
            utils_1.Logger.Info(`[PvpBattleManager] 移除战斗房间: ${roomKey}`);
        }
    }
    /**
     * 获取邀请信息
     */
    GetInvite(inviterId, targetId) {
        const key = this.GetInviteKey(inviterId, targetId);
        return this._invites.get(key) || null;
    }
    /**
     * 获取玩家的所有待处理邀请
     */
    GetPendingInvites(userId) {
        return this._pendingInvites.get(userId) || [];
    }
    /**
     * 清理超时邀请
     */
    CleanupExpiredInvites() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, invite] of this._invites.entries()) {
            if (now - invite.timestamp > this.INVITE_TIMEOUT) {
                this._invites.delete(key);
                // 从待处理列表移除
                const pending = this._pendingInvites.get(invite.targetId);
                if (pending) {
                    const index = pending.indexOf(invite.inviterId);
                    if (index !== -1) {
                        pending.splice(index, 1);
                    }
                    if (pending.length === 0) {
                        this._pendingInvites.delete(invite.targetId);
                    }
                }
                cleaned++;
            }
        }
        if (cleaned > 0) {
            utils_1.Logger.Info(`[PvpBattleManager] 清理超时邀请: ${cleaned}个`);
        }
    }
    /**
     * 清理超时房间
     */
    CleanupExpiredRooms() {
        const now = Date.now();
        let cleaned = 0;
        for (const [roomKey, room] of this._battleRooms.entries()) {
            if (now - room.createdAt > this.ROOM_TIMEOUT) {
                this.RemoveBattleRoom(roomKey);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            utils_1.Logger.Info(`[PvpBattleManager] 清理超时房间: ${cleaned}个`);
        }
    }
    /**
     * 玩家登出时清理相关邀请和房间
     */
    OnPlayerLogout(userId) {
        // 清理作为邀请者的邀请
        const toRemove = [];
        for (const [key, invite] of this._invites.entries()) {
            if (invite.inviterId === userId || invite.targetId === userId) {
                toRemove.push(key);
            }
        }
        for (const key of toRemove) {
            const invite = this._invites.get(key);
            if (invite) {
                this._invites.delete(key);
                // 从待处理列表移除
                const pending = this._pendingInvites.get(invite.targetId);
                if (pending) {
                    const index = pending.indexOf(invite.inviterId);
                    if (index !== -1) {
                        pending.splice(index, 1);
                    }
                    if (pending.length === 0) {
                        this._pendingInvites.delete(invite.targetId);
                    }
                }
            }
        }
        // 清理待处理列表
        this._pendingInvites.delete(userId);
        // 清理战斗房间
        const roomKey = this._playerRooms.get(userId);
        if (roomKey) {
            this.RemoveBattleRoom(roomKey);
        }
        if (toRemove.length > 0) {
            utils_1.Logger.Info(`[PvpBattleManager] 玩家登出，清理邀请: userId=${userId}, count=${toRemove.length}`);
        }
    }
    /**
     * 设置玩家回合动作
     * @returns true 如果双方都已提交动作
     */
    SetPlayerAction(userId, action) {
        const roomKey = this._playerRooms.get(userId);
        if (!roomKey) {
            utils_1.Logger.Warn(`[PvpBattleManager] 设置动作失败，玩家不在房间: userId=${userId}`);
            return false;
        }
        const room = this._battleRooms.get(roomKey);
        if (!room) {
            utils_1.Logger.Warn(`[PvpBattleManager] 设置动作失败，房间不存在: ${roomKey}`);
            return false;
        }
        if (room.player1Id === userId) {
            room.player1Action = action;
        }
        else if (room.player2Id === userId) {
            room.player2Action = action;
        }
        else {
            return false;
        }
        utils_1.Logger.Info(`[PvpBattleManager] 玩家提交动作: userId=${userId}, type=${action.type}, skillId=${action.skillId || 0}`);
        return room.player1Action !== null && room.player2Action !== null;
    }
    /**
     * 获取双方动作
     */
    GetActions(userId) {
        const roomKey = this._playerRooms.get(userId);
        if (!roomKey)
            return null;
        const room = this._battleRooms.get(roomKey);
        if (!room || !room.player1Action || !room.player2Action)
            return null;
        return {
            player1Action: room.player1Action,
            player2Action: room.player2Action,
            player1Id: room.player1Id,
            player2Id: room.player2Id
        };
    }
    /**
     * 清空双方动作（回合结算后调用）
     */
    ClearActions(userId) {
        const roomKey = this._playerRooms.get(userId);
        if (!roomKey)
            return;
        const room = this._battleRooms.get(roomKey);
        if (!room)
            return;
        room.player1Action = null;
        room.player2Action = null;
        utils_1.Logger.Debug(`[PvpBattleManager] 清空回合动作: room=${roomKey}`);
    }
    /**
     * 生成邀请键
     */
    GetInviteKey(inviterId, targetId) {
        return `${inviterId}_${targetId}`;
    }
    /**
     * 生成房间键
     */
    GetRoomKey(player1Id, player2Id) {
        // 确保键的唯一性（小ID在前）
        const [id1, id2] = player1Id < player2Id ? [player1Id, player2Id] : [player2Id, player1Id];
        return `${id1}_${id2}`;
    }
}
exports.PvpBattleManager = PvpBattleManager;
//# sourceMappingURL=PvpBattleManager.js.map