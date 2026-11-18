import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { LoginManager } from '../../../../Game/Login/LoginManager';
/**
 * [CMD: LOGIN_IN (1001)] 游戏登录处理�?
 * 请求: session(16字节)
 * 响应: 完整玩家信息
 */
export declare class GameLoginHandler implements IHandler {
    private _loginManager;
    constructor(loginManager: LoginManager);
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=GameLoginHandler.d.ts.map