import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: REGISTER (2)] 注册账号响应
 *
 * 响应格式:
 * - result: 错误码 (0=成功, 5001=系统错误, 5002=邮箱已注册, 5012=验证码错误)
 * - userID: 新注册的米米号 (成功时返回)
 */
export declare class RegisterRspProto extends BaseProto {
    userID: number;
    constructor();
    serialize(): Buffer;
    /**
     * 辅助方法：设置用户ID
     */
    setUserID(userID: number): this;
}
//# sourceMappingURL=RegisterRspProto.d.ts.map