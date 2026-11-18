import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { ServerManager } from '../../../../Game/Server/ServerManager';
/**
 * [CMD: RANGE_ONLINE (106)] 范围服务器查询处理器
 * 请求: (�?
 * 响应: onlineCnt(4) + servers...
 */
export declare class RangeOnlineHandler implements IHandler {
    private _serverManager;
    constructor(serverManager: ServerManager);
    Handle(session: IClientSession, head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=RangeOnlineHandler.d.ts.map