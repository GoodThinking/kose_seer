import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 2421 FIGHT_SPECIAL_PET] 挑战盖亚
 *
 * 盖亚挑战逻辑：
 * - 客户端发送 param2
 * - 如果未匹配到地图配置，回退到盖亚
 */
export declare class FightSpecialPetHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=FightSpecialPetHandler.d.ts.map