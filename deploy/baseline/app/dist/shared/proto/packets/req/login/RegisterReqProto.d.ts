import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: REGISTER (2)] 注册账号请求
 *
 * 请求格式:
 * - password(32字节): 密码
 * - emailAddress(64字节): 邮箱地址
 * - emailCode(32字节): 验证码
 * - emailCodeRes(32字节): 验证码响应
 */
export declare class RegisterReqProto extends BaseProto {
    password: string;
    emailAddress: string;
    emailCode: string;
    emailCodeRes: string;
    constructor();
    serialize(): Buffer;
    /**
     * 从Buffer解析注册请求
     */
    deserialize(buffer: Buffer): void;
}
//# sourceMappingURL=RegisterReqProto.d.ts.map