import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { LoginManager } from '../../../../Game/Login/LoginManager';
/**
 * [CMD: MAIN_LOGIN_IN (104)] 主登录处理器
 * 米米号登录请�? passwordMD5(32字节)
 * 邮箱登录请求: email(64字节) + passwordMD5(32字节) + unknown(4字节) + loginType(4字节) + unknown(4字节)
 * 响应: session(16字节) + roleCreated(4字节)
 */
export declare class MainLoginHandler implements IHandler {
    private _loginManager;
    constructor(loginManager: LoginManager);
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=MainLoginHandler.d.ts.map