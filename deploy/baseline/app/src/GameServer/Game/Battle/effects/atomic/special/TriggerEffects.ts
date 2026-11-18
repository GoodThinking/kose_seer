import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';

// ============================================================
// KoDamageNext
// ============================================================

export interface IKoDamageNextParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'ko_damage_next';
  mode: 'percent' | 'fixed' | 'overflow';
  value?: number;
}

export class KoDamageNext extends BaseAtomicEffect {
  private mode: 'percent' | 'fixed' | 'overflow';
  private value: number;

  constructor(params: IKoDamageNextParams) {
    super(AtomicEffectType.SPECIAL, 'KoDamageNext', [EffectTiming.AFTER_KO]);
    this.mode = params.mode;
    this.value = params.value ?? 0;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);

    if ((defender.hp ?? 0) > 0) {
      return results;
    }

    let nextDamage = 0;

    switch (this.mode) {
      case 'percent':
        const maxHp = defender.maxHp ?? 0;
        nextDamage = Math.floor(maxHp * this.value / 100);
        break;
      case 'fixed':
        nextDamage = this.value;
        break;
      case 'overflow':
        const actualDamage = context.damage;
        const hpBeforeDamage = (defender.hp ?? 0) + actualDamage;
        nextDamage = Math.max(0, actualDamage - hpBeforeDamage);
        break;
    }

    if (nextDamage > 0) {
      results.push(
        this.createResult(true, 'defender', 'ko_damage_next', `击败后将对下一只造成${nextDamage}伤害！`, nextDamage, { mode: this.mode, damage: nextDamage })
      );
      this.log(`击败伤害下一只: ${this.mode}模式, 伤害${nextDamage}`);
    }

    return results;
  }

  public validate(params: any): boolean {
    if (!['percent', 'fixed', 'overflow'].includes(params.mode)) {
      this.log('mode必须是percent、fixed或overflow', 'error');
      return false;
    }
    if (params.mode !== 'overflow' && params.value === undefined) {
      this.log('percent和fixed模式需要指定value', 'error');
      return false;
    }
    return true;
  }
}

// ============================================================
// KoTransferBuff
// ============================================================

export interface IKoTransferBuffParams {
  onlyPositive?: boolean;
}

export class KoTransferBuff extends BaseAtomicEffect {
  private onlyPositive: boolean;

  constructor(params: IKoTransferBuffParams) {
    super(AtomicEffectType.SPECIAL, 'KoTransferBuff', []);
    this.onlyPositive = params.onlyPositive !== false;
  }

  public validate(params: any): boolean {
    return true;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker, defender, damage } = context;

    const defenderHp = defender.hp;
    const willKo = damage !== undefined && damage >= defenderHp;

    if (!willKo) {
      return [this.createResult(false, 'attacker', 'ko_transfer_buff', '未击败对手')];
    }

    let transferredCount = 0;

    if (defender.battleLevels && attacker.battleLevels) {
      for (let i = 0; i < defender.battleLevels.length; i++) {
        const defenderLevel = defender.battleLevels[i];

        if (this.onlyPositive && defenderLevel > 0) {
          attacker.battleLevels[i] = Math.min(6, attacker.battleLevels[i] + defenderLevel);
          transferredCount++;
        } else if (!this.onlyPositive && defenderLevel !== 0) {
          attacker.battleLevels[i] = Math.max(-6, Math.min(6, attacker.battleLevels[i] + defenderLevel));
          transferredCount++;
        }
      }
    }

    return [this.createResult(
      transferredCount > 0,
      'attacker',
      'ko_transfer_buff',
      `击败转移强化（${transferredCount}个能力）`,
      transferredCount,
      { transferredCount, onlyPositive: this.onlyPositive }
    )];
  }
}

// ============================================================
// MissPenalty
// ============================================================

export interface IMissPenaltyParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'miss_penalty';
  penaltyType: 'hp_damage' | 'stat_down' | 'status';
  hpDamage?: number;
  hpDamageMode?: 'percent' | 'fixed';
  statIndex?: number;
  statChange?: number;
  statusId?: number;
}

export class MissPenalty extends BaseAtomicEffect {
  private penaltyType: 'hp_damage' | 'stat_down' | 'status';
  private hpDamage: number;
  private hpDamageMode: 'percent' | 'fixed';
  private statIndex: number;
  private statChange: number;
  private statusId: number;

