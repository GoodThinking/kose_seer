import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 2301 GET_PET_INFO] 获取精灵信息
 */
export declare class GetPetInfoHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=GetPetInfoHandler.d.ts.map