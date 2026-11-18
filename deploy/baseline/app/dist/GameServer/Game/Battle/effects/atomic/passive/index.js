"use strict";
/**
 * 被动效果导出
 * BOSS特性 - 永久生效的被动能力
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysChanceDamageBonusPassive = exports.ChanceFullBlockPassive = exports.ChanceDamageFlatReducePassive = exports.BothDamageMultiplyPassive = exports.BothDamageReducePassive = exports.OddDamageDividePassive = exports.EvenDamageMultiplyPassive = exports.DamageBonusPercentPassive = exports.TypeDamageBonusPassive = exports.FlatStatBonusPassive = exports.ReviveFullPassive = exports.ReviveOnDeathPassive = exports.LowHpOhkoPriorityPassive = exports.ReceivedDamageMultiplyPassive = exports.FiveTurnImmortalPassive = exports.SurviveLethalChancePassive = exports.SurviveWith1HpPassive = exports.RotatingTypeShieldPassive = exports.TypeSequenceShieldPassive = exports.SkillUnlockShieldPassive = exports.HpStatBindPassive = exports.CounterPriorityReducePassive = exports.CounterDamageReducePassive = exports.CounterFearPassive = exports.EscapePassive = exports.OnHitSelfStatUpPassive = exports.OnSpHitEnemyStatDownPassive = exports.OnSpHitStatUpPassive = exports.HighDamageReflectPassive = exports.DamageReflectFractionPassive = exports.InfinitePPPassive = exports.BurstRecoverFullHpPpPassive = exports.BurstRecoverFullHpPassive = exports.CritRateReducePassive = exports.StatusCritBonusPassive = exports.FixedCritDivisorPassive = exports.CritRateBonusPassive = exports.FixedCritRatePassive = exports.AccuracyBonusPassive = exports.SkillDodgePassive = exports.AccuracyReductionPassive = exports.OnSpHitStatusInflictPassive = exports.SpHitStatusInflictPassive = exports.PhysHitStatusInflictPassive = exports.OnHitStatusInflictPassive = exports.TypeImmunityPassive = exports.SameTypeAbsorbPassive = exports.DamageReductionPassive = exports.StatusImmunityPassive = exports.StatDownImmunityPassive = void 0;
exports.ClearEnemyTurnEffectsPassive = exports.TypeOhkoPassive = exports.LowHpFullHealChancePassive = exports.DodgeHealPassive = exports.HighDamageCounterKillPassive = exports.LowHpGuardianPassive = exports.HighDamageHealPassive = exports.HighDamageNextDoublePassive = exports.HitStackWeaknessPassive = exports.DamageLifestealPassive = exports.LowDamageHealPassive = exports.CopyEnemyBuffPassive = exports.GenderDamageBonusPassive = exports.SpecificTypeAbsorbPassive = exports.BossPossessionPassive = exports.BossRagePassive = exports.TimedOhkoPassive = exports.RotatingAttackImmunityPassive = exports.SkillEffectImmunityPassive = exports.EffectImmunityPassive = exports.PostHitDamageReductionPassive = exports.AttackTypeImmunePassive = exports.HighDamageNextPriorityPassive = exports.LowHpPriorityPassive = exports.PriorityChangePassive = exports.TurnEnemyDamagePassive = exports.AsymmetricTurnHealPassive = exports.TurnDrainPassive = exports.BothTurnDamagePassive = exports.BothTurnHealPercentPassive = exports.TurnEndHealPassive = exports.SelfDamageReducePassive = exports.AttackTypeDamageBonusPassive = exports.SpChanceDamageBonusPassive = void 0;
// 已有被动
var StatDownImmunityPassive_1 = require("./StatDownImmunityPassive");
Object.defineProperty(exports, "StatDownImmunityPassive", { enumerable: true, get: function () { return StatDownImmunityPassive_1.StatDownImmunityPassive; } });
var StatusImmunityPassive_1 = require("./StatusImmunityPassive");
Object.defineProperty(exports, "StatusImmunityPassive", { enumerable: true, get: function () { return StatusImmunityPassive_1.StatusImmunityPassive; } });
var DamageReductionPassive_1 = require("./DamageReductionPassive");
Object.defineProperty(exports, "DamageReductionPassive", { enumerable: true, get: function () { return DamageReductionPassive_1.DamageReductionPassive; } });
var SameTypeAbsorbPassive_1 = require("./SameTypeAbsorbPassive");
Object.defineProperty(exports, "SameTypeAbsorbPassive", { enumerable: true, get: function () { return SameTypeAbsorbPassive_1.SameTypeAbsorbPassive; } });
var TypeImmunityPassive_1 = require("./TypeImmunityPassive");
Object.defineProperty(exports, "TypeImmunityPassive", { enumerable: true, get: function () { return TypeImmunityPassive_1.TypeImmunityPassive; } });
// 状态施加 (2006, 2066, 2067, 2078)
var StatusInflictPassives_1 = require("./StatusInflictPassives");
Object.defineProperty(exports, "OnHitStatusInflictPassive", { enumerable: true, get: function () { return StatusInflictPassives_1.OnHitStatusInflictPassive; } });
Object.defineProperty(exports, "PhysHitStatusInflictPassive", { enumerable: true, get: function () { return StatusInflictPassives_1.PhysHitStatusInflictPassive; } });
Object.defineProperty(exports, "SpHitStatusInflictPassive", { enumerable: true, get: function () { return StatusInflictPassives_1.SpHitStatusInflictPassive; } });
Object.defineProperty(exports, "OnSpHitStatusInflictPassive", { enumerable: true, get: function () { return StatusInflictPassives_1.OnSpHitStatusInflictPassive; } });
// 命中率 (2007, 2024, 2029)
var AccuracyPassives_1 = require("./AccuracyPassives");
Object.defineProperty(exports, "AccuracyReductionPassive", { enumerable: true, get: function () { return AccuracyPassives_1.AccuracyReductionPassive; } });
Object.defineProperty(exports, "SkillDodgePassive", { enumerable: true, get: function () { return AccuracyPassives_1.SkillDodgePassive; } });
Object.defineProperty(exports, "AccuracyBonusPassive", { enumerable: true, get: function () { return AccuracyPassives_1.AccuracyBonusPassive; } });
// 暴击率 (2008, 2030, 2045, 2057, 2064)
var CritPassives_1 = require("./CritPassives");
Object.defineProperty(exports, "FixedCritRatePassive", { enumerable: true, get: function () { return CritPassives_1.FixedCritRatePassive; } });
Object.defineProperty(exports, "CritRateBonusPassive", { enumerable: true, get: function () { return CritPassives_1.CritRateBonusPassive; } });
Object.defineProperty(exports, "FixedCritDivisorPassive", { enumerable: true, get: function () { return CritPassives_1.FixedCritDivisorPassive; } });
Object.defineProperty(exports, "StatusCritBonusPassive", { enumerable: true, get: function () { return CritPassives_1.StatusCritBonusPassive; } });
Object.defineProperty(exports, "CritRateReducePassive", { enumerable: true, get: function () { return CritPassives_1.CritRateReducePassive; } });
// 濒死回满 (2009, 2051)
var BurstRecoverPassives_1 = require("./BurstRecoverPassives");
Object.defineProperty(exports, "BurstRecoverFullHpPassive", { enumerable: true, get: function () { return BurstRecoverPassives_1.BurstRecoverFullHpPassive; } });
Object.defineProperty(exports, "BurstRecoverFullHpPpPassive", { enumerable: true, get: function () { return BurstRecoverPassives_1.BurstRecoverFullHpPpPassive; } });
// 无限PP (2010)
var InfinitePPPassive_1 = require("./InfinitePPPassive");
Object.defineProperty(exports, "InfinitePPPassive", { enumerable: true, get: function () { return InfinitePPPassive_1.InfinitePPPassive; } });
// 伤害反弹 (2011, 2083)
var DamageReflectPassives_1 = require("./DamageReflectPassives");
Object.defineProperty(exports, "DamageReflectFractionPassive", { enumerable: true, get: function () { return DamageReflectPassives_1.DamageReflectFractionPassive; } });
Object.defineProperty(exports, "HighDamageReflectPassive", { enumerable: true, get: function () { return DamageReflectPassives_1.HighDamageReflectPassive; } });
// 受击能力变化 (2012, 2034, 2035)
var OnHitStatChangePassives_1 = require("./OnHitStatChangePassives");
Object.defineProperty(exports, "OnSpHitStatUpPassive", { enumerable: true, get: function () { return OnHitStatChangePassives_1.OnSpHitStatUpPassive; } });
Object.defineProperty(exports, "OnSpHitEnemyStatDownPassive", { enumerable: true, get: function () { return OnHitStatChangePassives_1.OnSpHitEnemyStatDownPassive; } });
Object.defineProperty(exports, "OnHitSelfStatUpPassive", { enumerable: true, get: function () { return OnHitStatChangePassives_1.OnHitSelfStatUpPassive; } });
// 定时逃跑 (2013)
var EscapePassive_1 = require("./EscapePassive");
Object.defineProperty(exports, "EscapePassive", { enumerable: true, get: function () { return EscapePassive_1.EscapePassive; } });
// 天敌 (2014, 2015, 2043)
var CounterPassives_1 = require("./CounterPassives");
Object.defineProperty(exports, "CounterFearPassive", { enumerable: true, get: function () { return CounterPassives_1.CounterFearPassive; } });
Object.defineProperty(exports, "CounterDamageReducePassive", { enumerable: true, get: function () { return CounterPassives_1.CounterDamageReducePassive; } });
Object.defineProperty(exports, "CounterPriorityReducePassive", { enumerable: true, get: function () { return CounterPassives_1.CounterPriorityReducePassive; } });
// 血量绑定能力 (2016)
var HpStatBindPassive_1 = require("./HpStatBindPassive");
Object.defineProperty(exports, "HpStatBindPassive", { enumerable: true, get: function () { return HpStatBindPassive_1.HpStatBindPassive; } });
// 护盾 (2020, 2027, 2036)
var ShieldPassives_1 = require("./ShieldPassives");
Object.defineProperty(exports, "SkillUnlockShieldPassive", { enumerable: true, get: function () { return ShieldPassives_1.SkillUnlockShieldPassive; } });
Object.defineProperty(exports, "TypeSequenceShieldPassive", { enumerable: true, get: function () { return ShieldPassives_1.TypeSequenceShieldPassive; } });
Object.defineProperty(exports, "RotatingTypeShieldPassive", { enumerable: true, get: function () { return ShieldPassives_1.RotatingTypeShieldPassive; } });
// 存活 (2021, 2031, 2046)
var SurvivePassives_1 = require("./SurvivePassives");
Object.defineProperty(exports, "SurviveWith1HpPassive", { enumerable: true, get: function () { return SurvivePassives_1.SurviveWith1HpPassive; } });
Object.defineProperty(exports, "SurviveLethalChancePassive", { enumerable: true, get: function () { return SurvivePassives_1.SurviveLethalChancePassive; } });
Object.defineProperty(exports, "FiveTurnImmortalPassive", { enumerable: true, get: function () { return SurvivePassives_1.FiveTurnImmortalPassive; } });
// 受击伤害倍增 (2022)
var ReceivedDamageMultiplyPassive_1 = require("./ReceivedDamageMultiplyPassive");
Object.defineProperty(exports, "ReceivedDamageMultiplyPassive", { enumerable: true, get: function () { return ReceivedDamageMultiplyPassive_1.ReceivedDamageMultiplyPassive; } });
// 低血秒杀先手 (2023)
var LowHpOhkoPriorityPassive_1 = require("./LowHpOhkoPriorityPassive");
Object.defineProperty(exports, "LowHpOhkoPriorityPassive", { enumerable: true, get: function () { return LowHpOhkoPriorityPassive_1.LowHpOhkoPriorityPassive; } });
// 复活 (2025, 2044)
var RevivePassives_1 = require("./RevivePassives");
Object.defineProperty(exports, "ReviveOnDeathPassive", { enumerable: true, get: function () { return RevivePassives_1.ReviveOnDeathPassive; } });
Object.defineProperty(exports, "ReviveFullPassive", { enumerable: true, get: function () { return RevivePassives_1.ReviveFullPassive; } });
// 固定属性加成 (2026)
var FlatStatBonusPassive_1 = require("./FlatStatBonusPassive");
Object.defineProperty(exports, "FlatStatBonusPassive", { enumerable: true, get: function () { return FlatStatBonusPassive_1.FlatStatBonusPassive; } });
// 属性伤害加成 (2028)
var TypeDamageBonusPassive_1 = require("./TypeDamageBonusPassive");
Object.defineProperty(exports, "TypeDamageBonusPassive", { enumerable: true, get: function () { return TypeDamageBonusPassive_1.TypeDamageBonusPassive; } });
// 伤害修改 (2038, 2039, 2040, 2047, 2055, 2060, 2061, 2062, 2063, 2065, 2076)
var DamageModifyPassives_1 = require("./DamageModifyPassives");
Object.defineProperty(exports, "DamageBonusPercentPassive", { enumerable: true, get: function () { return DamageModifyPassives_1.DamageBonusPercentPassive; } });
Object.defineProperty(exports, "EvenDamageMultiplyPassive", { enumerable: true, get: function () { return DamageModifyPassives_1.EvenDamageMultiplyPassive; } });
Object.defineProperty(exports, "OddDamageDividePassive", { enumerable: true, get: function () { return DamageModifyPassives_1.OddDamageDividePassive; } });
Object.defineProperty(exports, "BothDamageReducePassive", { enumerable: true, get: function () { return DamageModifyPassives_1.BothDamageReducePassive; } });
Object.defineProperty(exports, "BothDamageMultiplyPassive", { enumerable: true, get: function () { return DamageModifyPassives_1.BothDamageMultiplyPassive; } });
Object.defineProperty(exports, "ChanceDamageFlatReducePassive", { enumerable: true, get: function () { return DamageModifyPassives_1.ChanceDamageFlatReducePassive; } });
Object.defineProperty(exports, "ChanceFullBlockPassive", { enumerable: true, get: function () { return DamageModifyPassives_1.ChanceFullBlockPassive; } });
Object.defineProperty(exports, "PhysChanceDamageBonusPassive", { enumerable: true, get: function () { return DamageModifyPassives_1.PhysChanceDamageBonusPassive; } });
Object.defineProperty(exports, "SpChanceDamageBonusPassive", { enumerable: true, get: function () { return DamageModifyPassives_1.SpChanceDamageBonusPassive; } });
Object.defineProperty(exports, "AttackTypeDamageBonusPassive", { enumerable: true, get: function () { return DamageModifyPassives_1.AttackTypeDamageBonusPassive; } });
Object.defineProperty(exports, "SelfDamageReducePassive", { enumerable: true, get: function () { return DamageModifyPassives_1.SelfDamageReducePassive; } });
// 回合回血/扣血 (2041, 2053, 2054, 2071, 2075, 2077)
var TurnHealPassives_1 = require("./TurnHealPassives");
Object.defineProperty(exports, "TurnEndHealPassive", { enumerable: true, get: function () { return TurnHealPassives_1.TurnEndHealPassive; } });
Object.defineProperty(exports, "BothTurnHealPercentPassive", { enumerable: true, get: function () { return TurnHealPassives_1.BothTurnHealPercentPassive; } });
Object.defineProperty(exports, "BothTurnDamagePassive", { enumerable: true, get: function () { return TurnHealPassives_1.BothTurnDamagePassive; } });
Object.defineProperty(exports, "TurnDrainPassive", { enumerable: true, get: function () { return TurnHealPassives_1.TurnDrainPassive; } });
Object.defineProperty(exports, "AsymmetricTurnHealPassive", { enumerable: true, get: function () { return TurnHealPassives_1.AsymmetricTurnHealPassive; } });
Object.defineProperty(exports, "TurnEnemyDamagePassive", { enumerable: true, get: function () { return TurnHealPassives_1.TurnEnemyDamagePassive; } });
// 先制 (2042, 2097, 2098)
var PriorityPassives_1 = require("./PriorityPassives");
Object.defineProperty(exports, "PriorityChangePassive", { enumerable: true, get: function () { return PriorityPassives_1.PriorityChangePassive; } });
Object.defineProperty(exports, "LowHpPriorityPassive", { enumerable: true, get: function () { return PriorityPassives_1.LowHpPriorityPassive; } });
Object.defineProperty(exports, "HighDamageNextPriorityPassive", { enumerable: true, get: function () { return PriorityPassives_1.HighDamageNextPriorityPassive; } });
// 攻击类型无效 (2048)
var AttackTypeImmunePassive_1 = require("./AttackTypeImmunePassive");
Object.defineProperty(exports, "AttackTypeImmunePassive", { enumerable: true, get: function () { return AttackTypeImmunePassive_1.AttackTypeImmunePassive; } });
// 受击后减伤 (2049)
var PostHitDamageReductionPassive_1 = require("./PostHitDamageReductionPassive");
Object.defineProperty(exports, "PostHitDamageReductionPassive", { enumerable: true, get: function () { return PostHitDamageReductionPassive_1.PostHitDamageReductionPassive; } });
// 免疫特效 (2050, 2185)
var EffectImmunityPassives_1 = require("./EffectImmunityPassives");
Object.defineProperty(exports, "EffectImmunityPassive", { enumerable: true, get: function () { return EffectImmunityPassives_1.EffectImmunityPassive; } });
Object.defineProperty(exports, "SkillEffectImmunityPassive", { enumerable: true, get: function () { return EffectImmunityPassives_1.SkillEffectImmunityPassive; } });
// 轮换免疫 (2052)
var RotatingAttackImmunityPassive_1 = require("./RotatingAttackImmunityPassive");
Object.defineProperty(exports, "RotatingAttackImmunityPassive", { enumerable: true, get: function () { return RotatingAttackImmunityPassive_1.RotatingAttackImmunityPassive; } });
// 定时秒杀 (2056)
var TimedOhkoPassive_1 = require("./TimedOhkoPassive");
Object.defineProperty(exports, "TimedOhkoPassive", { enumerable: true, get: function () { return TimedOhkoPassive_1.TimedOhkoPassive; } });
// 魔王愤怒/附身 (2058, 2059)
var BossRagePassive_1 = require("./BossRagePassive");
Object.defineProperty(exports, "BossRagePassive", { enumerable: true, get: function () { return BossRagePassive_1.BossRagePassive; } });
var BossPossessionPassive_1 = require("./BossPossessionPassive");
Object.defineProperty(exports, "BossPossessionPassive", { enumerable: true, get: function () { return BossPossessionPassive_1.BossPossessionPassive; } });
// 特定系吸收 (2068)
var SpecificTypeAbsorbPassive_1 = require("./SpecificTypeAbsorbPassive");
Object.defineProperty(exports, "SpecificTypeAbsorbPassive", { enumerable: true, get: function () { return SpecificTypeAbsorbPassive_1.SpecificTypeAbsorbPassive; } });
// 性别伤害加成 (2069)
var GenderDamageBonusPassive_1 = require("./GenderDamageBonusPassive");
Object.defineProperty(exports, "GenderDamageBonusPassive", { enumerable: true, get: function () { return GenderDamageBonusPassive_1.GenderDamageBonusPassive; } });
// 复制强化 (2070)
var CopyEnemyBuffPassive_1 = require("./CopyEnemyBuffPassive");
Object.defineProperty(exports, "CopyEnemyBuffPassive", { enumerable: true, get: function () { return CopyEnemyBuffPassive_1.CopyEnemyBuffPassive; } });
// 命中后效果 (2072, 2073, 2074, 2079, 2080, 2081)
var OnHitPassives_1 = require("./OnHitPassives");
Object.defineProperty(exports, "LowDamageHealPassive", { enumerable: true, get: function () { return OnHitPassives_1.LowDamageHealPassive; } });
Object.defineProperty(exports, "DamageLifestealPassive", { enumerable: true, get: function () { return OnHitPassives_1.DamageLifestealPassive; } });
Object.defineProperty(exports, "HitStackWeaknessPassive", { enumerable: true, get: function () { return OnHitPassives_1.HitStackWeaknessPassive; } });
Object.defineProperty(exports, "HighDamageNextDoublePassive", { enumerable: true, get: function () { return OnHitPassives_1.HighDamageNextDoublePassive; } });
Object.defineProperty(exports, "HighDamageHealPassive", { enumerable: true, get: function () { return OnHitPassives_1.HighDamageHealPassive; } });
Object.defineProperty(exports, "LowHpGuardianPassive", { enumerable: true, get: function () { return OnHitPassives_1.LowHpGuardianPassive; } });
// 高伤反杀 (2037)
var HighDamageCounterKillPassive_1 = require("./HighDamageCounterKillPassive");
Object.defineProperty(exports, "HighDamageCounterKillPassive", { enumerable: true, get: function () { return HighDamageCounterKillPassive_1.HighDamageCounterKillPassive; } });
// 闪避回血 (2082)
var DodgeHealPassive_1 = require("./DodgeHealPassive");
Object.defineProperty(exports, "DodgeHealPassive", { enumerable: true, get: function () { return DodgeHealPassive_1.DodgeHealPassive; } });
// 低血概率回满 (2033)
var LowHpFullHealChancePassive_1 = require("./LowHpFullHealChancePassive");
Object.defineProperty(exports, "LowHpFullHealChancePassive", { enumerable: true, get: function () { return LowHpFullHealChancePassive_1.LowHpFullHealChancePassive; } });
// 属性秒杀 (2205)
var TypeOhkoPassive_1 = require("./TypeOhkoPassive");
Object.defineProperty(exports, "TypeOhkoPassive", { enumerable: true, get: function () { return TypeOhkoPassive_1.TypeOhkoPassive; } });
// 命中消回合效果 (2772)
var ClearEnemyTurnEffectsPassive_1 = require("./ClearEnemyTurnEffectsPassive");
Object.defineProperty(exports, "ClearEnemyTurnEffectsPassive", { enumerable: true, get: function () { return ClearEnemyTurnEffectsPassive_1.ClearEnemyTurnEffectsPassive; } });
//# sourceMappingURL=index.js.map