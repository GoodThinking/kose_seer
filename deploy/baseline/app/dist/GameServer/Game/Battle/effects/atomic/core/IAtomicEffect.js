"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionType = exports.AtomicEffectType = void 0;
/**
 * 原子效果类型枚举
 */
var AtomicEffectType;
(function (AtomicEffectType) {
    AtomicEffectType["CONDITIONAL"] = "conditional";
    AtomicEffectType["DAMAGE_MODIFIER"] = "damage_modifier";
    AtomicEffectType["POWER_MODIFIER"] = "power_modifier";
    AtomicEffectType["PRIORITY_MODIFIER"] = "priority_modifier";
    AtomicEffectType["STAT_MODIFIER"] = "stat_modifier";
    AtomicEffectType["STATUS_INFLICTOR"] = "status_inflictor";
    AtomicEffectType["HEAL"] = "heal";
    AtomicEffectType["ACCURACY_MODIFIER"] = "accuracy_modifier";
    AtomicEffectType["CRIT_MODIFIER"] = "crit_modifier";
    AtomicEffectType["IMMUNE"] = "immune";
    AtomicEffectType["DURATION"] = "duration";
    AtomicEffectType["TRIGGER"] = "trigger";
    AtomicEffectType["FIXED_DAMAGE"] = "fixed_damage";
    AtomicEffectType["REFLECT"] = "reflect";
    AtomicEffectType["SPECIAL"] = "special";
})(AtomicEffectType || (exports.AtomicEffectType = AtomicEffectType = {}));
/**
 * 条件类型枚举
 */
var ConditionType;
(function (ConditionType) {
    // 速度相关
    ConditionType["FIRST_STRIKE"] = "first_strike";
    ConditionType["SECOND_STRIKE"] = "second_strike";
    ConditionType["SPEED_HIGHER"] = "speed_higher";
    ConditionType["SPEED_LOWER"] = "speed_lower";
    // HP相关
    ConditionType["HP_BELOW"] = "hp_below";
    ConditionType["HP_ABOVE"] = "hp_above";
    ConditionType["HP_PERCENT_BELOW"] = "hp_percent_below";
    ConditionType["HP_PERCENT_ABOVE"] = "hp_percent_above";
    ConditionType["HP_LOWER_THAN_TARGET"] = "hp_lower_than_target";
    ConditionType["TARGET_HP_BELOW"] = "target_hp_below";
    ConditionType["SELF_HP_BELOW_RATIO"] = "self_hp_below_ratio";
    // 状态相关
    ConditionType["SELF_HAS_STATUS"] = "self_has_status";
    ConditionType["TARGET_HAS_STATUS"] = "target_has_status";
    ConditionType["SELF_NO_STATUS"] = "self_no_status";
    ConditionType["TARGET_NO_STATUS"] = "target_no_status";
    ConditionType["TARGET_HAS_ANY_STATUS"] = "target_has_any_status";
    ConditionType["SELF_HAS_DEBUFF_OR_STATUS"] = "self_has_debuff_or_status";
    // 能力相关
    ConditionType["SELF_STAT_BOOSTED"] = "self_stat_boosted";
    ConditionType["TARGET_STAT_BOOSTED"] = "target_stat_boosted";
    ConditionType["SELF_STAT_LOWERED"] = "self_stat_lowered";
    ConditionType["TARGET_STAT_LOWERED"] = "target_stat_lowered";
    ConditionType["TARGET_HAS_STAT_DEBUFF"] = "target_has_stat_debuff";
    ConditionType["TARGET_HAS_STAT_BUFF"] = "target_has_stat_buff";
    ConditionType["SELF_HAS_STAT_BUFF"] = "self_has_stat_buff";
    ConditionType["SELF_HAS_STAT_DEBUFF"] = "self_has_stat_debuff";
    // 属性相关
    ConditionType["SKILL_TYPE_MATCH"] = "skill_type_match";
    ConditionType["SAME_TYPE"] = "same_type";
    ConditionType["SUPER_EFFECTIVE"] = "super_effective";
    ConditionType["TARGET_TYPE_NOT"] = "target_type_not";
    // 性别相关
    ConditionType["TARGET_GENDER"] = "target_gender";
    ConditionType["SELF_GENDER"] = "self_gender";
    // 技能相关
    ConditionType["SKILL_CATEGORY_PHYSICAL"] = "skill_category_physical";
    ConditionType["SKILL_CATEGORY_SPECIAL"] = "skill_category_special";
    ConditionType["SKILL_CATEGORY_STATUS"] = "skill_category_status";
    // 伤害相关
    ConditionType["DAMAGE_EVEN"] = "damage_even";
    ConditionType["DAMAGE_ODD"] = "damage_odd";
    ConditionType["DAMAGE_ABOVE"] = "damage_above";
    ConditionType["DAMAGE_BELOW"] = "damage_below";
    // 回合相关
    ConditionType["TURN_RANGE"] = "turn_range";
    // 其他
    ConditionType["MISS"] = "miss";
    ConditionType["CLEAR_SUCCESS"] = "clear_success";
    ConditionType["ALWAYS"] = "always";
    ConditionType["NEVER"] = "never";
    ConditionType["PROBABILITY"] = "probability";
})(ConditionType || (exports.ConditionType = ConditionType = {}));
//# sourceMappingURL=IAtomicEffect.js.map