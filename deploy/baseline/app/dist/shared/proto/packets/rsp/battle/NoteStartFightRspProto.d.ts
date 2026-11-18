import { BaseProto } from '../../../base/BaseProto';
import { FightPetInfoProto } from '../../../common/FightPetInfoProto';
/**
 * [CMD: 2504 NOTE_START_FIGHT] 开始战斗通知响应
 * 发送战斗开始信息
 */
export declare class NoteStartFightRspProto extends BaseProto {
    isCanAuto: number;
    playerPet: FightPetInfoProto;
    enemyPet: FightPetInfoProto;
    constructor();
    serialize(): Buffer;
    setIsCanAuto(value: number): this;
    setPlayerPet(pet: FightPetInfoProto): this;
    setEnemyPet(pet: FightPetInfoProto): this;
}
//# sourceMappingURL=NoteStartFightRspProto.d.ts.map