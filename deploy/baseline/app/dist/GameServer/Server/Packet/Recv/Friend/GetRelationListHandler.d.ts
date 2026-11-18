import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
/**
 * [CMD: 2150 GET_RELATION_LIST] 获取好友关系列表
 * 返回好友列表和黑名单
 */
export declare class GetRelationListHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=GetRelationListHandler.d.ts.map