import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';

// ============================================================
// Charge
// ============================================================

export interface IChargeParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'charge';
  chargeTurns: number;
  chargePowerMultiplier?: number;
  releasePowerMultiplier?: number;
  canActDuringCharge?: boolean;
  chargeMessage?: string;
  releaseMessage?: string;
}

export class Charge extends BaseAtomicEffect {
  private chargeTurns: number;
  private chargePowerMultiplier: number;
  private releasePowerMultiplier: number;
  private canActDuringCharge: boolean;
  private chargeMessage: string;
  private releaseMessage: string;

  constructor(params: IChargeParams) {
    super(
      AtomicEffectType.SPECIAL,
      'Charge',
      [EffectTiming.BEFORE_SKILL, EffectTiming.BEFORE_DAMAGE_CALC]
    );

    this.chargeTurns = params.chargeTurns;
    this.chargePowerMultiplier = params.chargePowerMultiplier ?? 0;
    this.releasePowerMultiplier = params.releasePowerMultiplier ?? 2.0;
    this.canActDuringCharge = params.canActDuringCharge ?? false;
    this.chargeMessage = params.chargeMessage ?? '正在蓄力...';
    this.releaseMessage = params.releaseMessage ?? '释放能量！';
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);

    const chargeState = this.getChargeState(attacker);

    if (!chargeState.isCharging) {
      chargeState.isCharging = true;
      chargeState.chargeCounter = 0;
      chargeState.totalChargeTurns = this.chargeTurns;
      chargeState.skillId = context.skillId;

      results.push(
        this.createResult(true, 'attacker', 'charge_start', this.chargeMessage, this.chargeTurns)
      );

      if (context.skill && context.skill.power !== undefined) {
        context.skill.power *= this.chargePowerMultiplier;
        results.push(
          this.createResult(true, 'attacker', 'power_modifier', `蓄力期间威力修正: ×${this.chargePowerMultiplier}`, context.skill.power)
        );
      }

      this.log(`开始蓄力，需要${this.chargeTurns}回合`);
    } else {
      chargeState.chargeCounter++;

      if (chargeState.chargeCounter >= chargeState.totalChargeTurns) {
        chargeState.isCharging = false;
        chargeState.chargeCounter = 0;

        results.push(
          this.createResult(true, 'attacker', 'charge_release', this.releaseMessage, this.releasePowerMultiplier)
        );

        if (context.skill && context.skill.power !== undefined) {
          context.skill.power *= this.releasePowerMultiplier;
          results.push(
            this.createResult(true, 'attacker', 'power_modifier', `释放威力提升: ×${this.releasePowerMultiplier}`, context.skill.power)
          );
        }

        this.log(`蓄力完成，释放！威力×${this.releasePowerMultiplier}`);
      } else {
        results.push(
          this.createResult(true, 'attacker', 'charge_continue', `蓄力中... (${chargeState.chargeCounter}/${chargeState.totalChargeTurns})`, chargeState.chargeCounter)
        );

        if (context.skill && context.skill.power !== undefined && !this.canActDuringCharge) {
          context.skill.power *= this.chargePowerMultiplier;
          results.push(
            this.createResult(true, 'attacker', 'power_modifier', `蓄力期间威力修正: ×${this.chargePowerMultiplier}`, context.skill.power)
          );
        }

        this.log(`继续蓄力 (${chargeState.chargeCounter}/${chargeState.totalChargeTurns})`);
      }
    }

    return results;
  }

  public validate(params: any): boolean {
    if (!params.chargeTurns || params.chargeTurns < 1) {
      this.log('蓄力回合数必须大于0', 'error');
      return false;
    }
    return true;
  }

  private getChargeState(pet: any): {
    isCharging: boolean;
    chargeCounter: number;
    totalChargeTurns: number;
    skillId: number;
  } {
    if (!pet.effectStates) {
      pet.effectStates = {};
    }
    if (!pet.effectStates.charge) {
      pet.effectStates.charge = {
        isCharging: false,
        chargeCounter: 0,
        totalChargeTurns: 0,
        skillId: 0
      };
    }
    return pet.effectStates.charge;
  }
}

// ============================================================
// ConsecutiveUse
// ============================================================

