import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9007 NONO_CURE] NoNo 治疗
 * 简单逻辑：恢复 NoNo 的体力和心情
 */
export declare class NoNoCureHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoCureHandler.d.ts.map