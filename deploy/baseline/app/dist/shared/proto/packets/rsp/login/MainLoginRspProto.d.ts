import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: MAIN_LOGIN_IN (104)] 主登录响应
 */
export declare class MainLoginRspProto extends BaseProto {
    session: Buffer;
    roleCreated: number;
    constructor();
    serialize(): Buffer;
    /**
     * 辅助方法：设置Session
     */
    setSession(sessionKey: string | undefined): this;
    /**
     * 辅助方法：设置角色创建状态
     */
    setRoleCreated(created: boolean): this;
}
//# sourceMappingURL=MainLoginRspProto.d.ts.map