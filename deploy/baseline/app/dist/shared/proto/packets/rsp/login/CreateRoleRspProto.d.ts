import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: CREATE_ROLE (108)] 创建角色响应
 */
export declare class CreateRoleRspProto extends BaseProto {
    session: Buffer;
    constructor();
    serialize(): Buffer;
    /**
     * 辅助方法：设置Session
     */
    setSession(sessionKey: string | undefined): this;
}
//# sourceMappingURL=CreateRoleRspProto.d.ts.map