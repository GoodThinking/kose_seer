import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { BattleStatus } from '../../../../../../shared/models/BattleModel';

// ============================================================
// SpecialEffect (通用特殊效果)
// ============================================================

export interface ISpecialParams {
  type: AtomicEffectType.SPECIAL;
  specialType: string;
  [key: string]: any;
}

export class SpecialEffect extends BaseAtomicEffect {
  private params: ISpecialParams;

  constructor(params: ISpecialParams) {
    super(AtomicEffectType.SPECIAL, 'Special Effect', []);
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    this.log(`执行特殊效果: ${this.params.specialType}`, 'debug');
    return results;
  }

  public validate(params: any): boolean {
    return params && params.type === AtomicEffectType.SPECIAL && typeof params.specialType === 'string';
  }
}

// ============================================================
// DrainAura (吸血光环)
// ============================================================

export interface IDrainAuraParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'drain_aura';
  drainPercent: number;
  duration?: number;
  affectAllAttacks?: boolean;
  maxDrain?: number;
}

export class DrainAura extends BaseAtomicEffect {
  private drainPercent: number;
  private duration?: number;
  private affectAllAttacks: boolean;
  private maxDrain: number;

  constructor(params: IDrainAuraParams) {
    super(AtomicEffectType.SPECIAL, 'DrainAura', [EffectTiming.AFTER_SKILL, EffectTiming.AFTER_DAMAGE_APPLY, EffectTiming.TURN_END]);
    this.drainPercent = params.drainPercent;
    this.duration = params.duration;
    this.affectAllAttacks = params.affectAllAttacks ?? true;
    this.maxDrain = params.maxDrain ?? Infinity;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);

    if (context.timing === EffectTiming.AFTER_SKILL) {
      const auraState = this.getAuraState(attacker);
      auraState.isActive = true;
      auraState.drainPercent = this.drainPercent;
      if (this.duration !== undefined) { auraState.remainingTurns = this.duration; }
      results.push(this.createResult(true, 'attacker', 'drain_aura_activate', `吸血光环激活！攻击将回复${this.drainPercent}%伤害`, this.drainPercent, { duration: this.duration }));
      this.log(`吸血光环激活: ${this.drainPercent}%, 持续${this.duration ?? '永久'}回合`);
    }

    if (context.timing === EffectTiming.AFTER_DAMAGE_APPLY) {
      const auraState = this.getAuraState(attacker);
      if (!auraState.isActive) return results;
      const damage = context.damage ?? 0;
      if (damage <= 0) return results;
      let drainAmount = Math.floor(damage * auraState.drainPercent / 100);
      if (drainAmount > this.maxDrain) drainAmount = this.maxDrain;
      const currentHp = attacker.hp ?? 0;
      const maxHp = attacker.maxHp ?? 0;
      const actualHeal = Math.min(drainAmount, maxHp - currentHp);
      if (actualHeal > 0) {
        if (attacker.hp !== undefined) attacker.hp += actualHeal;
        auraState.totalDrained = (auraState.totalDrained ?? 0) + actualHeal;
        results.push(this.createResult(true, 'attacker', 'drain_aura_heal', `吸血光环回复了${actualHeal}HP！`, actualHeal, { damage, drainPercent: auraState.drainPercent, totalDrained: auraState.totalDrained }));
        this.log(`吸血光环回复: 伤害${damage} × ${auraState.drainPercent}% = ${actualHeal}HP (总计${auraState.totalDrained}HP)`);
      }
    }

    if (context.timing === EffectTiming.TURN_END) {
      const auraState = this.getAuraState(attacker);
      if (auraState.isActive && auraState.remainingTurns !== undefined) {
        auraState.remainingTurns--;
        if (auraState.remainingTurns <= 0) {
          auraState.isActive = false;
          results.push(this.createResult(true, 'attacker', 'drain_aura_end', `吸血光环结束了！`, 0, { totalDrained: auraState.totalDrained }));
          this.log(`吸血光环结束，总计吸血${auraState.totalDrained ?? 0}HP`);
        }
      }
    }

    return results;
  }

  public validate(params: any): boolean {
    if (params.drainPercent === undefined || params.drainPercent < 0 || params.drainPercent > 100) { this.log('drainPercent必须在0-100之间', 'error'); return false; }
    if (params.duration !== undefined && params.duration < 1) { this.log('duration必须大于0', 'error'); return false; }
    return true;
  }

  private getAuraState(pet: any): { drainPercent: number; remainingTurns?: number; isActive: boolean; totalDrained?: number; } {
    if (!pet.effectStates) pet.effectStates = {};
    if (!pet.effectStates.drainAura) pet.effectStates.drainAura = { drainPercent: 0, isActive: false, totalDrained: 0 };
    return pet.effectStates.drainAura;
  }
}

