import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9003 NONO_INFO] 获取 NoNo 信息
 * 复杂逻辑：需要从数据库读取 NoNo 数据
 */
export declare class NoNoInfoHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoInfoHandler.d.ts.map