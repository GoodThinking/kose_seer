import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 房间登录处理器
 * CMD 10001
 *
 * 玩家进入房间时的登录验证
 * 注意：房间连接是新的TCP连接，需要通过session关联到已有的Player
 *
 * 客户端流程：
 * 1. 连接roomSocket → 发送ROOM_LOGIN
 * 2. 收到ROOM_LOGIN响应后，客户端代码中缺少发送ENTER_MAP的逻辑
 * 3. 因此服务端在ROOM_LOGIN成功后，自动触发ENTER_MAP处理
 */
export declare class RoomLoginHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=RoomLoginHandler.d.ts.map