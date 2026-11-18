import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 2314 PET_EVOLVTION] 精灵进化
 *
 * 请求: catchTime(4) + evolveIndex(4)
 * 响应: status(4)
 */
export declare class PetEvolutionHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=PetEvolutionHandler.d.ts.map