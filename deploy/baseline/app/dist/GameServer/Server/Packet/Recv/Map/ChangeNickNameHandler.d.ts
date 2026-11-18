import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 修改昵称处理器
 * CMD 1007
 */
export declare class ChangeNickNameHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=ChangeNickNameHandler.d.ts.map