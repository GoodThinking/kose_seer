"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterManager = exports.RegisterResult = void 0;
const Register_1 = require("../../Server/Packet/Send/Register");
const DataBase_1 = require("../../../DataBase");
const utils_1 = require("../../../shared/utils");
const ServerConfig_1 = require("../../../shared/config/ServerConfig");
const InvitationRepository_1 = require("../../../DataBase/repositories/Player/InvitationRepository");
const crypto_1 = require("crypto");
/**
 * 注册结果码
 */
var RegisterResult;
(function (RegisterResult) {
    RegisterResult[RegisterResult["SUCCESS"] = 0] = "SUCCESS";
    RegisterResult[RegisterResult["SYSTEM_ERROR"] = 5001] = "SYSTEM_ERROR";
    RegisterResult[RegisterResult["ACCOUNT_EXISTS"] = 5002] = "ACCOUNT_EXISTS";
    RegisterResult[RegisterResult["INVALID_CODE"] = 5012] = "INVALID_CODE";
})(RegisterResult || (exports.RegisterResult = RegisterResult = {}));
/**
 * 注册管理器
 * 负责处理账号注册相关的业务逻辑
 */
class RegisterManager {
    _packetBuilder;
    _packetRegister;
    _packetSendEmailCode;
    _packetRequestRegister;
    _accountRepo;
    _emailCodes = new Map();
    _cleanupTimer = null;
    constructor(packetBuilder) {
        this._packetBuilder = packetBuilder;
        this._packetRegister = new Register_1.PacketRegister(packetBuilder);
        this._packetSendEmailCode = new Register_1.PacketSendEmailCode(packetBuilder);
        this._packetRequestRegister = new Register_1.PacketRequestRegister(packetBuilder);
        this._accountRepo = new DataBase_1.AccountRepository();
        // 定期清理过期验证码（每5分钟）
        this._cleanupTimer = setInterval(() => this.CleanupExpiredCodes(), 300000);
    }
    /**
     * 清理资源（停止定时器）
     */
    Cleanup() {
        if (this._cleanupTimer) {
            clearInterval(this._cleanupTimer);
            this._cleanupTimer = null;
            utils_1.Logger.Debug('[RegisterManager] 清理定时器已停止');
        }
    }
    /**
     * 处理发送邮箱验证码
     * @param session 客户端会话
     * @param email 邮箱地址
     */
    async HandleSendEmailCode(session, email) {
        if (ServerConfig_1.Config.Regist.mode === 'invite') {
            session.Socket.write(this._packetSendEmailCode.Build('', RegisterResult.INVALID_CODE));
            return;
        }
        try {
            utils_1.Logger.Info(`[RegisterManager] 发送验证码请求: email=${email}`);
            // 1. 检查邮箱是否已注册
            const existingAccount = await this._accountRepo.FindByEmail(email);
            if (existingAccount) {
                utils_1.Logger.Warn(`[RegisterManager] 邮箱已被注册，拒绝发送验证码: ${email}`);
                const packet = this._packetSendEmailCode.Build('', RegisterResult.ACCOUNT_EXISTS);
                session.Socket.write(packet);
                return;
            }
            // 2. 检查是否已有未过期的验证码
            const existingCode = this._emailCodes.get(email);
            let code;
            let codeRes;
            if (existingCode && existingCode.expireTime > Date.now()) {
                // 使用现有的未过期验证码
                code = existingCode.code;
                codeRes = existingCode.codeRes;
                const remainingTime = Math.ceil((existingCode.expireTime - Date.now()) / 1000);
                utils_1.Logger.Info(`[RegisterManager] 使用现有验证码: 剩余有效期=${remainingTime}秒`);
            }
            else {
                // 生成新的6位数验证码
                code = Math.floor(100000 + Math.random() * 900000).toString();
                codeRes = code.padEnd(32, ' ');
                // 保存验证码（5分钟有效期）
                this._emailCodes.set(email, {
                    code,
                    codeRes,
                    expireTime: Date.now() + 300000 // 5分钟
                });
                utils_1.Logger.Info('[RegisterManager] 生成邮箱验证码，有效期=5分钟');
            }
            // 3. 发送响应，result=0表示成功
            const packet = this._packetSendEmailCode.Build(codeRes, RegisterResult.SUCCESS);
            session.Socket.write(packet);
            utils_1.Logger.Info('[RegisterManager] 邮箱验证码响应已发送');
            utils_1.Logger.Info(`[RegisterManager] 💡 客户端将显示: "发送验证码成功，请查看邮箱"`);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error(`[RegisterManager] 发送验证码失败: ${email}`, error);
            const packet = this._packetSendEmailCode.Build('', RegisterResult.SYSTEM_ERROR);
            session.Socket.write(packet);
        }
    }
    /**
     * 通过系统消息推送验证码
     * @param session 客户端会话
     * @param code 验证码
     */
    async SendVerificationCodeMessage(session, code) {
        try {
            // 动态导入 PacketSystemMessage 避免循环依赖
            const { PacketSystemMessage } = await Promise.resolve().then(() => __importStar(require('../../Server/Packet/Send/System/PacketSystemMessage')));
            const message = `您的验证码是：${code}（5分钟内有效）`;
            const packetMessage = new PacketSystemMessage(message);
            const buffer = this._packetBuilder.Build(packetMessage.getCmdId(), 0, // userID
            0, // result
            packetMessage.serialize());
            session.Socket.write(buffer);
            utils_1.Logger.Info('[RegisterManager] 验证码已通过系统消息推送');
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error('[RegisterManager] 推送验证码消息失败', error);
        }
    }
    /**
     * 处理账号注册
     * @param session 客户端会话
     * @param password 密码
     * @param email 邮箱
     * @param emailCode 验证码
     * @param emailCodeRes 验证码响应
     */
    async HandleRegister(session, password, email, emailCode, emailCodeRes) {
        if (ServerConfig_1.Config.Regist.mode === 'invite') {
            await this.HandleInviteRegister(session, password, email, emailCode);
            return;
        }
        try {
            utils_1.Logger.Info('[RegisterManager] 邮箱注册请求');
            // 1. 验证邮箱验证码
            const savedCode = this._emailCodes.get(email);
            if (!savedCode) {
                utils_1.Logger.Warn(`[RegisterManager] 验证码不存在: ${email}`);
                const packet = this._packetRegister.Build(0, RegisterResult.INVALID_CODE);
                session.Socket.write(packet);
                return;
            }
            if (savedCode.expireTime < Date.now()) {
                utils_1.Logger.Warn(`[RegisterManager] 验证码已过期: ${email}`);
                this._emailCodes.delete(email);
                const packet = this._packetRegister.Build(0, RegisterResult.INVALID_CODE);
                session.Socket.write(packet);
                return;
            }
            // 只验证用户输入的验证码，不验证 codeRes
            // 因为验证码通过错误码返回，客户端无法正确保存 codeRes
            if (savedCode.code !== emailCode) {
                utils_1.Logger.Warn('[RegisterManager] 验证码错误');
                const packet = this._packetRegister.Build(0, RegisterResult.INVALID_CODE);
                session.Socket.write(packet);
                return;
            }
            // 2. 检查邮箱是否已注册
            const existingAccount = await this._accountRepo.FindByEmail(email);
            if (existingAccount) {
                utils_1.Logger.Warn(`[RegisterManager] 邮箱已被注册: ${email}`);
                const packet = this._packetRegister.Build(0, RegisterResult.ACCOUNT_EXISTS);
                session.Socket.write(packet);
                return;
            }
            // 3. 对密码进行 MD5 hash（客户端登录时会发送 MD5，所以注册时也要保存 MD5）
            const crypto = require('crypto');
            const passwordHash = crypto.createHash('md5').update(password).digest('hex');
            // 4. 创建账号
            const userID = await this._accountRepo.CreateAccount(email, passwordHash);
            // 5. 清除验证码
            this._emailCodes.delete(email);
            utils_1.Logger.Info(`[RegisterManager] 注册成功: email=${email}, userID=${userID}`);
            // 5. 返回成功响应（userID 作为响应）
            const packet = this._packetRegister.Build(userID, RegisterResult.SUCCESS);
            session.Socket.write(packet);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error(`[RegisterManager] 注册失败: ${email}`, error);
            const packet = this._packetRegister.Build(0, RegisterResult.SYSTEM_ERROR);
            session.Socket.write(packet);
        }
    }
    async HandleInviteRegister(session, password, email, code) {
        let userId = 0;
        let result = RegisterResult.SYSTEM_ERROR;
        try {
            if (!password || Buffer.byteLength(password, 'utf8') > 32 ||
                Buffer.byteLength(email, 'utf8') > 64 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                result = RegisterResult.SYSTEM_ERROR;
            }
            else {
                const passwordHash = (0, crypto_1.createHash)('md5').update(password).digest('hex');
                const created = await new InvitationRepository_1.InvitationRepository().Register(email, passwordHash, code);
                if (created.kind === 'created') {
                    userId = created.userId;
                    result = RegisterResult.SUCCESS;
                }
                else {
                    result = created.kind === 'account_exists' ? RegisterResult.ACCOUNT_EXISTS : RegisterResult.INVALID_CODE;
                }
            }
        }
        catch {
            // Do not put driver errors or submitted secrets in registration logs.
            utils_1.Logger.Error('[RegisterManager] Invitation registration failed');
        }
        // Sending failure cannot roll back or turn a committed account into a retryable grant.
        session.Socket.write(this._packetRegister.Build(userId, result));
    }
    /**
     * 处理请求注册（预留接口）
     * @param session 客户端会话
     */
    async HandleRequestRegister(session) {
        try {
            utils_1.Logger.Info('[RegisterManager] 请求注册');
            const packet = this._packetRequestRegister.Build();
            session.Socket.write(packet);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error('[RegisterManager] 请求注册失败', error);
            const packet = this._packetRequestRegister.Build(RegisterResult.SYSTEM_ERROR);
            session.Socket.write(packet);
        }
    }
    /**
     * 清理过期的验证码
     */
    CleanupExpiredCodes() {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [email, data] of this._emailCodes.entries()) {
            if (data.expireTime < now) {
                this._emailCodes.delete(email);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            utils_1.Logger.Debug(`[RegisterManager] 清理过期验证码: ${cleanedCount} 个`);
        }
    }
}
exports.RegisterManager = RegisterManager;
//# sourceMappingURL=RegisterManager.js.map