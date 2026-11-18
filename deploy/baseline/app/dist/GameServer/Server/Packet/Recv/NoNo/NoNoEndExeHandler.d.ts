import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9018 NONO_END_EXE] NoNo 结束执行
 * 简单逻辑：空响应
 */
export declare class NoNoEndExeHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoEndExeHandler.d.ts.map