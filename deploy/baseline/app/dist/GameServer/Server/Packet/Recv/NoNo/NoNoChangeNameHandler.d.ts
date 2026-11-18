import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9002 NONO_CHANGE_NAME] 修改NoNo昵称
 */
export declare class NoNoChangeNameHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoChangeNameHandler.d.ts.map