import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { SimplePetInfoProto } from '../../../../../shared/proto/common/SimplePetInfoProto';
/**
 * 准备战斗通知包
 * CMD 2503
 */
export declare class PacketNoteReadyToFight extends BaseProto {
    private _data;
    constructor(playerUserId: number, playerNick: string, playerPets: SimplePetInfoProto[], enemyUserId: number, enemyNick: string, enemyPets: SimplePetInfoProto[]);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketNoteReadyToFight.d.ts.map