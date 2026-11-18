import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9012 NONO_CHANGE_COLOR] 修改NoNo颜色
 */
export declare class NoNoChangeColorHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoChangeColorHandler.d.ts.map