import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 2318 PET_SET_EXP] 设置精灵经验分配
 * 精灵分配仪功能 - 将经验分配给指定精灵
 */
export declare class PetSetExpHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=PetSetExpHandler.d.ts.map