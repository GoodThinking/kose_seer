import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: LOGIN_IN (1001)] 游戏登录请求
 * 用于解析客户端发来的登录请求
 */
export declare class LoginReqProto extends BaseProto {
    session: Buffer;
    constructor();
    serialize(): Buffer;
    /**
     * 从Buffer快速解析
     */
    static fromBuffer(buffer: Buffer): LoginReqProto;
    /**
     * 获取Session字符串
     */
    getSessionKey(): string;
}
//# sourceMappingURL=LoginReqProto.d.ts.map