import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 2004 MAP_OGRE_LIST] 获取地图野怪列表
 *
 * 请求：无参数
 * 响应：9个槽位，每个槽位 8 bytes (petId + shiny)
 * 总共 72 bytes
 *
 * 注意：使用 MapSpawnManager 管理刷新状态，确保同一地图的野怪保持一致
 */
export declare class MapOgreListHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=MapOgreListHandler.d.ts.map