  constructor(params: IMissPenaltyParams) {
    super(AtomicEffectType.SPECIAL, 'MissPenalty', [EffectTiming.AFTER_SKILL]);
    this.penaltyType = params.penaltyType;
    this.hpDamage = params.hpDamage ?? 0;
    this.hpDamageMode = params.hpDamageMode ?? 'percent';
    this.statIndex = params.statIndex ?? 0;
    this.statChange = params.statChange ?? -1;
    this.statusId = params.statusId ?? 0;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);

    if (!attacker) {
      this.log('Miss惩罚效果：攻击者不存在', 'warn');
      return results;
    }

    const skillMissed = context.effectData?.missed === true || context.effectData?.hit === false;
    if (!skillMissed) {
      return results;
    }

    const state = this.getMissPenaltyState(attacker);
    state.missCount = (state.missCount || 0) + 1;

    switch (this.penaltyType) {
      case 'hp_damage':
        this.applyHpDamagePenalty(attacker, results);
        break;
      case 'stat_down':
        this.applyStatDownPenalty(attacker, results);
        break;
      case 'status':
        this.applyStatusPenalty(attacker, results);
        break;
    }

    return results;
  }

  private applyHpDamagePenalty(attacker: any, results: IEffectResult[]): void {
    let damage = 0;

    if (this.hpDamageMode === 'percent') {
      damage = Math.floor(attacker.maxHp * (this.hpDamage / 100));
    } else {
      damage = this.hpDamage;
    }

    damage = Math.min(damage, attacker.hp - 1);
    damage = Math.max(0, damage);

    if (damage > 0) {
      attacker.hp -= damage;
      results.push(
        this.createResult(true, 'attacker', 'miss_penalty', `Miss惩罚：损失${damage}HP`, damage, { penaltyType: 'hp_damage', mode: this.hpDamageMode })
      );
      this.log(`Miss惩罚效果：攻击者损失${damage}HP`);
    }
  }

  private applyStatDownPenalty(attacker: any, results: IEffectResult[]): void {
    if (!attacker.battleLevels) {
      attacker.battleLevels = [0, 0, 0, 0, 0, 0];
    }

    const oldLevel = attacker.battleLevels[this.statIndex];
    attacker.battleLevels[this.statIndex] = Math.max(-6, Math.min(6, oldLevel + this.statChange));
    const newLevel = attacker.battleLevels[this.statIndex];

    const statNames = ['攻击', '防御', '特攻', '特防', '速度', '命中'];
    const statName = statNames[this.statIndex] || '未知';

    results.push(
      this.createResult(true, 'attacker', 'miss_penalty', `Miss惩罚：${statName}${this.statChange > 0 ? '+' : ''}${this.statChange}`, this.statChange, { penaltyType: 'stat_down', statIndex: this.statIndex, oldLevel, newLevel })
    );
    this.log(`Miss惩罚效果：攻击者${statName}从${oldLevel}变为${newLevel}`);
  }

  private applyStatusPenalty(attacker: any, results: IEffectResult[]): void {
    if (!attacker.status) {
      attacker.status = this.statusId;

      const statusNames = ['麻痹', '中毒', '烧伤', '冻伤', '睡眠', '混乱', '害怕', '疲惫'];
      const statusName = statusNames[this.statusId] || '未知';

      results.push(
        this.createResult(true, 'attacker', 'miss_penalty', `Miss惩罚：陷入${statusName}状态`, this.statusId, { penaltyType: 'status', statusId: this.statusId })
      );
      this.log(`Miss惩罚效果：攻击者陷入${statusName}状态`);
    }
  }

  private getMissPenaltyState(pet: any): { missCount: number } {
    if (!pet.effectStates) {
      pet.effectStates = {};
    }
    if (!pet.effectStates.missPenalty) {
      pet.effectStates.missPenalty = { missCount: 0 };
    }
    return pet.effectStates.missPenalty;
  }

  public validate(params: any): boolean {
    if (!params.penaltyType || !['hp_damage', 'stat_down', 'status'].includes(params.penaltyType)) {
      this.log('Miss惩罚效果：penaltyType必须是hp_damage、stat_down或status', 'error');
      return false;
    }
    if (params.penaltyType === 'hp_damage') {
      if (typeof params.hpDamage !== 'number' || params.hpDamage <= 0) {
        this.log('Miss惩罚效果：hpDamage必须是正数', 'error');
        return false;
      }
      if (params.hpDamageMode === 'percent' && (params.hpDamage < 0 || params.hpDamage > 100)) {
        this.log('Miss惩罚效果：百分比模式下hpDamage必须在0-100之间', 'error');
        return false;
      }
    }
    if (params.penaltyType === 'stat_down') {
      if (typeof params.statIndex !== 'number' || params.statIndex < 0 || params.statIndex > 5) {
        this.log('Miss惩罚效果：statIndex必须在0-5之间', 'error');
        return false;
      }
      if (typeof params.statChange !== 'number' || params.statChange < -6 || params.statChange > 6) {
        this.log('Miss惩罚效果：statChange必须在-6到6之间', 'error');
        return false;
      }
    }
    if (params.penaltyType === 'status') {
      if (typeof params.statusId !== 'number' || params.statusId < 0) {
        this.log('Miss惩罚效果：statusId必须是非负整数', 'error');
        return false;
      }
    }
    return true;
  }
}

