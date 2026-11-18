import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 2319 PET_GET_EXP] 获取精灵经验分配信息
 * 精灵分配仪功能 - 查询可分配的经验值
 */
export declare class PetGetExpHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=PetGetExpHandler.d.ts.map