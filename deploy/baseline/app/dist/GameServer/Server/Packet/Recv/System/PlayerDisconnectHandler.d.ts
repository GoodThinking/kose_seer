import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 10004 PLAYER_DISCONNECT] 玩家断开连接处理器（内部命令）
 * 由 Gateway 在检测到客户端断开连接时调用
 */
export declare class PlayerDisconnectHandler implements IHandler {
    Handle(_session: IClientSession, head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=PlayerDisconnectHandler.d.ts.map