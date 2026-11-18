import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9015 NONO_EXE_LIST] NoNo 执行列表
 * 简单逻辑：返回空列表
 */
export declare class NoNoExeListHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoExeListHandler.d.ts.map