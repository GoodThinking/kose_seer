import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 2404 READY_TO_FIGHT] 准备战斗
 */
export declare class ReadyToFightHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=ReadyToFightHandler.d.ts.map