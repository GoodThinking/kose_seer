import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { FightPetInfoProto } from '../../../../../shared/proto/common/FightPetInfoProto';
/**
 * 开始战斗通知包
 * CMD 2504
 */
export declare class PacketNoteStartFight extends BaseProto {
    private _data;
    constructor(isCanAuto: number, playerPet: FightPetInfoProto, enemyPet: FightPetInfoProto);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketNoteStartFight.d.ts.map