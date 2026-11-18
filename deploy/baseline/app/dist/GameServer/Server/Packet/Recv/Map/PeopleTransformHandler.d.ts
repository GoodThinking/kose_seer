import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * Player transform handler
 * CMD 1011
 */
export declare class PeopleTransformHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=PeopleTransformHandler.d.ts.map