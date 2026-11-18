import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 使用家具处理器（查看房间家具）
 * CMD 10006
 */
export declare class FitmentUseringHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=FitmentUseringHandler.d.ts.map