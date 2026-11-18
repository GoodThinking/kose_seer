import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 更换服装处理器
 * CMD 2604
 *
 * 重构说明：
 * - 不再需要依赖注入 ItemManager
 * - 直接使用 player.ItemManager
 */
export declare class ChangeClothHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=ChangeClothHandler.d.ts.map