import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9023 NONO_GET_CHIP] 获取NoNo芯片
 */
export declare class NoNoGetChipHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoGetChipHandler.d.ts.map