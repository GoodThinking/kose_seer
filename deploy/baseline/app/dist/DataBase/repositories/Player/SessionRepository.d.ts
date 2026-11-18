/**
 * 会话仓库
 */
import { BaseRepository } from '../BaseRepository';
import { ISessionInfo } from '../../../shared/models';
/**
 * 数据库会话行类型
 */
interface ISessionRow {
    id: number;
    account_id: number;
    session_key: string;
    create_time: number;
    expire_time: number;
    login_ip: string;
    server_id: number;
    is_online: number;
}
export declare class SessionRepository extends BaseRepository<ISessionRow> {
    protected _tableName: string;
    /**
     * 创建会话
     */
    CreateSession(accountId: number, loginIP: string, serverId?: number, expireSeconds?: number): Promise<ISessionInfo>;
    /**
     * 根据会话密钥查找会话
     */
    FindBySessionKey(sessionKey: string): Promise<ISessionInfo | null>;
    /**
     * 根据账号ID查找有效会话
     */
    FindValidByAccountId(accountId: number): Promise<ISessionInfo | null>;
    /**
     * 验证会话
     */
    ValidateSession(sessionKey: string): Promise<ISessionInfo | null>;
    /**
     * 更新在线状态
     */
    UpdateOnlineStatus(sessionKey: string, isOnline: boolean): Promise<boolean>;
    /**
     * 更新服务器ID
     */
    UpdateServerId(sessionKey: string, serverId: number): Promise<boolean>;
    /**
     * 延长会话有效期
     */
    ExtendSession(sessionKey: string, expireSeconds?: number): Promise<boolean>;
    /**
     * 使账号的所有会话失效
     */
    InvalidateAllByAccountId(accountId: number): Promise<number>;
    /**
     * 删除过期会话
     */
    DeleteExpired(): Promise<number>;
    /**
     * 转换为 ISessionInfo
     */
    private toSessionInfo;
}
export {};
//# sourceMappingURL=SessionRepository.d.ts.map