// ============================================================
// ConditionalDrainAura (条件吸血光环)
// ============================================================

export interface IConditionalDrainAuraParams {
  duration: number;
  drainRatio: number;
  condition: 'first_strike' | 'hp_below' | 'stat_boosted';
  conditionValue?: number;
}

export class ConditionalDrainAura extends BaseAtomicEffect {
  private duration: number;
  private drainRatio: number;
  private condition: string;
  private conditionValue?: number;

  constructor(params: IConditionalDrainAuraParams) {
    super(AtomicEffectType.SPECIAL, 'ConditionalDrainAura', []);
    this.duration = params.duration;
    this.drainRatio = params.drainRatio;
    this.condition = params.condition;
    this.conditionValue = params.conditionValue;
  }

  public validate(params: any): boolean { return this.duration > 0 && this.drainRatio > 0; }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker, defender, damage } = context;
    if (!this.checkCondition(context)) {
      return [this.createResult(false, 'attacker', 'conditional_drain_aura', '条件不满足')];
    }
    const drainAmount = damage ? Math.floor(damage * this.drainRatio) : 0;
    if (drainAmount > 0) {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + drainAmount);
      return [this.createResult(true, 'attacker', 'conditional_drain_aura', `条件吸血（回复${drainAmount}HP）`, drainAmount, { drainAmount, condition: this.condition, duration: this.duration })];
    }
    return [this.createResult(false, 'attacker', 'conditional_drain_aura', '无伤害，无法吸血')];
  }

  private checkCondition(context: IEffectContext): boolean {
    const { attacker, defender } = context;
    switch (this.condition) {
      case 'first_strike': return attacker.speed > defender.speed;
      case 'hp_below': return this.conditionValue ? (attacker.hp / attacker.maxHp) <= this.conditionValue : false;
      case 'stat_boosted': return attacker.battleLevels ? attacker.battleLevels.some((level: number) => level > 0) : false;
      default: return false;
    }
  }
}

// ============================================================
// ConditionalContinuousDamage (条件持续伤害)
// ============================================================

export interface IConditionalContinuousDamageParams {
  duration: number;
  damagePerTurn: number;
  condition: 'self_weakened' | 'target_boosted' | 'hp_below';
  conditionValue?: number;
}

export class ConditionalContinuousDamage extends BaseAtomicEffect {
  private duration: number;
  private damagePerTurn: number;
  private condition: string;
  private conditionValue?: number;

  constructor(params: IConditionalContinuousDamageParams) {
    super(AtomicEffectType.SPECIAL, 'ConditionalContinuousDamage', []);
    this.duration = params.duration;
    this.damagePerTurn = params.damagePerTurn;
    this.condition = params.condition;
    this.conditionValue = params.conditionValue;
  }

  public validate(params: any): boolean { return this.duration > 0 && this.damagePerTurn > 0; }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker, defender } = context;
    if (!this.checkCondition(context)) {
      return [this.createResult(false, 'defender', 'conditional_continuous_damage', '条件不满足')];
    }
    const actualDamage = Math.min(this.damagePerTurn, defender.hp);
    defender.hp = Math.max(0, defender.hp - actualDamage);
    return [this.createResult(true, 'defender', 'conditional_continuous_damage', `条件持续伤害（${actualDamage}点）`, actualDamage, { damagePerTurn: this.damagePerTurn, condition: this.condition, duration: this.duration })];
  }

  private checkCondition(context: IEffectContext): boolean {
    const { attacker, defender } = context;
    switch (this.condition) {
      case 'self_weakened':
        const hasStatDown = attacker.battleLevels?.some((level: number) => level < 0) || false;
        const hasStatus = attacker.status !== undefined && attacker.status !== BattleStatus.NONE;
        return hasStatDown || hasStatus;
      case 'target_boosted': return defender.battleLevels ? defender.battleLevels.some((level: number) => level > 0) : false;
      case 'hp_below': return this.conditionValue ? (defender.hp / defender.maxHp) <= this.conditionValue : false;
      default: return false;
    }
  }
}

// ============================================================
// WeakenEffect (衰弱效果)
// ============================================================

