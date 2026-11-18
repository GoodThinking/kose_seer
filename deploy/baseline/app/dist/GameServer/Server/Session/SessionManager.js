"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const protocol_1 = require("../../../shared/protocol");
const IHandler_1 = require("../Packet/IHandler");
const utils_1 = require("../../../shared/utils");
const crypto_1 = require("../../../shared/crypto");
/**
 * 客户端会话管理器
 */
class SessionManager {
    _sessions = new Map();
    _protocolVersion;
    constructor(protocolVersion = '1') {
        this._protocolVersion = protocolVersion;
    }
    /**
     * 创建新会话
     */
    CreateSession(socket) {
        const address = `${socket.remoteAddress}:${socket.remotePort}`;
        const session = {
            Socket: socket,
            Parser: new protocol_1.PacketParser(this._protocolVersion),
            UserID: 0,
            Address: address,
            PolicyHandled: false,
            Crypto: new crypto_1.CryptoHandler(),
            EncryptionEnabled: false,
            Type: IHandler_1.SessionType.MAIN, // 默认为主连接
        };
        this._sessions.set(address, session);
        utils_1.Logger.Info(`客户端接入: ${address}`);
        return session;
    }
    /**
     * 移除会话
     */
    RemoveSession(address) {
        this._sessions.delete(address);
        utils_1.Logger.Info(`客户端断开: ${address}`);
    }
    /**
     * 获取会话
     */
    GetSession(address) {
        return this._sessions.get(address);
    }
    /**
     * 获取所有会话
     */
    GetAllSessions() {
        return Array.from(this._sessions.values());
    }
    /**
     * 获取在线人数
     */
    get OnlineCount() {
        return this._sessions.size;
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=SessionManager.js.map