export interface IConsecutiveUseParams {
  incrementPerUse: number;
  maxIncrement: number;
  resetOnSwitch?: boolean;
}

export class ConsecutiveUse extends BaseAtomicEffect {
  private incrementPerUse: number;
  private maxIncrement: number;
  private resetOnSwitch: boolean;

  private static consecutiveUseCount: Map<string, number> = new Map();

  constructor(params: IConsecutiveUseParams) {
    super(AtomicEffectType.SPECIAL, 'ConsecutiveUse', []);
    this.incrementPerUse = params.incrementPerUse;
    this.maxIncrement = params.maxIncrement;
    this.resetOnSwitch = params.resetOnSwitch !== false;
  }

  public validate(params: any): boolean {
    return params && params.incrementPerUse !== undefined;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker, skillId } = context;
    const key = `${attacker.id}_${skillId}`;

    let useCount = ConsecutiveUse.consecutiveUseCount.get(key) || 0;

    if (this.resetOnSwitch && attacker.lastMove && attacker.lastMove !== skillId) {
      useCount = 0;
    }

    useCount++;
    ConsecutiveUse.consecutiveUseCount.set(key, useCount);

    const powerBonus = Math.min(
      (useCount - 1) * this.incrementPerUse,
      this.maxIncrement
    );

    if (context.skill && powerBonus > 0) {
      context.skill.power = (context.skill.power || 0) + powerBonus;
    }

    attacker.lastMove = skillId;

    return [this.createResult(
      true,
      'attacker',
      'power_boost',
      `连续使用第${useCount}次，威力+${powerBonus}`,
      powerBonus,
      {
        useCount,
        powerBonus,
        maxReached: powerBonus >= this.maxIncrement
      }
    )];
  }

  public static resetCount(petId: number, skillId?: number): void {
    if (skillId) {
      const key = `${petId}_${skillId}`;
      this.consecutiveUseCount.delete(key);
    } else {
      const keysToDelete: string[] = [];
      for (const key of this.consecutiveUseCount.keys()) {
        if (key.startsWith(`${petId}_`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.consecutiveUseCount.delete(key));
    }
  }

  public static clearAll(): void {
    this.consecutiveUseCount.clear();
  }
}

// ============================================================
// Encore
// ============================================================

export interface IEncoreParams {
  duration: number;
  canBeInterrupted?: boolean;
}

export class Encore extends BaseAtomicEffect {
  private duration: number;
  private canBeInterrupted: boolean;

  constructor(params: IEncoreParams) {
    super(AtomicEffectType.SPECIAL, 'Encore', []);
    this.duration = params.duration;
    this.canBeInterrupted = params.canBeInterrupted !== false;
  }

  public validate(params: any): boolean {
    return params && params.duration !== undefined;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { defender } = context;

    if (!defender.lastMove) {
      return [this.createResult(false, 'defender', 'encore', '克制失败：对手没有上次使用的技能')];
    }

    if (defender.encore && defender.encoreTurns && defender.encoreTurns > 0) {
      return [this.createResult(false, 'defender', 'encore', '克制失败：对手已经被克制')];
    }

    defender.encore = true;
    defender.encoreTurns = this.duration;

    return [this.createResult(
      true,
      'defender',
      'encore',
      `克制成功：对手被迫使用技能${defender.lastMove}，持续${this.duration}回合`,
      this.duration,
      {
        duration: this.duration,
        lockedSkill: defender.lastMove,
        canBeInterrupted: this.canBeInterrupted
      }
    )];
  }
}

// ============================================================
// PPDrain
// ============================================================

export interface IPPDrainParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'pp_drain';
  target: 'self' | 'opponent';
  mode: 'fixed' | 'percent' | 'all';
  value?: number;
  targetSkillId?: number;
  probability?: number;
}

export class PPDrain extends BaseAtomicEffect {
  private target: 'self' | 'opponent';
  private mode: 'fixed' | 'percent' | 'all';
  private value: number;
  private targetSkillId?: number;
  private probability: number;

