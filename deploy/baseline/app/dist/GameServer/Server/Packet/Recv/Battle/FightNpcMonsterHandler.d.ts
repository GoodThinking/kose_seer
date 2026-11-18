import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 挑战野外精灵处理器
 * CMD 2408
 */
export declare class FightNpcMonsterHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=FightNpcMonsterHandler.d.ts.map