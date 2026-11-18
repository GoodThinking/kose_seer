import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: MAIN_LOGIN_IN (104)] 主登录请求
 *
 * 米米号登录: passwordMD5(32字节)
 * 邮箱登录: email(64字节) + passwordMD5(32字节) + unknown(4) + loginType(4) + unknown(4)
 */
export declare class MainLoginReqProto extends BaseProto {
    passwordMD5?: Buffer;
    email?: string;
    loginType?: number;
    constructor();
    serialize(): Buffer;
    /**
     * 从Buffer解析米米号登录请求
     */
    static fromMimiLogin(buffer: Buffer): MainLoginReqProto;
    /**
     * 从Buffer解析邮箱登录请求
     */
    static fromEmailLogin(buffer: Buffer): MainLoginReqProto;
}
//# sourceMappingURL=MainLoginReqProto.d.ts.map