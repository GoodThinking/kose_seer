import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 2409 CATCH_MONSTER] 捕捉精灵
 */
export declare class CatchMonsterHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=CatchMonsterHandler.d.ts.map