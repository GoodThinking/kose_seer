/**
 * 账号仓库
 */
import { BaseRepository } from '../BaseRepository';
import { IAccountInfo, AccountStatus } from '../../../shared/models';
/**
 * 数据库账号行类型
 */
interface IAccountRow {
    id: number;
    email: string;
    password_hash: string;
    status: number;
    create_time: number;
    last_login_time: number;
    last_login_ip: string;
    role_created: number;
}
export declare class AccountRepository extends BaseRepository<IAccountRow> {
    protected _tableName: string;
    /**
     * 根据邮箱查找账号
     */
    FindByEmail(email: string): Promise<IAccountInfo | null>;
    /**
     * 根据ID查找账号
     */
    FindAccountById(id: number): Promise<IAccountInfo | null>;
    /**
     * 创建账号
     * 用户ID从 100000000 开始
     */
    CreateAccount(email: string, passwordHash: string): Promise<number>;
    /**
     * 更新最后登录信息
     */
    UpdateLastLogin(id: number, ip: string): Promise<boolean>;
    /**
     * 更新角色创建状态
     */
    UpdateRoleCreated(id: number, created: boolean): Promise<boolean>;
    /**
     * 更新账号状态
     */
    UpdateStatus(id: number, status: AccountStatus): Promise<boolean>;
    /**
     * 更新密码
     */
    UpdatePassword(id: number, passwordHash: string): Promise<boolean>;
    /**
     * 检查邮箱是否已存在
     */
    EmailExists(email: string): Promise<boolean>;
    /**
     * 验证密码
     */
    VerifyPassword(email: string, passwordHash: string): Promise<IAccountInfo | null>;
    /**
     * 转换为 IAccountInfo
     */
    private toAccountInfo;
}
export {};
//# sourceMappingURL=AccountRepository.d.ts.map