export interface IWeakenEffectParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'weaken';
  weakenType: 'damage' | 'heal' | 'all';
  ratio: number;
  duration?: number;
}

export class WeakenEffect extends BaseAtomicEffect {
  private weakenType: 'damage' | 'heal' | 'all';
  private ratio: number;
  private duration: number;

  constructor(params: IWeakenEffectParams) {
    super(AtomicEffectType.SPECIAL, 'WeakenEffect', [EffectTiming.AFTER_SKILL, EffectTiming.AFTER_DAMAGE_CALC, EffectTiming.TURN_END]);
    this.weakenType = params.weakenType;
    this.ratio = params.ratio;
    this.duration = params.duration ?? 0;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const target = this.getDefender(context);
    if (!target) { this.log('衰弱效果：目标不存在', 'warn'); return results; }
    const state = this.getWeakenState(target);

    if (context.timing === EffectTiming.AFTER_SKILL) {
      state.isActive = true; state.remainingTurns = this.duration; state.weakenType = this.weakenType; state.ratio = this.ratio;
      results.push(this.createResult(true, 'defender', 'weaken', `激活衰弱效果（${this.weakenType}）`, this.ratio, { duration: this.duration }));
      this.log(`衰弱效果：激活${this.weakenType}衰弱，持续${this.duration}回合`);
    }

    if (context.timing === EffectTiming.AFTER_DAMAGE_CALC && state.isActive) {
      if (state.weakenType === 'damage' || state.weakenType === 'all') {
        const attacker = this.getAttacker(context);
        if (attacker && this.isWeakened(attacker, state)) {
          const oldDamage = context.damage || 0;
          context.damage = Math.floor(oldDamage * (1 - state.ratio));
          results.push(this.createResult(true, 'attacker', 'weaken', `伤害衰弱：${oldDamage}→${context.damage}`, oldDamage - context.damage, { weakenType: 'damage', ratio: state.ratio }));
        }
      }
    }

    if (context.timing === EffectTiming.TURN_END && state.isActive) {
      if (state.remainingTurns > 0) {
        state.remainingTurns--;
        if (state.remainingTurns === 0) {
          state.isActive = false;
          results.push(this.createResult(true, 'defender', 'weaken', '衰弱效果结束', 0));
        }
      }
    }

    return results;
  }

  private isWeakened(pet: any, state: any): boolean { return state.isActive && pet.effectStates?.weaken === state; }

  private getWeakenState(pet: any): { isActive: boolean; remainingTurns: number; weakenType: string; ratio: number; } {
    if (!pet.effectStates) pet.effectStates = {};
    if (!pet.effectStates.weaken) pet.effectStates.weaken = { isActive: false, remainingTurns: 0, weakenType: '', ratio: 0 };
    return pet.effectStates.weaken;
  }

  public validate(params: any): boolean {
    if (!params.weakenType || !['damage', 'heal', 'all'].includes(params.weakenType)) { this.log('衰弱效果：weakenType必须是damage、heal或all', 'error'); return false; }
    if (typeof params.ratio !== 'number' || params.ratio < 0 || params.ratio > 1) { this.log('衰弱效果：ratio必须在0-1之间', 'error'); return false; }
    return true;
  }
}

// ============================================================
// ClearTurnEffects (清除回合效果)
// ============================================================

export interface IClearTurnEffectsParams {
  target?: string;
}

export class ClearTurnEffects extends BaseAtomicEffect {
  private target: string;

  constructor(params: IClearTurnEffectsParams) {
    super(AtomicEffectType.SPECIAL, 'ClearTurnEffects', []);
    this.target = params.target || 'opponent';
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    return [this.createResult(true, this.target === 'self' ? 'attacker' : 'defender', 'clear_turn_effects', `清除回合效果`, 1, { target: this.target })];
  }
}

// ============================================================
// Transform (变身)
// ============================================================

export interface ITransformParams {
  duration?: number;
  copyStatStages?: boolean;
  copyHp?: boolean;
}

export class Transform extends BaseAtomicEffect {
  private duration: number;
  private copyStatStages: boolean;
  private copyHp: boolean;

