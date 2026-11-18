import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 地图玩家列表处理器
 * CMD 1003
 */
export declare class ListMapPlayerHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=ListMapPlayerHandler.d.ts.map