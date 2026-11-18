import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9027 NONO_IS_INFO] 查询是否有NoNo
 */
export declare class NoNoIsInfoHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoIsInfoHandler.d.ts.map