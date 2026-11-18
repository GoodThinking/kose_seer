import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { RegisterManager } from '../../../../Game/Register';
/**
 * [CMD: 2 REGISTER] 注册账号处理器
 */
export declare class RegisterHandler implements IHandler {
    private _registerManager;
    constructor(registerManager: RegisterManager);
    Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=RegisterHandler.d.ts.map