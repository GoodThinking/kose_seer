import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 2328 Skill_Sort] 技能排序处理器
 *
 * 功能：调整精灵技能槽的顺序
 */
export declare class SkillSortHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=SkillSortHandler.d.ts.map