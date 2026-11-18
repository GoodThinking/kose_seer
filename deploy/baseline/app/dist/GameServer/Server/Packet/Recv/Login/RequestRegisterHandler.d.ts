import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { RegisterManager } from '../../../../Game/Register';
/**
 * [CMD: 1003 REQUEST_REGISTER] 请求注册处理器
 * 预留接口，暂时返回成功响应
 */
export declare class RequestRegisterHandler implements IHandler {
    private _registerManager;
    constructor(registerManager: RegisterManager);
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=RequestRegisterHandler.d.ts.map