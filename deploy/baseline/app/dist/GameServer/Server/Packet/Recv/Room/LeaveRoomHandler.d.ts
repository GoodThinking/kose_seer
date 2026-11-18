import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 离开房间处理器
 * CMD 10003
 *
 * 玩家从房间地图离开，返回普通地图
 *
 * 客户端流程：
 * 1. 通过mainSocket发送LEAVE_ROOM
 * 2. 收到LEAVE_ROOM响应后，关闭roomSocket
 * 3. 客户端期望自动进入目标地图，但代码中缺少发送ENTER_MAP的逻辑
 * 4. 因此服务端在LEAVE_ROOM成功后，自动触发ENTER_MAP处理
 */
export declare class LeaveRoomHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=LeaveRoomHandler.d.ts.map