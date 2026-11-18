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
exports.EmailService = void 0;
/**
 * 邮件服务 (SMTP)
 * 负责发送真实电子邮件 (验证码、通知等)
 * 注意: 这不是游戏内邮件系统，游戏内邮件由 EmailServer 处理
 */
const nodemailer = __importStar(require("nodemailer"));
const utils_1 = require("../utils");
const config_1 = require("../config");
/**
 * 默认配置
 */
const DefaultConfig = {
    enabled: false,
    smtp: {
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        auth: {
            user: '',
            pass: '',
        },
    },
    from: 'noreply@seer.com',
    templateSubject: '【赛尔号】邮箱验证码',
    templateBody: '您的验证码是: {code}，有效期5分钟。请勿将验证码告诉他人。',
};
/**
 * 邮件服务 (单例)
 */
class EmailService {
    static _instance;
    _config;
    _transporter = null;
    constructor() {
        this._config = config_1.ConfigLoader.Load('email-service.json', DefaultConfig);
        this.Initialize();
    }
    /**
     * 获取单例实例
     */
    static get Instance() {
        if (!EmailService._instance) {
            EmailService._instance = new EmailService();
        }
        return EmailService._instance;
    }
    /**
     * 初始化邮件传输器
     */
    Initialize() {
        if (!this._config.enabled) {
            utils_1.Logger.Info('[EmailService] 邮件服务未启用，验证码将只记录到日志');
            return;
        }
        try {
            this._transporter = nodemailer.createTransport({
                host: this._config.smtp.host,
                port: this._config.smtp.port,
                secure: this._config.smtp.secure,
                auth: {
                    user: this._config.smtp.auth.user,
                    pass: this._config.smtp.auth.pass,
                },
            });
            utils_1.Logger.Info(`[EmailService] 邮件服务已初始化: ${this._config.smtp.host}:${this._config.smtp.port}`);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error('[EmailService] 初始化邮件服务失败', error);
        }
    }
    /**
     * 发送验证码邮件
     * @param to 收件人邮箱
     * @param code 验证码
     * @returns 是否发送成功
     */
    async SendVerificationCode(to, code) {
        // 如果未启用邮件服务，只记录日志
        if (!this._config.enabled || !this._transporter) {
            utils_1.Logger.Info(`[EmailService] 模拟发送验证码: to=${to}, code=${code}`);
            return true;
        }
        try {
            const subject = this._config.templateSubject;
            const body = this._config.templateBody.replace('{code}', code);
            await this._transporter.sendMail({
                from: this._config.from,
                to,
                subject,
                text: body,
                html: `<p>${body}</p>`,
            });
            utils_1.Logger.Info(`[EmailService] 验证码邮件已发送: to=${to}`);
            return true;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error(`[EmailService] 发送验证码邮件失败: to=${to}`, error);
            return false;
        }
    }
    /**
     * 是否已启用
     */
    get IsEnabled() {
        return this._config.enabled && this._transporter !== null;
    }
}
exports.EmailService = EmailService;
//# sourceMappingURL=EmailService.js.map