import { IBattlePet, IAttackResult, BattleStatus } from '../../../shared/models/BattleModel';
import { SimplePetInfoProto } from '../../../shared/proto/common/SimplePetInfoProto';
import { FightPetInfoProto } from '../../../shared/proto/common/FightPetInfoProto';
import { AttackValueProto } from '../../../shared/proto/common/AttackValueProto';
/**
 * 战斗数据转换器
 * 负责将战斗数据模型转换为 Proto
 */
export declare class BattleConverter {
    /**
     * 将 IBattlePet 转换为 SimplePetInfoProto
     * 用于 NOTE_READY_TO_FIGHT (2503)
     */
    static ToSimplePetInfo(pet: IBattlePet): SimplePetInfoProto;
    /**
     * 将 IBattlePet 转换为 FightPetInfoProto
     * 用于 NOTE_START_FIGHT (2504)
     */
    static ToFightPetInfo(pet: IBattlePet, userId: number, catchable: number): FightPetInfoProto;
    /**
     * 将 IAttackResult 转换为 AttackValueProto
     * 用于 NOTE_USE_SKILL (2505)
     */
    static ToAttackValue(attack: IAttackResult | undefined, defaultUserId: number, defaultHp: number, defaultMaxHp: number, defaultStatus: BattleStatus | undefined, defaultBattleLv: number[], petType: number, attackerPet?: IBattlePet): AttackValueProto;
    /**
     * 批量转换精灵列表为 SimplePetInfoProto 数组
     */
    static ToSimplePetInfoList(pets: IBattlePet[]): SimplePetInfoProto[];
}
//# sourceMappingURL=BattleConverter.d.ts.map