import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 2324 PET_ROOM_LIST] 获取精灵仓库列表处理器
 */
export declare class PetRoomListHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=PetRoomListHandler.d.ts.map