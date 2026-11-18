import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9008 NONO_EXPADM] NoNo经验管理
 */
export declare class NoNoExpadmHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoExpadmHandler.d.ts.map