import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9004 NONO_CHIP_MIXTURE] NoNo芯片合成
 */
export declare class NoNoChipMixtureHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoChipMixtureHandler.d.ts.map