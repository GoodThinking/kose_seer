import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { ServerManager } from '../../../../Game/Server/ServerManager';
/**
 * [CMD: COMMEND_ONLINE (105)] 推荐服务器列表处理器
 * 请求:
 * 响应: maxOnlineID(4) + isVIP(4) + onlineCnt(4) + servers...
 */
export declare class CommendOnlineHandler implements IHandler {
    private _serverManager;
    constructor(serverManager: ServerManager);
    Handle(session: IClientSession, head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=CommendOnlineHandler.d.ts.map