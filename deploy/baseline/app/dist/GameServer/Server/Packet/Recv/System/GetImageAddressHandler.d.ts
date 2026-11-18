import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 1005 GET_IMAGE_ADDRESS] 获取图片服务器地址
 * 简单逻辑，直接在 Handler 中处理
 */
export declare class GetImageAddressHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=GetImageAddressHandler.d.ts.map