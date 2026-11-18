import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 2411 CHALLENGE_BOSS] 挑战BOSS
 *
 * 客户端发送param2，服务器结合玩家当前地图ID查找BOSS
 * 逻辑与 go-server handleChallengeBoss 保持一致
 */
export declare class ChallengeBossHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=ChallengeBossHandler.d.ts.map