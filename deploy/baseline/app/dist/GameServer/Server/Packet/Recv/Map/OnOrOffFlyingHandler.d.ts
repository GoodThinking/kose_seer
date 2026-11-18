import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 开关飞行模式处理器
 * CMD 1012
 */
export declare class OnOrOffFlyingHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=OnOrOffFlyingHandler.d.ts.map