/**
 * MailData 访问器
 * 提供 MailData 的便捷访问接口
 */
import { MailData } from '../models/MailData';
/**
 * MailData 访问器
 */
export declare class MailDataAccessor {
    private static _instance;
    private constructor();
    static get Instance(): MailDataAccessor;
    /**
     * 获取或创建 MailData
     */
    GetOrCreate(uid: number): Promise<MailData>;
    /**
     * 获取 MailData（不创建）
     */
    Get(uid: number): MailData | null;
    /**
     * 保存 MailData
     */
    Save(data: MailData): Promise<void>;
}
//# sourceMappingURL=MailDataAccessor.d.ts.map