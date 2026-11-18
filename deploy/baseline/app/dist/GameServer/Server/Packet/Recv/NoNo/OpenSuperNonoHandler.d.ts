import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 开启超级NoNo处理器
 * CMD 80001
 *
 * 请求格式: 无参数
 * 响应格式: success (uint32)
 */
export declare class OpenSuperNonoHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=OpenSuperNonoHandler.d.ts.map