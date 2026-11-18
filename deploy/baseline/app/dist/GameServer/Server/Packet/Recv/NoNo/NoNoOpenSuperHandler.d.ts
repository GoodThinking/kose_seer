import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9020 NONO_OPEN_SUPER] 开启超级 NoNo
 * 简单逻辑：空响应
 */
export declare class NoNoOpenSuperHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoOpenSuperHandler.d.ts.map