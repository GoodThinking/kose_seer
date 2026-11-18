/**
 * 邮箱验证码仓库
 */
import { BaseRepository } from '../BaseRepository';
import { IEmailCodeInfo } from '../../../shared/models';
/**
 * 数据库验证码行类型
 */
interface IEmailCodeRow {
    id: number;
    email: string;
    code: string;
    code_res: string;
    create_time: number;
    expire_time: number;
    used: number;
}
export declare class EmailCodeRepository extends BaseRepository<IEmailCodeRow> {
    protected _tableName: string;
    /**
     * 创建验证码
     */
    CreateCode(email: string, expireSeconds?: number): Promise<IEmailCodeInfo>;
    /**
     * 根据验证码响应查找
     */
    FindByCodeRes(codeRes: string): Promise<IEmailCodeInfo | null>;
    /**
     * 验证验证码
     */
    VerifyCode(email: string, code: string): Promise<IEmailCodeInfo | null>;
    /**
     * 标记验证码已使用
     */
    MarkAsUsed(id: number): Promise<boolean>;
    /**
     * 根据邮箱标记所有验证码已使用
     */
    MarkAllAsUsedByEmail(email: string): Promise<number>;
    /**
     * 删除过期验证码
     */
    DeleteExpired(): Promise<number>;
    /**
     * 获取邮箱的未使用验证码数量
     */
    GetUnusedCount(email: string): Promise<number>;
    /**
     * 检查是否可以发送新验证码（限制频率）
     */
    CanSendCode(email: string, cooldownSeconds?: number): Promise<boolean>;
    /**
     * 转换为 IEmailCodeInfo
     */
    private toEmailCodeInfo;
}
export {};
//# sourceMappingURL=EmailCodeRepository.d.ts.map