import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9016 NONO_CHARGE] NoNo 充电
 * 简单逻辑：空响应
 */
export declare class NoNoChargeHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoChargeHandler.d.ts.map