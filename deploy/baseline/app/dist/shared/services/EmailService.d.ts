/**
 * 邮件服务配置
 */
export interface IEmailServiceConfig {
    enabled: boolean;
    smtp: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };
    from: string;
    templateSubject: string;
    templateBody: string;
}
/**
 * 邮件服务 (单例)
 */
export declare class EmailService {
    private static _instance;
    private _config;
    private _transporter;
    private constructor();
    /**
     * 获取单例实例
     */
    static get Instance(): EmailService;
    /**
     * 初始化邮件传输器
     */
    private Initialize;
    /**
     * 发送验证码邮件
     * @param to 收件人邮箱
     * @param code 验证码
     * @returns 是否发送成功
     */
    SendVerificationCode(to: string, code: string): Promise<boolean>;
    /**
     * 是否已启用
     */
    get IsEnabled(): boolean;
}
//# sourceMappingURL=EmailService.d.ts.map