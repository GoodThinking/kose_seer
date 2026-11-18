import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: SEND_EMAIL_CODE (3)] 发送邮箱验证码请求
 *
 * 请求格式:
 * - emailAddress(64字节): 邮箱地址
 */
export declare class SendEmailCodeReqProto extends BaseProto {
    emailAddress: string;
    constructor();
    serialize(): Buffer;
    /**
     * 从Buffer解析发送验证码请求
     */
    deserialize(buffer: Buffer): void;
}
//# sourceMappingURL=SendEmailCodeReqProto.d.ts.map