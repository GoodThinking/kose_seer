import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9014 NONO_CLOSE_OPEN] NoNo 开启/关闭
 * 简单逻辑：空响应
 */
export declare class NoNoCloseOpenHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoCloseOpenHandler.d.ts.map