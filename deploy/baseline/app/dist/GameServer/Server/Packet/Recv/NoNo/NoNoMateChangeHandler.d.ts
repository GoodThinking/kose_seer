import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9022 NONO_MATE_CHANGE] NoNo 心情变化
 * 简单逻辑：空响应
 */
export declare class NoNoMateChangeHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoMateChangeHandler.d.ts.map