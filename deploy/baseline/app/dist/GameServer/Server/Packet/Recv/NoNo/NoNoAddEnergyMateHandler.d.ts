import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9024 NONO_ADD_ENERGY_MATE] 增加NoNo能量和心情
 */
export declare class NoNoAddEnergyMateHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoAddEnergyMateHandler.d.ts.map