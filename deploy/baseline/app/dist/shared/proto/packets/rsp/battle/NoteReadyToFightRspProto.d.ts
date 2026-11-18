import { BaseProto } from '../../../base/BaseProto';
import { SimplePetInfoProto } from '../../../common/SimplePetInfoProto';
/**
 * [CMD: 2503 NOTE_READY_TO_FIGHT] 准备战斗通知响应
 * 发送双方的精灵信息
 */
export declare class NoteReadyToFightRspProto extends BaseProto {
    playerUserId: number;
    playerNick: string;
    playerPets: SimplePetInfoProto[];
    enemyUserId: number;
    enemyNick: string;
    enemyPets: SimplePetInfoProto[];
    constructor();
    serialize(): Buffer;
    setPlayerInfo(userId: number, nick: string, pets: SimplePetInfoProto[]): this;
    setEnemyInfo(userId: number, nick: string, pets: SimplePetInfoProto[]): this;
}
//# sourceMappingURL=NoteReadyToFightRspProto.d.ts.map