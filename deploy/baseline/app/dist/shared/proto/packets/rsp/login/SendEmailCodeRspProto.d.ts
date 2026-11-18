import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: SEND_EMAIL_CODE (3)] 发送邮箱验证码响应
 *
 * 响应格式:
 * - emailCodeRes(32字节): 验证码响应（用于后续注册验证）
 */
export declare class SendEmailCodeRspProto extends BaseProto {
    emailCodeRes: string;
    constructor();
    serialize(): Buffer;
    /**
     * 辅助方法：设置验证码响应
     */
    setEmailCodeRes(codeRes: string): this;
}
//# sourceMappingURL=SendEmailCodeRspProto.d.ts.map