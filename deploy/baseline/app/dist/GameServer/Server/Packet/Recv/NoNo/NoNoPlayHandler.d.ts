import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9013 NONO_PLAY] NoNo 玩耍
 * 简单逻辑：增加 NoNo 的心情值
 */
export declare class NoNoPlayHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoPlayHandler.d.ts.map