import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 获取房间地址处理器
 * CMD 10002
 *
 * 返回房间服务器的连接信息（session、IP、端口）
 * 注意：当前服务端未实现独立的房间服务器，返回主服务器信息
 */
export declare class GetRoomAddressHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=GetRoomAddressHandler.d.ts.map