  constructor(params: IPPDrainParams) {
    super(
      AtomicEffectType.SPECIAL,
      'PPDrain',
      [EffectTiming.AFTER_SKILL, EffectTiming.ON_ATTACKED]
    );

    this.target = params.target;
    this.mode = params.mode;
    this.value = params.value ?? 0;
    this.targetSkillId = params.targetSkillId;
    this.probability = params.probability ?? 100;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];

    if (!this.checkProbability(this.probability)) {
      results.push(this.createResult(false, 'both', 'pp_drain', 'PP消耗未触发', 0));
      return results;
    }

    const targetPet = this.getTarget(context, this.target);

    const skills = this.getTargetSkills(targetPet);
    if (skills.length === 0) {
      results.push(this.createResult(false, this.target === 'self' ? 'attacker' : 'defender', 'pp_drain', '目标没有可消耗的技能', 0));
      return results;
    }

    let targetSkill: any;
    if (this.targetSkillId !== undefined) {
      targetSkill = skills.find((s: any) => s.id === this.targetSkillId);
      if (!targetSkill) {
        results.push(this.createResult(false, this.target === 'self' ? 'attacker' : 'defender', 'pp_drain', `未找到技能ID: ${this.targetSkillId}`, 0));
        return results;
      }
    } else {
      const availableSkills = skills.filter((s: any) => (s.currentPP ?? s.maxPP ?? 0) > 0);
      if (availableSkills.length === 0) {
        results.push(this.createResult(false, this.target === 'self' ? 'attacker' : 'defender', 'pp_drain', '目标所有技能PP已耗尽', 0));
        return results;
      }
      targetSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
    }

    const currentPP = targetSkill.currentPP ?? targetSkill.maxPP ?? 0;
    const maxPP = targetSkill.maxPP ?? 0;
    let drainAmount = 0;

    switch (this.mode) {
      case 'fixed':
        drainAmount = Math.min(this.value, currentPP);
        break;
      case 'percent':
        drainAmount = Math.min(Math.floor(maxPP * this.value / 100), currentPP);
        break;
      case 'all':
        drainAmount = currentPP;
        break;
    }

    targetSkill.currentPP = Math.max(0, currentPP - drainAmount);

    results.push(
      this.createResult(
        true,
        this.target === 'self' ? 'attacker' : 'defender',
        'pp_drain',
        `技能"${targetSkill.name ?? targetSkill.id}"的PP减少了${drainAmount}`,
        drainAmount,
        { skillId: targetSkill.id, skillName: targetSkill.name, drainAmount, remainingPP: targetSkill.currentPP }
      )
    );

    this.log(`消耗${this.target === 'self' ? '自己' : '对手'}的技能PP: ${targetSkill.name ?? targetSkill.id} -${drainAmount}PP (剩余${targetSkill.currentPP})`);

    return results;
  }

  public validate(params: any): boolean {
    if (!['self', 'opponent'].includes(params.target)) {
      this.log('target必须是self或opponent', 'error');
      return false;
    }
    if (!['fixed', 'percent', 'all'].includes(params.mode)) {
      this.log('mode必须是fixed、percent或all', 'error');
      return false;
    }
    if (params.mode !== 'all' && (params.value === undefined || params.value < 0)) {
      this.log('fixed和percent模式需要指定有效的value', 'error');
      return false;
    }
    return true;
  }

  private getTargetSkills(pet: any): any[] {
    if (!pet) return [];
    return pet.skills ?? pet.skillList ?? [];
  }
}

// ============================================================
// PPRestore
// ============================================================

export interface IPPRestoreParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'pp_restore';
  mode: 'all' | 'specific' | 'random';
  amount: number;
  skillIndex?: number;
  target?: 'self' | 'opponent';
}

export class PPRestore extends BaseAtomicEffect {
  private mode: 'all' | 'specific' | 'random';
  private amount: number;
  private skillIndex: number;
  private target: 'self' | 'opponent';

