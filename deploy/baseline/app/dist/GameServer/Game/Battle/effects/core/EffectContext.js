"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EffectTiming = void 0;
exports.createEffectContext = createEffectContext;
/**
 * 效果触发时机
 */
var EffectTiming;
(function (EffectTiming) {
    // 战斗开始
    EffectTiming["BATTLE_START"] = "BATTLE_START";
    // 回合开始
    EffectTiming["TURN_START"] = "TURN_START";
    // 技能使用前
    EffectTiming["BEFORE_SKILL"] = "BEFORE_SKILL";
    // 速度判定前
    EffectTiming["BEFORE_SPEED_CHECK"] = "BEFORE_SPEED_CHECK";
    // 命中判定前
    EffectTiming["BEFORE_HIT_CHECK"] = "BEFORE_HIT_CHECK";
    // 暴击判定前
    EffectTiming["BEFORE_CRIT_CHECK"] = "BEFORE_CRIT_CHECK";
    // 伤害计算前
    EffectTiming["BEFORE_DAMAGE_CALC"] = "BEFORE_DAMAGE_CALC";
    // 伤害计算后
    EffectTiming["AFTER_DAMAGE_CALC"] = "AFTER_DAMAGE_CALC";
    // 命中判定
    EffectTiming["HIT_CHECK"] = "HIT_CHECK";
    // 暴击判定
    EffectTiming["CRIT_CHECK"] = "CRIT_CHECK";
    // 伤害应用前
    EffectTiming["BEFORE_DAMAGE_APPLY"] = "BEFORE_DAMAGE_APPLY";
    // 伤害应用后
    EffectTiming["AFTER_DAMAGE_APPLY"] = "AFTER_DAMAGE_APPLY";
    // 技能使用后
    EffectTiming["AFTER_SKILL"] = "AFTER_SKILL";
    // 命中判定后
    EffectTiming["AFTER_HIT_CHECK"] = "AFTER_HIT_CHECK";
    // 击败对方后
    EffectTiming["AFTER_KO"] = "AFTER_KO";
    // 回合结束
    EffectTiming["TURN_END"] = "TURN_END";
    // 战斗结束
    EffectTiming["BATTLE_END"] = "BATTLE_END";
    // HP变化时
    EffectTiming["ON_HP_CHANGE"] = "ON_HP_CHANGE";
    // 受到攻击时
    EffectTiming["ON_ATTACKED"] = "ON_ATTACKED";
    // 攻击时
    EffectTiming["ON_ATTACK"] = "ON_ATTACK";
    // 击败对手时
    EffectTiming["ON_KO"] = "ON_KO";
    // 受到伤害时
    EffectTiming["ON_RECEIVE_DAMAGE"] = "ON_RECEIVE_DAMAGE";
    // 闪避时
    EffectTiming["ON_EVADE"] = "ON_EVADE";
    // 出手流程开始（每个攻击方出手前，异常扣血在此）
    EffectTiming["ATTACK_START"] = "ATTACK_START";
    // 命中时（命中判定通过后，技能效果结算前。需命中才触发）
    EffectTiming["ON_HIT"] = "ON_HIT";
    // 即时技能效果结算（命中后，伤害计算前。大部分技能副作用在此）
    EffectTiming["SKILL_EFFECT"] = "SKILL_EFFECT";
    // 出手流程结束时（单次攻击所有伤害结算完毕后）
    EffectTiming["ATTACK_END"] = "ATTACK_END";
    // 出手流程结束后（双方攻击都完成后，击杀控等）
    EffectTiming["AFTER_ATTACK_END"] = "AFTER_ATTACK_END";
})(EffectTiming || (exports.EffectTiming = EffectTiming = {}));
/**
 * 创建效果上下文
 */
function createEffectContext(attacker, defender, skillId, damage = 0, timing = EffectTiming.BEFORE_SKILL) {
    return {
        attacker,
        defender,
        skillId,
        skillType: 0,
        skillCategory: 1,
        skillPower: 0,
        damage,
        originalDamage: damage,
        turn: 0,
        timing,
        effectId: 0,
        effectArgs: [],
        results: [],
        isCrit: false,
        isMiss: false,
        isBlocked: false,
        damageMultiplier: 1.0,
        hitRateModifier: 0,
        critRateModifier: 0,
        priorityModifier: 0
    };
}
//# sourceMappingURL=EffectContext.js.map