  constructor(params: ITransformParams) {
    super(AtomicEffectType.SPECIAL, 'Transform', []);
    this.duration = params.duration || 0;
    this.copyStatStages = params.copyStatStages !== false;
    this.copyHp = params.copyHp || false;
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker, defender } = context;
    attacker.attack = defender.attack;
    attacker.defence = defender.defence;
    attacker.speed = defender.speed;
    attacker.skills = [...defender.skills];
    if (defender.skillPP) attacker.skillPP = [...defender.skillPP];
    attacker.type = defender.type;
    if (this.copyStatStages && defender.battleLv) attacker.battleLv = [...defender.battleLv];
    return [this.createResult(true, 'attacker', 'transform', `变身成功：变身成${defender.name || '对手'}`, 0, { duration: this.duration, copyStatStages: this.copyStatStages, copyHp: this.copyHp })];
  }
}

// ============================================================
// Substitute (替身)
// ============================================================

export interface ISubstituteParams {
  hpPercent: number;
  canBeCrit?: boolean;
  canBeStatused?: boolean;
}

export class Substitute extends BaseAtomicEffect {
  private hpPercent: number;
  private canBeCrit: boolean;
  private canBeStatused: boolean;

  constructor(params: ISubstituteParams) {
    super(AtomicEffectType.SPECIAL, 'Substitute', []);
    this.hpPercent = params.hpPercent;
    this.canBeCrit = params.canBeCrit || false;
    this.canBeStatused = params.canBeStatused || false;
  }

  public validate(params: any): boolean { return params && params.hpPercent !== undefined; }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker } = context;
    const substituteHp = Math.floor(attacker.maxHp * this.hpPercent);
    if (attacker.hp <= substituteHp) {
      return [this.createResult(false, 'attacker', 'substitute', '替身失败：HP不足')];
    }
    attacker.hp -= substituteHp;
    return [this.createResult(true, 'attacker', 'substitute', `替身成功：创建${substituteHp} HP的替身（简化实现）`, substituteHp, { substituteHp, hpCost: substituteHp, remainingHp: attacker.hp, canBeCrit: this.canBeCrit, canBeStatused: this.canBeStatused })];
  }
}

// ============================================================
// TypeSkillCounter (属性技能反击)
// ============================================================

export interface ITypeSkillCounterParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'type_skill_counter';
  duration: number;
  counterType: 'status' | 'stat_change' | 'damage';
  statusId?: number;
  statusDuration?: number;
  probability?: number;
  statIndex?: number;
  statChange?: number;
  damageValue?: number;
}

export class TypeSkillCounter extends BaseAtomicEffect {
  private duration: number;
  private counterType: string;
  private statusId?: number;
  private statusDuration: number;
  private probability: number;
  private statIndex?: number;
  private statChange?: number;
  private damageValue?: number;

