import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { RegisterManager } from '../../../../Game/Register';
/**
 * [CMD: 3 SEND_EMAIL_CODE] 发送邮箱验证码处理器
 */
export declare class SendEmailCodeHandler implements IHandler {
    private _registerManager;
    constructor(registerManager: RegisterManager);
    Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=SendEmailCodeHandler.d.ts.map