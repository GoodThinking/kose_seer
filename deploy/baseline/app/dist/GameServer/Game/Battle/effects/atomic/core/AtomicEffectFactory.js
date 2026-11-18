"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atomicEffectFactory = exports.AtomicEffectFactory = void 0;
const IAtomicEffect_1 = require("./IAtomicEffect");
const ConditionalCheck_1 = require("./ConditionalCheck");
const DurationWrapper_1 = require("./DurationWrapper");
// --- modifier/ ---
const ModifierEffects_1 = require("../modifier/ModifierEffects");
// --- stat/ ---
const StatEffects_1 = require("../stat/StatEffects");
// --- status/ ---
const StatusEffects_1 = require("../status/StatusEffects");
// --- heal/ ---
const HealEffects_1 = require("../heal/HealEffects");
// --- damage/ ---
const DamageEffects_1 = require("../damage/DamageEffects");
// --- defensive/ ---
const DefensiveEffects_1 = require("../defensive/DefensiveEffects");
// --- special/ ---
const AuraAndMiscEffects_1 = require("../special/AuraAndMiscEffects");
const HpEffects_1 = require("../special/HpEffects");
const SacrificeEffects_1 = require("../special/SacrificeEffects");
const StatEffects_2 = require("../special/StatEffects");
const StatusEffects_2 = require("../special/StatusEffects");
const TypeEffects_1 = require("../special/TypeEffects");
const PowerCalcEffects_1 = require("../special/PowerCalcEffects");
const SkillMechanics_1 = require("../special/SkillMechanics");
const TriggerEffects_1 = require("../special/TriggerEffects");
const OnHitMultiStatChangeEffect_1 = require("../special/OnHitMultiStatChangeEffect");
// --- root ---
const DamageFloor_1 = require("../DamageFloor");
const FixedDamageReduction_1 = require("../FixedDamageReduction");
const KoHeal_1 = require("../KoHeal");
const DamageCap_1 = require("../DamageCap");
const StatDownImmunityPassive_1 = require("../passive/StatDownImmunityPassive");
const StatusImmunityPassive_1 = require("../passive/StatusImmunityPassive");
const DamageReductionPassive_1 = require("../passive/DamageReductionPassive");
const SameTypeAbsorbPassive_1 = require("../passive/SameTypeAbsorbPassive");
const TypeImmunityPassive_1 = require("../passive/TypeImmunityPassive");
const StatusInflictPassives_1 = require("../passive/StatusInflictPassives");
const AccuracyPassives_1 = require("../passive/AccuracyPassives");
const CritPassives_1 = require("../passive/CritPassives");
const BurstRecoverPassives_1 = require("../passive/BurstRecoverPassives");
const InfinitePPPassive_1 = require("../passive/InfinitePPPassive");
const DamageReflectPassives_1 = require("../passive/DamageReflectPassives");
const OnHitStatChangePassives_1 = require("../passive/OnHitStatChangePassives");
const EscapePassive_1 = require("../passive/EscapePassive");
const CounterPassives_1 = require("../passive/CounterPassives");
const HpStatBindPassive_1 = require("../passive/HpStatBindPassive");
const ShieldPassives_1 = require("../passive/ShieldPassives");
const SurvivePassives_1 = require("../passive/SurvivePassives");
const ReceivedDamageMultiplyPassive_1 = require("../passive/ReceivedDamageMultiplyPassive");
const LowHpOhkoPriorityPassive_1 = require("../passive/LowHpOhkoPriorityPassive");
const RevivePassives_1 = require("../passive/RevivePassives");
const FlatStatBonusPassive_1 = require("../passive/FlatStatBonusPassive");
const TypeDamageBonusPassive_1 = require("../passive/TypeDamageBonusPassive");
const DamageModifyPassives_1 = require("../passive/DamageModifyPassives");
const TurnHealPassives_1 = require("../passive/TurnHealPassives");
const PriorityPassives_1 = require("../passive/PriorityPassives");
const AttackTypeImmunePassive_1 = require("../passive/AttackTypeImmunePassive");
const PostHitDamageReductionPassive_1 = require("../passive/PostHitDamageReductionPassive");
const EffectImmunityPassives_1 = require("../passive/EffectImmunityPassives");
const RotatingAttackImmunityPassive_1 = require("../passive/RotatingAttackImmunityPassive");
const TimedOhkoPassive_1 = require("../passive/TimedOhkoPassive");
const BossRagePassive_1 = require("../passive/BossRagePassive");
const BossPossessionPassive_1 = require("../passive/BossPossessionPassive");
const SpecificTypeAbsorbPassive_1 = require("../passive/SpecificTypeAbsorbPassive");
const GenderDamageBonusPassive_1 = require("../passive/GenderDamageBonusPassive");
const CopyEnemyBuffPassive_1 = require("../passive/CopyEnemyBuffPassive");
const OnHitPassives_1 = require("../passive/OnHitPassives");
const HighDamageCounterKillPassive_1 = require("../passive/HighDamageCounterKillPassive");
const DodgeHealPassive_1 = require("../passive/DodgeHealPassive");
const LowHpFullHealChancePassive_1 = require("../passive/LowHpFullHealChancePassive");
const TypeOhkoPassive_1 = require("../passive/TypeOhkoPassive");
const ClearEnemyTurnEffectsPassive_1 = require("../passive/ClearEnemyTurnEffectsPassive");
const Logger_1 = require("../../../../../../shared/utils/Logger");
/**
 * specialType → 效果类注册表
 * 新增效果只需在此添加一行映射
 */
