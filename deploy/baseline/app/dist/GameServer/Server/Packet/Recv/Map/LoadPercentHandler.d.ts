import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 2441 LOAD_PERCENT] 客户端加载进度
 * 客户端定期发送加载进度，服务器返回对方（BOSS/其他玩家）的加载进度
 *
 * 场景：
 * 1. PVE战斗（打BOSS）：返回BOSS的加载进度（固定100%）
 * 2. PVP战斗（玩家对战）：广播玩家的加载进度给对方，并返回对方的加载进度
 */
export declare class LoadPercentHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=LoadPercentHandler.d.ts.map