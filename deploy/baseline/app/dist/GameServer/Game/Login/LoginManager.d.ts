import { PacketBuilder } from '../../../shared/protocol/PacketBuilder';
import { IClientSession } from '../../Server/Packet/IHandler';
/**
 * 登录结果码 (与客户端 ParseLoginSocketError.as 保持一致)
 */
export declare enum LoginResult {
    SUCCESS = 0,
    SYSTEM_ERROR = 5001,// 系统错误
    ACCOUNT_EXISTS = 5002,// 号码已被注册
    PASSWORD_ERROR = 5003,// 密码错误
    NOT_ACTIVATED = 5004,// 号码尚未激活
    ACCOUNT_NOT_FOUND = 5005,// 号码不存在
    BANNED_PERMANENT = 5006,// 号码被永久封停
    BANNED_24H = 5007,// 号码被24小时封停
    PROTOCOL_ERROR = 5008,// 协议不对
    TOO_MANY_ATTEMPTS = 5009,// 密码输错次数太多
    INVALID_NICKNAME = 5010,// 不合法的昵称
    SERVER_MAINTENANCE = 5011,// 服务器维护
    INVALID_INVITE_CODE = 5012,// 非法的邀请码
    BANNED_PERMANENT_2 = 5013,// 你的号码被永久封停
    BANNED_24H_2 = 5014,// 你的号码被24小时封停
    BANNED_7D = 5015,// 你的号码被7天封停
    BANNED_14D = 5016
}
/**
 * 玩家信息接口
 */
export interface IPlayerData {
    userID: number;
    nickname: string;
    level: number;
    exp: number;
    coins: number;
    roleCreated: boolean;
}
/**
 * 登录管理器
 * 负责处理登录相关的业务逻辑
 */
export declare class LoginManager {
    private _packetBuilder;
    private _packetGameLogin;
    private _accountRepo;
    private _sessionRepo;
    private _playerRepo;
    private _playerManager;
    constructor(packetBuilder: PacketBuilder);
    /**
     * 发送Proto响应（没有Player实例时使用）
     */
    private sendProto;
    /**
     * 处理主登录
     * @param session 客户端会话
     * @param userID 用户ID (米米号)
     * @param passwordMD5 密码MD5
     */
    HandleMainLogin(session: IClientSession, userID: number, passwordMD5?: Buffer): Promise<void>;
    /**
     * 处理邮箱登录
     * @param session 客户端会话
     * @param email 邮箱地址
     * @param passwordMD5 密码MD5
     */
    HandleEmailLogin(session: IClientSession, email: string, passwordMD5?: Buffer): Promise<void>;
    /**
     * 根据账号状态获取封禁错误码
     */
    private getBanResultCode;
    /**
     * 处理游戏登录
     * @param session 客户端会话
     * @param userID 用户ID
     * @param sessionData 会话标识
     */
    HandleGameLogin(session: IClientSession, userID: number, sessionData?: Buffer): Promise<void>;
    /**
     * 获取玩家数据
     */
    GetPlayer(userID: number): Promise<IPlayerData | null>;
    /**
     * 创建玩家
     * @param session 客户端会话
     * @param userID 用户ID
     * @param nickname 昵称
     * @param color 颜色
     */
    CreatePlayer(session: IClientSession, userID: number, nickname: string, color?: number): Promise<void>;
    /**
     * 玩家登出
     */
    HandleLogout(userID: number): Promise<void>;
}
//# sourceMappingURL=LoginManager.d.ts.map