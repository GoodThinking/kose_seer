import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9010 NONO_IMPLEMENT_TOOL] NoNo使用工具
 */
export declare class NoNoImplementToolHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoImplementToolHandler.d.ts.map