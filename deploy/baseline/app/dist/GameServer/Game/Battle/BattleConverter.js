"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BattleConverter = void 0;
const BattleModel_1 = require("../../../shared/models/BattleModel");
const SimplePetInfoProto_1 = require("../../../shared/proto/common/SimplePetInfoProto");
const FightPetInfoProto_1 = require("../../../shared/proto/common/FightPetInfoProto");
const AttackValueProto_1 = require("../../../shared/proto/common/AttackValueProto");
/**
 * 战斗数据转换器
 * 负责将战斗数据模型转换为 Proto
 */
class BattleConverter {
    /**
     * 将 IBattlePet 转换为 SimplePetInfoProto
     * 用于 NOTE_READY_TO_FIGHT (2503)
     */
    static ToSimplePetInfo(pet) {
        // 获取技能PP（从skillPP数组或默认20）
        const skillsWithPP = pet.skills.map((id, index) => ({
            id,
            pp: pet.skillPP && pet.skillPP[index] !== undefined ? pet.skillPP[index] : 20
        }));
        return new SimplePetInfoProto_1.SimplePetInfoProto()
            .setPetId(pet.id)
            .setLevel(pet.level)
            .setHP(pet.hp, pet.maxHp)
            .setSkills(skillsWithPP)
            .setCatchTime(pet.catchTime)
            .setCatchMap(301) // 默认地图301
            .setCatchLevel(pet.level) // 捕获等级（简化为当前等级）
            .setSkinID(pet.skinID || 0); // 使用实际皮肤ID
    }
    /**
     * 将 IBattlePet 转换为 FightPetInfoProto
     * 用于 NOTE_START_FIGHT (2504)
     */
    static ToFightPetInfo(pet, userId, catchable) {
        return new FightPetInfoProto_1.FightPetInfoProto()
            .setUserID(userId)
            .setPetID(pet.id)
            .setPetName(pet.name)
            .setCatchTime(pet.catchTime)
            .setHP(pet.hp, pet.maxHp)
            .setLevel(pet.level)
            .setCatchable(catchable)
            .setBattleLv(pet.battleLv);
    }
    /**
     * 将 IAttackResult 转换为 AttackValueProto
     * 用于 NOTE_USE_SKILL (2505)
     */
    static ToAttackValue(attack, defaultUserId, defaultHp, defaultMaxHp, defaultStatus, defaultBattleLv, petType, attackerPet // 新增：攻击者精灵信息（用于填充skillList）
    ) {
        const proto = new AttackValueProto_1.AttackValueProto();
        if (attack) {
            // 构建技能列表（如果有攻击者信息）
            const skillList = [];
            if (attackerPet) {
                for (let i = 0; i < attackerPet.skills.length; i++) {
                    skillList.push({
                        id: attackerPet.skills[i],
                        pp: attackerPet.skillPP && attackerPet.skillPP[i] !== undefined ? attackerPet.skillPP[i] : 20
                    });
                }
            }
            proto
                .setUserId(attack.userId)
                .setSkillId(attack.skillId)
                .setAtkTimes(attack.atkTimes)
                .setDamage(attack.damage)
                .setGainHP(attack.gainHp) // 攻击者获得的HP（吸血等）
                .setRemainHp(attack.attackerRemainHp) // 攻击者的剩余HP（客户端用于更新攻击者HP条）
                .setMaxHp(attack.attackerMaxHp) // 攻击者的最大HP
                .setState(attack.missed || attack.blocked ? 1 : 0)
                .setSkillList(skillList) // 填充技能列表
                .setIsCrit(attack.isCrit ? 1 : 0)
                .setStatus(attack.attackerStatus)
                .setBattleLv(attack.attackerBattleLv)
                .setPetType(petType);
        }
        else {
            // 空攻击占位符
            // 将单个状态转换为状态数组
            const statusArray = new Array(20).fill(0);
            if (defaultStatus !== undefined && defaultStatus !== BattleModel_1.BattleStatus.NONE) {
                statusArray[defaultStatus] = 1;
            }
            proto
                .setUserId(defaultUserId)
                .setSkillId(0)
                .setAtkTimes(0)
                .setDamage(0)
                .setGainHP(0)
                .setRemainHp(defaultHp)
                .setMaxHp(defaultMaxHp)
                .setState(0)
                .setIsCrit(0)
                .setStatus(statusArray)
                .setBattleLv(defaultBattleLv)
                .setPetType(petType);
        }
        return proto;
    }
    /**
     * 批量转换精灵列表为 SimplePetInfoProto 数组
     */
    static ToSimplePetInfoList(pets) {
        return pets.map(pet => this.ToSimplePetInfo(pet));
    }
}
exports.BattleConverter = BattleConverter;
//# sourceMappingURL=BattleConverter.js.map