  constructor(params: ITypeSkillCounterParams) {
    super(AtomicEffectType.SPECIAL, 'TypeSkillCounter', [EffectTiming.AFTER_SKILL, EffectTiming.BEFORE_SKILL, EffectTiming.TURN_END]);
    this.duration = params.duration;
    this.counterType = params.counterType;
    this.statusId = params.statusId;
    this.statusDuration = params.statusDuration || 3;
    this.probability = params.probability || 100;
    this.statIndex = params.statIndex;
    this.statChange = params.statChange;
    this.damageValue = params.damageValue;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const defender = this.getDefender(context);

    if (context.timing === EffectTiming.AFTER_SKILL) {
      if (!attacker.effectCounters) attacker.effectCounters = {};
      attacker.effectCounters['type_skill_counter'] = this.duration;
      attacker.effectCounters['type_skill_counter_prob'] = this.probability;
      if (this.counterType === 'status' && this.statusId !== undefined) {
        attacker.effectCounters['type_skill_counter_type'] = 1;
        attacker.effectCounters['type_skill_counter_status'] = this.statusId;
        attacker.effectCounters['type_skill_counter_duration'] = this.statusDuration;
      } else if (this.counterType === 'stat_change' && this.statIndex !== undefined && this.statChange !== undefined) {
        attacker.effectCounters['type_skill_counter_type'] = 2;
        attacker.effectCounters['type_skill_counter_stat'] = this.statIndex;
        attacker.effectCounters['type_skill_counter_change'] = this.statChange;
      } else if (this.counterType === 'damage' && this.damageValue !== undefined) {
        attacker.effectCounters['type_skill_counter_type'] = 3;
        attacker.effectCounters['type_skill_counter_damage'] = this.damageValue;
      }
      results.push(this.createResult(true, 'attacker', 'type_skill_counter', `属性技能反击状态！持续${this.duration}回合`, this.duration, { counterType: this.counterType }));
    }

    if (context.timing === EffectTiming.BEFORE_SKILL) {
      if (defender.effectCounters?.['type_skill_counter']) {
        const counterTypeNum = defender.effectCounters['type_skill_counter_type'] || 0;
        const prob = defender.effectCounters['type_skill_counter_prob'] || 100;
        const skill = context.skill;
        const isTypeSkill = true;
        if (skill && isTypeSkill && Math.random() * 100 < prob) {
          if (counterTypeNum === 1) {
            const statusId = defender.effectCounters['type_skill_counter_status'] || 0;
            const duration = defender.effectCounters['type_skill_counter_duration'] || 3;
            if (!attacker.status || attacker.status === -1) {
              if (!attacker.immuneFlags?.status) {
                attacker.status = statusId;
                if (!attacker.statusDurations) attacker.statusDurations = [0, 0, 0, 0, 0, 0, 0, 0, 0];
                attacker.statusDurations[statusId] = duration;
                results.push(this.createResult(true, 'attacker', 'status_inflict', `属性技能反击！施加异常状态！`, statusId, { duration }));
              }
            }
          } else if (counterTypeNum === 2) {
            const statIdx = defender.effectCounters['type_skill_counter_stat'] || 0;
            const statChg = defender.effectCounters['type_skill_counter_change'] || 0;
            if (!attacker.battleLv) attacker.battleLv = [0, 0, 0, 0, 0, 0];
            const oldLevel = attacker.battleLv[statIdx];
            attacker.battleLv[statIdx] = Math.max(-6, Math.min(6, oldLevel + statChg));
            results.push(this.createResult(true, 'attacker', 'stat_change', `属性技能反击！能力变化！`, statChg, { statIndex: statIdx, oldLevel, newLevel: attacker.battleLv[statIdx] }));
          } else if (counterTypeNum === 3) {
            const dmgVal = defender.effectCounters['type_skill_counter_damage'] || 0;
            if (attacker.hp !== undefined) {
              attacker.hp = Math.max(0, attacker.hp - dmgVal);
              results.push(this.createResult(true, 'attacker', 'damage', `属性技能反击！造成${dmgVal}伤害！`, dmgVal));
            }
          }
        }
      }
    }

    if (context.timing === EffectTiming.TURN_END) {
      if (attacker.effectCounters?.['type_skill_counter']) {
        attacker.effectCounters['type_skill_counter']--;
        if (attacker.effectCounters['type_skill_counter'] <= 0) {
          delete attacker.effectCounters['type_skill_counter'];
          delete attacker.effectCounters['type_skill_counter_type'];
          delete attacker.effectCounters['type_skill_counter_prob'];
          delete attacker.effectCounters['type_skill_counter_status'];
          delete attacker.effectCounters['type_skill_counter_duration'];
          delete attacker.effectCounters['type_skill_counter_stat'];
          delete attacker.effectCounters['type_skill_counter_change'];
          delete attacker.effectCounters['type_skill_counter_damage'];
          results.push(this.createResult(true, 'attacker', 'type_skill_counter_end', `属性技能反击状态解除！`, 0));
        }
      }
    }

    return results;
  }

  public validate(params: any): boolean {
    if (params.duration === undefined || params.duration < 1) { this.log('duration必须大于0', 'error'); return false; }
    if (!params.counterType) { this.log('counterType必须指定', 'error'); return false; }
    return true;
  }
}

// ============================================================
// BattleReward (战斗奖励)
// ============================================================

export interface IBattleRewardParams {
  rewardType: 'coins' | 'exp' | 'items';
  amount: number;
  dailyLimit?: number;
}

export class BattleReward extends BaseAtomicEffect {
  private rewardType: string;
  private amount: number;
  private dailyLimit?: number;

  constructor(params: IBattleRewardParams) {
    super(AtomicEffectType.SPECIAL, 'BattleReward', []);
    this.rewardType = params.rewardType;
    this.amount = params.amount;
    this.dailyLimit = params.dailyLimit;
  }

  public validate(params: any): boolean { return this.amount > 0; }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker } = context;
    if (!attacker.effectCounters) attacker.effectCounters = {};
    const rewardKey = `battle_reward_${this.rewardType}`;
    attacker.effectCounters[rewardKey] = this.amount;
    if (this.dailyLimit) attacker.effectCounters[`${rewardKey}_limit`] = this.dailyLimit;
    return [this.createResult(true, 'attacker', 'battle_reward', `战斗奖励标记（${this.rewardType}: ${this.amount}）`, this.amount, { rewardType: this.rewardType, amount: this.amount, dailyLimit: this.dailyLimit })];
  }
}
