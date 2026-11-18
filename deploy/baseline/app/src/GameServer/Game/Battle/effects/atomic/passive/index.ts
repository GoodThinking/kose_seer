/**
 * 被动效果导出
 * BOSS特性 - 永久生效的被动能力
 */

// 已有被动
export { StatDownImmunityPassive } from './StatDownImmunityPassive';
export { StatusImmunityPassive } from './StatusImmunityPassive';
export { DamageReductionPassive } from './DamageReductionPassive';
export { SameTypeAbsorbPassive } from './SameTypeAbsorbPassive';
export { TypeImmunityPassive } from './TypeImmunityPassive';

// 状态施加 (2006, 2066, 2067, 2078)
export { OnHitStatusInflictPassive, PhysHitStatusInflictPassive, SpHitStatusInflictPassive, OnSpHitStatusInflictPassive } from './StatusInflictPassives';

// 命中率 (2007, 2024, 2029)
export { AccuracyReductionPassive, SkillDodgePassive, AccuracyBonusPassive } from './AccuracyPassives';

// 暴击率 (2008, 2030, 2045, 2057, 2064)
export { FixedCritRatePassive, CritRateBonusPassive, FixedCritDivisorPassive, StatusCritBonusPassive, CritRateReducePassive } from './CritPassives';

// 濒死回满 (2009, 2051)
export { BurstRecoverFullHpPassive, BurstRecoverFullHpPpPassive } from './BurstRecoverPassives';

// 无限PP (2010)
export { InfinitePPPassive } from './InfinitePPPassive';

// 伤害反弹 (2011, 2083)
export { DamageReflectFractionPassive, HighDamageReflectPassive } from './DamageReflectPassives';

// 受击能力变化 (2012, 2034, 2035)
export { OnSpHitStatUpPassive, OnSpHitEnemyStatDownPassive, OnHitSelfStatUpPassive } from './OnHitStatChangePassives';

// 定时逃跑 (2013)
export { EscapePassive } from './EscapePassive';

// 天敌 (2014, 2015, 2043)
export { CounterFearPassive, CounterDamageReducePassive, CounterPriorityReducePassive } from './CounterPassives';

// 血量绑定能力 (2016)
export { HpStatBindPassive } from './HpStatBindPassive';

// 护盾 (2020, 2027, 2036)
export { SkillUnlockShieldPassive, TypeSequenceShieldPassive, RotatingTypeShieldPassive } from './ShieldPassives';

// 存活 (2021, 2031, 2046)
export { SurviveWith1HpPassive, SurviveLethalChancePassive, FiveTurnImmortalPassive } from './SurvivePassives';

// 受击伤害倍增 (2022)
export { ReceivedDamageMultiplyPassive } from './ReceivedDamageMultiplyPassive';

// 低血秒杀先手 (2023)
export { LowHpOhkoPriorityPassive } from './LowHpOhkoPriorityPassive';

// 复活 (2025, 2044)
export { ReviveOnDeathPassive, ReviveFullPassive } from './RevivePassives';

// 固定属性加成 (2026)
export { FlatStatBonusPassive } from './FlatStatBonusPassive';

// 属性伤害加成 (2028)
export { TypeDamageBonusPassive } from './TypeDamageBonusPassive';

// 伤害修改 (2038, 2039, 2040, 2047, 2055, 2060, 2061, 2062, 2063, 2065, 2076)
export { DamageBonusPercentPassive, EvenDamageMultiplyPassive, OddDamageDividePassive, BothDamageReducePassive, BothDamageMultiplyPassive, ChanceDamageFlatReducePassive, ChanceFullBlockPassive, PhysChanceDamageBonusPassive, SpChanceDamageBonusPassive, AttackTypeDamageBonusPassive, SelfDamageReducePassive } from './DamageModifyPassives';

// 回合回血/扣血 (2041, 2053, 2054, 2071, 2075, 2077)
export { TurnEndHealPassive, BothTurnHealPercentPassive, BothTurnDamagePassive, TurnDrainPassive, AsymmetricTurnHealPassive, TurnEnemyDamagePassive } from './TurnHealPassives';

// 先制 (2042, 2097, 2098)
export { PriorityChangePassive, LowHpPriorityPassive, HighDamageNextPriorityPassive } from './PriorityPassives';

// 攻击类型无效 (2048)
export { AttackTypeImmunePassive } from './AttackTypeImmunePassive';

// 受击后减伤 (2049)
export { PostHitDamageReductionPassive } from './PostHitDamageReductionPassive';

// 免疫特效 (2050, 2185)
export { EffectImmunityPassive, SkillEffectImmunityPassive } from './EffectImmunityPassives';

// 轮换免疫 (2052)
export { RotatingAttackImmunityPassive } from './RotatingAttackImmunityPassive';

// 定时秒杀 (2056)
export { TimedOhkoPassive } from './TimedOhkoPassive';

// 魔王愤怒/附身 (2058, 2059)
export { BossRagePassive } from './BossRagePassive';
export { BossPossessionPassive } from './BossPossessionPassive';

// 特定系吸收 (2068)
export { SpecificTypeAbsorbPassive } from './SpecificTypeAbsorbPassive';

// 性别伤害加成 (2069)
export { GenderDamageBonusPassive } from './GenderDamageBonusPassive';

// 复制强化 (2070)
export { CopyEnemyBuffPassive } from './CopyEnemyBuffPassive';

// 命中后效果 (2072, 2073, 2074, 2079, 2080, 2081)
export { LowDamageHealPassive, DamageLifestealPassive, HitStackWeaknessPassive, HighDamageNextDoublePassive, HighDamageHealPassive, LowHpGuardianPassive } from './OnHitPassives';

// 高伤反杀 (2037)
export { HighDamageCounterKillPassive } from './HighDamageCounterKillPassive';

// 闪避回血 (2082)
export { DodgeHealPassive } from './DodgeHealPassive';

// 低血概率回满 (2033)
export { LowHpFullHealChancePassive } from './LowHpFullHealChancePassive';

// 属性秒杀 (2205)
export { TypeOhkoPassive } from './TypeOhkoPassive';

// 命中消回合效果 (2772)
export { ClearEnemyTurnEffectsPassive } from './ClearEnemyTurnEffectsPassive';
