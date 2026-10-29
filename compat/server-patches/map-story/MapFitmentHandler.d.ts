import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
export declare class MapFitmentHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
