"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastService = void 0;
const utils_1 = require("../../../shared/utils");
const PacketSystemMessage_1 = require("../../Server/Packet/Send/System/PacketSystemMessage");
const OnlineTracker_1 = require("../Player/OnlineTracker");
/**
 * 通用广播服务
 * - map/world/team/player 统一入口
 * - 为聊天/动作/系统通知等广播场景提供统一能力
 */
class BroadcastService {
    static _instance;
    _onlineTracker;
    constructor() {
        this._onlineTracker = OnlineTracker_1.OnlineTracker.Instance;
    }
    static get Instance() {
        if (!BroadcastService._instance) {
            BroadcastService._instance = new BroadcastService();
        }
        return BroadcastService._instance;
    }
    /**
     * 统一广播入口
     * 返回实际发送成功数量
     */
    async Broadcast(proto, target) {
        switch (target.scope) {
            case 'map':
                return this.BroadcastToMap(target.mapId || 0, proto, target.excludeUserId);
            case 'world':
                return this.BroadcastToWorld(proto, target.excludeUserId);
            case 'team':
                return this.BroadcastToTeam(target.teamId || 0, proto, target.excludeUserId);
            case 'player':
                if (!target.userId)
                    return 0;
                return (await this.SendToPlayer(target.userId, proto)) ? 1 : 0;
            default:
                return 0;
        }
    }
    async SendToPlayer(userId, proto) {
        if (!userId)
            return false;
        return this._onlineTracker.SendToPlayer(userId, proto);
    }
    async BroadcastToMap(mapId, proto, excludeUserId) {
        if (mapId <= 0)
            return 0;
        return this._onlineTracker.BroadcastToMap(mapId, proto, excludeUserId);
    }
    async BroadcastToWorld(proto, excludeUserId) {
        let sent = 0;
        const sessions = this._onlineTracker.GetAllClients();
        for (const session of sessions) {
            if (excludeUserId !== undefined && session.UserID === excludeUserId) {
                continue;
            }
            if (!session.Player) {
                continue;
            }
            try {
                await session.Player.SendPacket(proto);
                sent++;
            }
            catch (error) {
                utils_1.Logger.Error(`[BroadcastService] World broadcast failed: userId=${session.UserID}`, error);
            }
        }
        return sent;
    }
    async BroadcastToTeam(teamId, proto, excludeUserId) {
        if (teamId <= 0)
            return 0;
        let sent = 0;
        const sessions = this._onlineTracker.GetAllClients();
        for (const session of sessions) {
            if (excludeUserId !== undefined && session.UserID === excludeUserId) {
                continue;
            }
            if (!session.Player) {
                continue;
            }
            const playerTeamId = Number(session.Player.Data?.teamInfo?.id || 0);
            if (playerTeamId !== teamId) {
                continue;
            }
            try {
                await session.Player.SendPacket(proto);
                sent++;
            }
            catch (error) {
                utils_1.Logger.Error(`[BroadcastService] Team broadcast failed: userId=${session.UserID}, teamId=${teamId}`, error);
            }
        }
        return sent;
    }
    /**
     * 系统消息广播（默认全服）
     */
    async BroadcastSystemMessage(message, options) {
        const packet = new PacketSystemMessage_1.PacketSystemMessage(message, options?.npcId || 0, options?.type || 0);
        const target = {
            scope: options?.scope || 'world',
            mapId: options?.mapId,
            teamId: options?.teamId,
            userId: options?.userId,
            excludeUserId: options?.excludeUserId,
        };
        return this.Broadcast(packet, target);
    }
}
exports.BroadcastService = BroadcastService;
//# sourceMappingURL=BroadcastService.js.map