const SPECIAL_REGISTRY = new Map([
    // 基础特殊效果
    ['stat_clear', StatEffects_1.StatClear],
    ['regeneration', HealEffects_1.Regeneration],
    ['continuous_damage', DamageEffects_1.ContinuousDamage],
    ['multi_hit', DamageEffects_1.MultiHit],
    ['random_power', DamageEffects_1.RandomPower],
    ['consecutive_use', SkillMechanics_1.ConsecutiveUse],
    ['leech_seed', DamageEffects_1.LeechSeed],
    ['counter', DefensiveEffects_1.Counter],
    ['focus_energy', ModifierEffects_1.FocusEnergy],
    ['damage_shield', DefensiveEffects_1.DamageShield],
    ['disable_skill', StatusEffects_1.DisableSkill],
    ['endure', DefensiveEffects_1.Endure],
    ['random_status', StatusEffects_1.RandomStatus],
    ['sure_hit', ModifierEffects_1.SureHit],
    ['on_hit_stat_boost', StatEffects_1.OnHitStatBoost],
    ['on_hit_multi_stat_change', OnHitMultiStatChangeEffect_1.OnHitMultiStatChangeEffect],
    ['charge', SkillMechanics_1.Charge],
    ['pp_drain', SkillMechanics_1.PPDrain],
    ['type_swap', TypeEffects_1.TypeSwap],
    ['type_copy', TypeEffects_1.TypeCopy],
    ['on_hit_status', StatusEffects_1.OnHitStatus],
    ['on_damage_status', StatusEffects_1.OnDamageStatus],
    ['punishment', PowerCalcEffects_1.Punishment],
    ['stat_sync', StatEffects_1.StatSync],
    ['drain_aura', AuraAndMiscEffects_1.DrainAura],
    ['random_stat_change', StatEffects_1.RandomStatChange],
    ['max_hp_modifier', HpEffects_1.MaxHpModifier],
    ['damage_boost', ModifierEffects_1.DamageBoost],
    ['damage_reduction', ModifierEffects_1.DamageReduction],
    ['sacrifice', SacrificeEffects_1.Sacrifice],
    ['delayed_kill', TriggerEffects_1.DelayedKill],
    ['stat_transfer', StatEffects_1.StatTransfer],
    ['type_power_boost', ModifierEffects_1.TypePowerBoost],
    ['ko_damage_next', TriggerEffects_1.KoDamageNext],
    ['heal_reversal', HealEffects_1.HealReversal],
    ['stat_steal', StatEffects_1.StatSteal],
    ['sacrifice_crit', SacrificeEffects_1.SacrificeCrit],
    ['miss_penalty', TriggerEffects_1.MissPenalty],
    ['category_evasion', ModifierEffects_1.CategoryEvasion],
    ['hp_cost', HpEffects_1.HpCost],
    ['hp_cost_damage', DamageEffects_1.HpCostDamage],
    ['pp_restore', SkillMechanics_1.PPRestore],
    ['status_sync', StatusEffects_1.StatusSync],
    ['gender_damage_boost', ModifierEffects_1.GenderDamageBoost],
    ['reversal', PowerCalcEffects_1.Reversal],
    ['weaken', AuraAndMiscEffects_1.WeakenEffect],
    ['priority_boost', ModifierEffects_1.PriorityBoost],
    ['recoil', PowerCalcEffects_1.Recoil],
    ['absorb', HpEffects_1.Absorb],
    ['encore', SkillMechanics_1.Encore],
    ['mercy', HpEffects_1.Mercy],
    ['hp_equal', HpEffects_1.HpEqual],
    ['transform', AuraAndMiscEffects_1.Transform],
    ['substitute', AuraAndMiscEffects_1.Substitute],
    ['damage_floor', DamageFloor_1.DamageFloor],
    ['fixed_damage_reduction', FixedDamageReduction_1.FixedDamageReduction],
    ['ko_heal', KoHeal_1.KoHeal],
    ['damage_cap', DamageCap_1.DamageCap],
    ['cumulative_status', StatusEffects_2.CumulativeStatus],
    ['cumulative_crit_boost', StatEffects_2.CumulativeCritBoost],
    ['continuous_stat_boost', StatEffects_2.ContinuousStatBoost],
    ['continuous_multi_stat_boost', StatEffects_2.ContinuousMultiStatBoost],
    ['level_damage', PowerCalcEffects_1.LevelDamage],
    ['damage_to_hp', HpEffects_1.DamageToHp],
    ['stat_boost_reversal', StatEffects_2.StatBoostReversal],
    ['clear_turn_effects', AuraAndMiscEffects_1.ClearTurnEffects],
    ['ignore_defense_buff', StatEffects_2.IgnoreDefenseBuff],
    ['ko_transfer_buff', TriggerEffects_1.KoTransferBuff],
    ['conditional_drain_aura', AuraAndMiscEffects_1.ConditionalDrainAura],
    ['conditional_status_aura', StatusEffects_2.ConditionalStatusAura],
    ['conditional_continuous_damage', AuraAndMiscEffects_1.ConditionalContinuousDamage],
    ['type_skill_nullify', TypeEffects_1.TypeSkillNullify],
    ['on_hit_conditional_status', StatusEffects_2.OnHitConditionalStatus],
    ['sacrifice_damage', SacrificeEffects_1.SacrificeDamage],
    ['random_hp_loss', HpEffects_1.RandomHpLoss],
    ['selective_heal', HpEffects_1.SelectiveHeal],
    ['delayed_full_heal', HpEffects_1.DelayedFullHeal],
    ['iv_power', PowerCalcEffects_1.IvPower],
    ['on_evade_boost', TriggerEffects_1.OnEvadeBoost],
    ['weighted_random_power', PowerCalcEffects_1.WeightedRandomPower],
    ['flammable', StatusEffects_2.Flammable],
    ['battle_reward', AuraAndMiscEffects_1.BattleReward],
    ['continuous_stat_change', StatEffects_2.ContinuousStatChange],
    ['type_skill_counter', AuraAndMiscEffects_1.TypeSkillCounter],
    ['stat_boost_nullify', StatEffects_2.StatBoostNullify],
    ['on_opponent_miss', TriggerEffects_1.OnOpponentMiss],
    ['random_status', StatusEffects_2.RandomStatusEffect],
    // BOSS被动特性
    ['damage_reduction_passive', DamageReductionPassive_1.DamageReductionPassive],
    ['same_type_absorb', SameTypeAbsorbPassive_1.SameTypeAbsorbPassive],
    ['type_immunity', TypeImmunityPassive_1.TypeImmunityPassive],
    ['on_hit_status_inflict', StatusInflictPassives_1.OnHitStatusInflictPassive],
    ['phys_hit_status_inflict', StatusInflictPassives_1.PhysHitStatusInflictPassive],
    ['sp_hit_status_inflict', StatusInflictPassives_1.SpHitStatusInflictPassive],
    ['on_sp_hit_status_inflict', StatusInflictPassives_1.OnSpHitStatusInflictPassive],
    ['accuracy_reduction_passive', AccuracyPassives_1.AccuracyReductionPassive],
    ['skill_dodge', AccuracyPassives_1.SkillDodgePassive],
    ['accuracy_bonus', AccuracyPassives_1.AccuracyBonusPassive],
    ['fixed_crit_rate', CritPassives_1.FixedCritRatePassive],
    ['crit_rate_bonus', CritPassives_1.CritRateBonusPassive],
    ['fixed_crit_divisor', CritPassives_1.FixedCritDivisorPassive],
    ['status_crit_bonus', CritPassives_1.StatusCritBonusPassive],
    ['crit_rate_reduce', CritPassives_1.CritRateReducePassive],
    ['burst_recover_full_hp', BurstRecoverPassives_1.BurstRecoverFullHpPassive],
    ['burst_recover_full_hp_pp', BurstRecoverPassives_1.BurstRecoverFullHpPpPassive],
    ['infinite_pp', InfinitePPPassive_1.InfinitePPPassive],
    ['damage_reflect_fraction', DamageReflectPassives_1.DamageReflectFractionPassive],
    ['high_damage_reflect', DamageReflectPassives_1.HighDamageReflectPassive],
    ['on_sp_hit_stat_up', OnHitStatChangePassives_1.OnSpHitStatUpPassive],
    ['on_sp_hit_enemy_stat_down', OnHitStatChangePassives_1.OnSpHitEnemyStatDownPassive],
    ['on_hit_self_stat_up', OnHitStatChangePassives_1.OnHitSelfStatUpPassive],
    ['timed_escape', EscapePassive_1.EscapePassive],
    ['counter_fear', CounterPassives_1.CounterFearPassive],
    ['counter_damage_reduce', CounterPassives_1.CounterDamageReducePassive],
    ['counter_priority_reduce', CounterPassives_1.CounterPriorityReducePassive],
    ['hp_stat_bind', HpStatBindPassive_1.HpStatBindPassive],
    ['skill_unlock_shield', ShieldPassives_1.SkillUnlockShieldPassive],
    ['type_sequence_shield', ShieldPassives_1.TypeSequenceShieldPassive],
    ['rotating_type_shield', ShieldPassives_1.RotatingTypeShieldPassive],
    ['survive_with_1hp_unless_skill', SurvivePassives_1.SurviveWith1HpPassive],
    ['survive_lethal_chance', SurvivePassives_1.SurviveLethalChancePassive],
    ['five_turn_immortal', SurvivePassives_1.FiveTurnImmortalPassive],
    ['received_damage_multiply', ReceivedDamageMultiplyPassive_1.ReceivedDamageMultiplyPassive],
    ['low_hp_ohko_priority', LowHpOhkoPriorityPassive_1.LowHpOhkoPriorityPassive],
    ['revive_on_death', RevivePassives_1.ReviveOnDeathPassive],
    ['revive_full', RevivePassives_1.ReviveFullPassive],
    ['flat_stat_bonus', FlatStatBonusPassive_1.FlatStatBonusPassive],
    ['type_damage_bonus', TypeDamageBonusPassive_1.TypeDamageBonusPassive],
    ['damage_bonus_percent', DamageModifyPassives_1.DamageBonusPercentPassive],
    ['even_damage_multiply', DamageModifyPassives_1.EvenDamageMultiplyPassive],
    ['odd_damage_divide', DamageModifyPassives_1.OddDamageDividePassive],
    ['both_damage_reduce', DamageModifyPassives_1.BothDamageReducePassive],
    ['both_damage_multiply', DamageModifyPassives_1.BothDamageMultiplyPassive],
    ['chance_damage_flat_reduce', DamageModifyPassives_1.ChanceDamageFlatReducePassive],
    ['chance_full_block', DamageModifyPassives_1.ChanceFullBlockPassive],
    ['phys_chance_damage_bonus', DamageModifyPassives_1.PhysChanceDamageBonusPassive],
    ['sp_chance_damage_bonus', DamageModifyPassives_1.SpChanceDamageBonusPassive],
    ['attack_type_damage_bonus', DamageModifyPassives_1.AttackTypeDamageBonusPassive],
    ['self_damage_reduce', DamageModifyPassives_1.SelfDamageReducePassive],
    ['turn_end_heal', TurnHealPassives_1.TurnEndHealPassive],
    ['both_turn_heal_percent', TurnHealPassives_1.BothTurnHealPercentPassive],
    ['both_turn_damage', TurnHealPassives_1.BothTurnDamagePassive],
    ['turn_drain', TurnHealPassives_1.TurnDrainPassive],
    ['asymmetric_turn_heal', TurnHealPassives_1.AsymmetricTurnHealPassive],
    ['turn_enemy_damage', TurnHealPassives_1.TurnEnemyDamagePassive],
    ['priority_change', PriorityPassives_1.PriorityChangePassive],
    ['low_hp_priority', PriorityPassives_1.LowHpPriorityPassive],
    ['high_damage_next_priority', PriorityPassives_1.HighDamageNextPriorityPassive],
    ['attack_type_immune', AttackTypeImmunePassive_1.AttackTypeImmunePassive],
    ['post_hit_damage_reduction', PostHitDamageReductionPassive_1.PostHitDamageReductionPassive],
    ['effect_immunity', EffectImmunityPassives_1.EffectImmunityPassive],
    ['skill_effect_immunity', EffectImmunityPassives_1.SkillEffectImmunityPassive],
    ['rotating_attack_immunity', RotatingAttackImmunityPassive_1.RotatingAttackImmunityPassive],
    ['timed_ohko', TimedOhkoPassive_1.TimedOhkoPassive],
    ['boss_rage', BossRagePassive_1.BossRagePassive],
    ['boss_possession', BossPossessionPassive_1.BossPossessionPassive],
    ['specific_type_absorb', SpecificTypeAbsorbPassive_1.SpecificTypeAbsorbPassive],
    ['gender_damage_bonus', GenderDamageBonusPassive_1.GenderDamageBonusPassive],
    ['copy_enemy_buff', CopyEnemyBuffPassive_1.CopyEnemyBuffPassive],
    ['low_damage_heal', OnHitPassives_1.LowDamageHealPassive],
    ['damage_lifesteal', OnHitPassives_1.DamageLifestealPassive],
    ['hit_stack_weakness', OnHitPassives_1.HitStackWeaknessPassive],
    ['high_damage_next_double', OnHitPassives_1.HighDamageNextDoublePassive],
    ['high_damage_heal', OnHitPassives_1.HighDamageHealPassive],
    ['low_hp_guardian', OnHitPassives_1.LowHpGuardianPassive],
    ['high_damage_counter_kill', HighDamageCounterKillPassive_1.HighDamageCounterKillPassive],
    ['dodge_heal', DodgeHealPassive_1.DodgeHealPassive],
    ['low_hp_full_heal_chance', LowHpFullHealChancePassive_1.LowHpFullHealChancePassive],
    ['type_ohko', TypeOhkoPassive_1.TypeOhkoPassive],
    ['clear_enemy_turn_effects', ClearEnemyTurnEffectsPassive_1.ClearEnemyTurnEffectsPassive],
]);
/**
 * immuneType → 被动免疫效果注册表
 */
