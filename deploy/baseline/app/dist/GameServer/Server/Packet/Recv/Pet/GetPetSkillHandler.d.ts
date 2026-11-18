import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 获取精灵技能处理器
 * CMD: 2336
 */
export declare class GetPetSkillHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=GetPetSkillHandler.d.ts.map