// ============================================================
// OnOpponentMiss
// ============================================================

export interface IOnOpponentMissParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'on_opponent_miss';
  duration: number;
  effect: 'focus_energy' | 'stat_boost' | 'heal';
  effectDuration?: number;
  statIndex?: number;
  statChange?: number;
  healAmount?: number;
}

export class OnOpponentMiss extends BaseAtomicEffect {
  private duration: number;
  private effect: string;
  private effectDuration: number;
  private statIndex?: number;
  private statChange?: number;
  private healAmount?: number;

  constructor(params: IOnOpponentMissParams) {
    super(
      AtomicEffectType.SPECIAL,
      'OnOpponentMiss',
      [EffectTiming.AFTER_SKILL, EffectTiming.BEFORE_SKILL, EffectTiming.TURN_END]
    );

    this.duration = params.duration;
    this.effect = params.effect;
    this.effectDuration = params.effectDuration || 1;
    this.statIndex = params.statIndex;
    this.statChange = params.statChange;
    this.healAmount = params.healAmount;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);

    if (context.timing === EffectTiming.AFTER_SKILL) {
      if (!attacker.effectCounters) {
        attacker.effectCounters = {};
      }

      attacker.effectCounters['on_opponent_miss'] = this.duration;
      this.log(`对方Miss触发状态: 持续${this.duration}回合（需要战斗系统集成）`);

      results.push(
        this.createResult(true, 'attacker', 'on_opponent_miss', `对方Miss触发状态！持续${this.duration}回合`, this.duration)
      );

      this.log(`对方Miss触发状态: 持续${this.duration}回合, 效果=${this.effect}`);
    }

    if (context.timing === EffectTiming.BEFORE_SKILL) {
      // 设置监听，实际触发需要在Miss发生时调用
    }

    if (context.timing === EffectTiming.TURN_END) {
      if (attacker.effectCounters?.['on_opponent_miss']) {
        attacker.effectCounters['on_opponent_miss']--;
        if (attacker.effectCounters['on_opponent_miss'] <= 0) {
          delete attacker.effectCounters['on_opponent_miss'];

          results.push(
            this.createResult(true, 'attacker', 'on_opponent_miss_end', `对方Miss触发状态解除！`, 0)
          );

          this.log(`对方Miss触发状态解除`);
        }
      }
    }

    return results;
  }

  public validate(params: any): boolean {
    if (params.duration === undefined || params.duration < 1) {
      this.log('duration必须大于0', 'error');
      return false;
    }
    if (!params.effect) {
      this.log('effect必须指定', 'error');
      return false;
    }
    return true;
  }
}

// ============================================================
// OnEvadeBoost
// ============================================================

export interface IOnEvadeBoostParams {
  duration: number;
  chance: number;
  statIndex: number;
  boostLevel: number;
}

export class OnEvadeBoost extends BaseAtomicEffect {
  private duration: number;
  private chance: number;
  private statIndex: number;
  private boostLevel: number;

  constructor(params: IOnEvadeBoostParams) {
    super(AtomicEffectType.SPECIAL, 'OnEvadeBoost', []);
    this.duration = params.duration;
    this.chance = params.chance;
    this.statIndex = params.statIndex;
    this.boostLevel = params.boostLevel;
  }

