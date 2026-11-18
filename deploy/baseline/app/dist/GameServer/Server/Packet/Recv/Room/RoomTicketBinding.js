"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomTicketBinding = void 0;
const crypto_1 = require("crypto");
const SessionRepository_1 = require("../../../../../DataBase/repositories/Player/SessionRepository");
const PlayerManager_1 = require("../../../../Game/Player/PlayerManager");
const IHandler_1 = require("../../IHandler");
/** Bind the opaque room ticket to the authenticated main connection and issued target. */
class RoomTicketBinding {
    static Instance = new RoomTicketBinding();
    _tickets = new WeakMap();
    _sessions = new SessionRepository_1.SessionRepository();
    IsLive(player, main, key) {
        return player.Initialized && PlayerManager_1.PlayerManager.GetInstance().GetPlayer(player.Uid) === player &&
            player.Session === main && main.Player === player && main.UserID === player.Uid &&
            main.Type === IHandler_1.SessionType.MAIN && !main.Socket.destroyed && main.Socket.writable &&
            main.AuthenticatedSessionKey === key;
    }
    async IsValidSession(key, userId) {
        const info = await this._sessions.ValidateSession(key, userId);
        return !!info && info.sessionKey === key && info.accountId === userId &&
            info.isOnline && info.expireTime > Math.floor(Date.now() / 1000);
    }
    async Issue(main, targetUserId) {
        const player = main.Player;
        const key = main.AuthenticatedSessionKey;
        if (!player || !key || !/^[0-9a-f]{32}$/.test(key) || !this.IsLive(player, main, key)) {
            throw new Error('Room ticket requires an authenticated live main connection');
        }
        if (!await this.IsValidSession(key, player.Uid) || !this.IsLive(player, main, key)) {
            throw new Error('Room ticket main session is no longer valid');
        }
        const ticket = Buffer.alloc(24);
        ticket.writeUInt32BE(player.Uid, 0);
        ticket.writeUInt32BE(targetUserId, 4);
        Buffer.from(key, 'hex').copy(ticket, 8);
        this._tickets.set(player, { mainSession: main, sessionKey: key, targetUserId, ticket });
        return Buffer.from(ticket);
    }
    CanBind(room, player, targetUserId, ticket) {
        if (ticket.length !== 24 || ticket.readUInt32BE(0) !== player.Uid || ticket.readUInt32BE(4) !== targetUserId)
            return false;
        const issued = this._tickets.get(player);
        return !!issued && issued.targetUserId === targetUserId && (0, crypto_1.timingSafeEqual)(issued.ticket, ticket) &&
            this.IsLive(player, issued.mainSession, issued.sessionKey) && room !== issued.mainSession &&
            !room.Socket.destroyed && room.Socket.writable && !room.Player && room.UserID === 0;
    }
    async Validate(room, userId, targetUserId, ticket) {
        if (ticket.length !== 24 || ticket.readUInt32BE(0) !== userId)
            return null;
        const player = PlayerManager_1.PlayerManager.GetInstance().GetPlayer(userId);
        if (!player || !this.CanBind(room, player, targetUserId, ticket))
            return null;
        const issued = this._tickets.get(player);
        if (!await this.IsValidSession(issued.sessionKey, userId) || this._tickets.get(player) !== issued ||
            !this.CanBind(room, player, targetUserId, ticket))
            return null;
        return player;
    }
}
exports.RoomTicketBinding = RoomTicketBinding;
//# sourceMappingURL=RoomTicketBinding.js.map