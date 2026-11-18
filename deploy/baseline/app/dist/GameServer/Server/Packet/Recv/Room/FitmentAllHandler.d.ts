import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 获取所有家具处理器（仓库家具列表）
 * CMD 10007
 */
export declare class FitmentAllHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=FitmentAllHandler.d.ts.map