  public validate(params: any): boolean {
    return this.duration > 0 && this.chance > 0 && this.chance <= 1;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker } = context;

    const missed = false; // 简化处理

    if (!missed) {
      return [this.createResult(false, 'attacker', 'on_evade_boost', '未闪避攻击')];
    }

    const roll = Math.random();
    if (roll > this.chance) {
      return [this.createResult(false, 'attacker', 'on_evade_boost', `概率判定失败（${(roll * 100).toFixed(1)}% > ${(this.chance * 100).toFixed(1)}%）`)];
    }

    if (!attacker.battleLevels) {
      attacker.battleLevels = [0, 0, 0, 0, 0, 0];
    }

    const beforeLevel = attacker.battleLevels[this.statIndex];
    attacker.battleLevels[this.statIndex] = Math.min(6, beforeLevel + this.boostLevel);
    const actualBoost = attacker.battleLevels[this.statIndex] - beforeLevel;

    const statNames = ['攻击', '防御', '特攻', '特防', '速度', '命中'];

    return [this.createResult(
      actualBoost > 0,
      'attacker',
      'on_evade_boost',
      `闪避提升${statNames[this.statIndex]}（+${actualBoost}）`,
      actualBoost,
      { statIndex: this.statIndex, boostLevel: actualBoost, duration: this.duration }
    )];
  }
}

// ============================================================
// DelayedKill
// ============================================================

export interface IDelayedKillParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'delayed_kill';
  delay: number;
  canBeHealed?: boolean;
}

export class DelayedKill extends BaseAtomicEffect {
  private delay: number;
  private canBeHealed: boolean;

  constructor(params: IDelayedKillParams) {
    super(
      AtomicEffectType.SPECIAL,
      'DelayedKill',
      [EffectTiming.AFTER_SKILL, EffectTiming.TURN_END, EffectTiming.ON_HP_CHANGE]
    );

    this.delay = params.delay;
    this.canBeHealed = params.canBeHealed ?? false;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);

    if (context.timing === EffectTiming.AFTER_SKILL) {
      const killState = this.getKillState(defender);
      killState.isActive = true;
      killState.remainingTurns = this.delay;
      killState.canBeHealed = this.canBeHealed;

      results.push(
        this.createResult(true, 'defender', 'delayed_kill_set', `被施加了延迟秒杀！${this.delay}回合后将被击倒`, this.delay)
      );
      this.log(`延迟秒杀设置: ${this.delay}回合后击倒`);
    }

    if (context.timing === EffectTiming.TURN_END) {
      const killState = this.getKillState(defender);

      if (killState.isActive) {
        killState.remainingTurns--;

        if (killState.remainingTurns > 0) {
          results.push(
            this.createResult(true, 'defender', 'delayed_kill_countdown', `延迟秒杀倒计时：${killState.remainingTurns}回合`, killState.remainingTurns)
          );
        } else {
          defender.hp = 0;
          killState.isActive = false;

          results.push(
            this.createResult(true, 'defender', 'delayed_kill_execute', `延迟秒杀生效！被击倒了`, 0)
          );
          this.log(`延迟秒杀生效: 目标被击倒`);
        }
      }
    }

    if (context.timing === EffectTiming.ON_HP_CHANGE && this.canBeHealed) {
      const killState = this.getKillState(defender);

      if (killState.isActive) {
        const currentHp = defender.hp ?? 0;
        const maxHp = defender.maxHp ?? 0;

        if (currentHp >= maxHp) {
          killState.isActive = false;

          results.push(
            this.createResult(true, 'defender', 'delayed_kill_removed', `延迟秒杀被解除了！`, 0)
          );
          this.log(`延迟秒杀解除: HP回满`);
        }
      }
    }

    return results;
  }

  public validate(params: any): boolean {
    if (params.delay === undefined || params.delay < 1) {
      this.log('delay必须至少为1', 'error');
      return false;
    }
    return true;
  }

  private getKillState(pet: any): {
    remainingTurns: number;
    isActive: boolean;
    canBeHealed: boolean;
  } {
    if (!pet.effectStates) {
      pet.effectStates = {};
    }
    if (!pet.effectStates.delayedKill) {
      pet.effectStates.delayedKill = {
        remainingTurns: 0,
        isActive: false,
        canBeHealed: false
      };
    }
    return pet.effectStates.delayedKill;
  }
}
