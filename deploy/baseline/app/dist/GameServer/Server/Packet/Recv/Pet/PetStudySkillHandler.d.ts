import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
/**
 * [CMD: 2307] 精灵学习技能（替换技能）
 */
export declare class PetStudySkillHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=PetStudySkillHandler.d.ts.map