const IMMUNE_PASSIVE_REGISTRY = new Map([
    ['stat_down', StatDownImmunityPassive_1.StatDownImmunityPassive],
    ['status', StatusImmunityPassive_1.StatusImmunityPassive],
]);
/**
 * 原子效果工厂
 * 根据参数创建原子效果实例
 *
 * 使用注册表模式替代 if-else 链：
 * - 新增效果只需在 SPECIAL_REGISTRY 中添加一行
 * - O(1) 查找替代 O(n) 遍历
 */
class AtomicEffectFactory {
    static instance;
    constructor() { }
    static getInstance() {
        if (!AtomicEffectFactory.instance) {
            AtomicEffectFactory.instance = new AtomicEffectFactory();
        }
        return AtomicEffectFactory.instance;
    }
    create(params) {
        try {
            switch (params.type) {
                case IAtomicEffect_1.AtomicEffectType.CONDITIONAL:
                    return new ConditionalCheck_1.ConditionalCheck(params);
                case IAtomicEffect_1.AtomicEffectType.DAMAGE_MODIFIER:
                    return new ModifierEffects_1.DamageModifier(params);
                case IAtomicEffect_1.AtomicEffectType.POWER_MODIFIER:
                    return new ModifierEffects_1.PowerModifier(params);
                case IAtomicEffect_1.AtomicEffectType.PRIORITY_MODIFIER:
                    return new ModifierEffects_1.PriorityModifier(params);
                case IAtomicEffect_1.AtomicEffectType.STAT_MODIFIER:
                    return new StatEffects_1.StatModifier(params);
                case IAtomicEffect_1.AtomicEffectType.STATUS_INFLICTOR:
                    return new StatusEffects_1.StatusInflictor(params);
                case IAtomicEffect_1.AtomicEffectType.HEAL:
                    return new HealEffects_1.HealEffect(params);
                case IAtomicEffect_1.AtomicEffectType.ACCURACY_MODIFIER:
                    return new ModifierEffects_1.AccuracyModifier(params);
                case IAtomicEffect_1.AtomicEffectType.CRIT_MODIFIER:
                    return new ModifierEffects_1.CritModifier(params);
                case IAtomicEffect_1.AtomicEffectType.FIXED_DAMAGE:
                    return new DamageEffects_1.FixedDamageEffect(params);
                case IAtomicEffect_1.AtomicEffectType.REFLECT:
                    return new DefensiveEffects_1.ReflectEffect(params);
                case IAtomicEffect_1.AtomicEffectType.IMMUNE: {
                    const immuneType = params.immuneType;
                    const PassiveClass = immuneType ? IMMUNE_PASSIVE_REGISTRY.get(immuneType) : undefined;
                    if (PassiveClass)
                        return new PassiveClass();
                    return new DefensiveEffects_1.ImmuneEffect(params);
                }
                case IAtomicEffect_1.AtomicEffectType.SPECIAL: {
                    const specialType = params.specialType;
                    const SpecialClass = specialType ? SPECIAL_REGISTRY.get(specialType) : undefined;
                    if (SpecialClass)
                        return new SpecialClass(params);
                    return new AuraAndMiscEffects_1.SpecialEffect(params);
                }
                case IAtomicEffect_1.AtomicEffectType.DURATION: {
                    const wrapper = new DurationWrapper_1.DurationWrapper(params);
                    if (params.effect) {
                        const wrappedEffect = this.create(params.effect);
                        if (wrappedEffect)
                            wrapper.setWrappedEffect(wrappedEffect);
                    }
                    return wrapper;
                }
                default:
                    Logger_1.Logger.Error(`未知的原子效果类型: ${params.type}`, new Error());
                    return null;
            }
        }
        catch (error) {
            Logger_1.Logger.Error(`创建原子效果失败: ${params.type}`, error);
            return null;
        }
    }
    createBatch(paramsList) {
        const atoms = [];
        for (const params of paramsList) {
            const atom = this.create(params);
            if (atom)
                atoms.push(atom);
        }
        return atoms;
    }
}
exports.AtomicEffectFactory = AtomicEffectFactory;
exports.atomicEffectFactory = AtomicEffectFactory.getInstance();
//# sourceMappingURL=AtomicEffectFactory.js.map