  constructor(params: IPPRestoreParams) {
    super(
      AtomicEffectType.SPECIAL,
      'PPRestore',
      [EffectTiming.AFTER_SKILL]
    );

    this.mode = params.mode;
    this.amount = params.amount;
    this.skillIndex = params.skillIndex ?? 0;
    this.target = params.target ?? 'self';
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const targetPet = this.target === 'self' ? this.getAttacker(context) : this.getDefender(context);

    if (!targetPet) {
      this.log('PP恢复效果：目标不存在', 'warn');
      return results;
    }

    if (!targetPet.skills || targetPet.skills.length === 0) {
      this.log('PP恢复效果：目标没有技能', 'warn');
      return results;
    }

    switch (this.mode) {
      case 'all':
        this.restoreAllSkills(targetPet, results);
        break;
      case 'specific':
        this.restoreSpecificSkill(targetPet, results);
        break;
      case 'random':
        this.restoreRandomSkill(targetPet, results);
        break;
    }

    return results;
  }

  private restoreAllSkills(pet: any, results: IEffectResult[]): void {
    let totalRestored = 0;

    for (let i = 0; i < pet.skills.length; i++) {
      const skill = pet.skills[i];
      if (!skill) continue;
      const restored = this.restoreSkillPP(skill);
      totalRestored += restored;
    }

    if (totalRestored > 0) {
      results.push(
        this.createResult(true, this.target === 'self' ? 'attacker' : 'defender', 'pp_restore', `恢复所有技能${totalRestored}PP`, totalRestored, { mode: 'all' })
      );
      this.log(`PP恢复效果：恢复所有技能共${totalRestored}PP`);
    }
  }

  private restoreSpecificSkill(pet: any, results: IEffectResult[]): void {
    if (this.skillIndex < 0 || this.skillIndex >= pet.skills.length) {
      this.log(`PP恢复效果：技能索引${this.skillIndex}超出范围`, 'warn');
      return;
    }

    const skill = pet.skills[this.skillIndex];
    if (!skill) {
      this.log(`PP恢复效果：技能索引${this.skillIndex}不存在`, 'warn');
      return;
    }

    const restored = this.restoreSkillPP(skill);

    if (restored > 0) {
      results.push(
        this.createResult(true, this.target === 'self' ? 'attacker' : 'defender', 'pp_restore', `恢复技能${skill.name || '未知'}${restored}PP`, restored, { mode: 'specific', skillIndex: this.skillIndex })
      );
      this.log(`PP恢复效果：恢复技能${skill.name}${restored}PP`);
    }
  }

  private restoreRandomSkill(pet: any, results: IEffectResult[]): void {
    const availableSkills = pet.skills.filter((skill: any) =>
      skill && skill.pp < skill.maxPp
    );

    if (availableSkills.length === 0) {
      this.log('PP恢复效果：所有技能PP已满', 'warn');
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableSkills.length);
    const skill = availableSkills[randomIndex];

    const restored = this.restoreSkillPP(skill);

    if (restored > 0) {
      results.push(
        this.createResult(true, this.target === 'self' ? 'attacker' : 'defender', 'pp_restore', `恢复技能${skill.name || '未知'}${restored}PP`, restored, { mode: 'random' })
      );
      this.log(`PP恢复效果：随机恢复技能${skill.name}${restored}PP`);
    }
  }

  private restoreSkillPP(skill: any): number {
    if (!skill.pp && skill.pp !== 0) {
      skill.pp = skill.maxPp || 0;
    }

    const oldPP = skill.pp;
    const maxPP = skill.maxPp || 0;
    skill.pp = Math.min(maxPP, skill.pp + this.amount);
    const restored = skill.pp - oldPP;

    return restored;
  }

  public validate(params: any): boolean {
    if (!params.mode || !['all', 'specific', 'random'].includes(params.mode)) {
      this.log('PP恢复效果：mode必须是all、specific或random', 'error');
      return false;
    }

    if (typeof params.amount !== 'number' || params.amount <= 0) {
      this.log('PP恢复效果：amount必须是正数', 'error');
      return false;
    }

    if (params.mode === 'specific') {
      if (typeof params.skillIndex !== 'number' || params.skillIndex < 0 || params.skillIndex > 3) {
        this.log('PP恢复效果：skillIndex必须在0-3之间', 'error');
        return false;
      }
    }

    if (params.target && !['self', 'opponent'].includes(params.target)) {
      this.log('PP恢复效果：target必须是self或opponent', 'error');
      return false;
    }

    return true;
  }
}
