import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9021 NONO_HELP_EXP] NoNo 帮助经验
 * 简单逻辑：空响应
 */
export declare class NoNoHelpExpHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoHelpExpHandler.d.ts.map