import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { LoginManager } from '../../../../Game/Login/LoginManager';
/**
 * [CMD: CREATE_ROLE (108)] 创建角色处理�?
 * 请求: userID(4字节) + nickname(16字节) + color(4字节) = 24字节
 * 响应: session(16字节)
 */
export declare class CreateRoleHandler implements IHandler {
    private _loginManager;
    constructor(loginManager: LoginManager);
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=CreateRoleHandler.d.ts.map