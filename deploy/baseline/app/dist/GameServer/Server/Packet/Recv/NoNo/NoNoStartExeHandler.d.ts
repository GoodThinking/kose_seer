import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9017 NONO_START_EXE] NoNo 开始执行
 * 简单逻辑：空响应
 */
export declare class NoNoStartExeHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoStartExeHandler.d.ts.map