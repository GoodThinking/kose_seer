import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * Aimat/interact handler
 * CMD 1010
 */
export declare class AimatHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=AimatHandler.d.ts.map