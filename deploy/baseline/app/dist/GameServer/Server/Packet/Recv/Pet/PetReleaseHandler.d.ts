import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 2304 PET_RELEASE] 精灵操作（放入仓库/取回背包）
 *
 * 请求格式：catchTime(4) + flag(4)
 * - flag=0: 将精灵放入仓库（从背包移到仓库）
 * - flag=1: 将精灵取回背包（从仓库移到背包，或确认获得新精灵）
 */
export declare class PetReleaseHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=PetReleaseHandler.d.ts.map