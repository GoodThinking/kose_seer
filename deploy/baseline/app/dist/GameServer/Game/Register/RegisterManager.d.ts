import { PacketBuilder } from '../../../shared/protocol/PacketBuilder';
import { IClientSession } from '../../Server/Packet/IHandler';
/**
 * 注册结果码
 */
export declare enum RegisterResult {
    SUCCESS = 0,
    SYSTEM_ERROR = 5001,
    ACCOUNT_EXISTS = 5002,
    INVALID_CODE = 5012
}
/**
 * 注册管理器
 * 负责处理账号注册相关的业务逻辑
 */
export declare class RegisterManager {
    private _packetBuilder;
    private _packetRegister;
    private _packetSendEmailCode;
    private _packetRequestRegister;
    private _accountRepo;
    private _emailCodes;
    private _cleanupTimer;
    constructor(packetBuilder: PacketBuilder);
    /**
     * 清理资源（停止定时器）
     */
    Cleanup(): void;
    /**
     * 处理发送邮箱验证码
     * @param session 客户端会话
     * @param email 邮箱地址
     */
    HandleSendEmailCode(session: IClientSession, email: string): Promise<void>;
    /**
     * 通过系统消息推送验证码
     * @param session 客户端会话
     * @param code 验证码
     */
    private SendVerificationCodeMessage;
    /**
     * 处理账号注册
     * @param session 客户端会话
     * @param password 密码
     * @param email 邮箱
     * @param emailCode 验证码
     * @param emailCodeRes 验证码响应
     */
    HandleRegister(session: IClientSession, password: string, email: string, emailCode: string, emailCodeRes: string): Promise<void>;
    /**
     * 处理请求注册（预留接口）
     * @param session 客户端会话
     */
    HandleRequestRegister(session: IClientSession): Promise<void>;
    /**
     * 清理过期的验证码
     */
    private CleanupExpiredCodes;
}
//# sourceMappingURL=RegisterManager.d.ts.map