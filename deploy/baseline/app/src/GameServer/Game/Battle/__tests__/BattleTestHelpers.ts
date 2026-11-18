/**
 * 战斗测试辅助工具
 * 提供 IBattlePet、IEffectContext 等对象的 mock 构建函数
 */

import { IBattlePet, BattleStatus, IAttackResult, ITurnResult } from '../../../../shared/models/BattleModel';
import { EffectTiming, IEffectContext, createEffectContext } from '../effects/core/EffectContext';
import { SkillCategory } from '../BattleAlgorithm';

/**
 * 创建测试用精灵数据
 */
export function createMockBattlePet(options: Partial<IBattlePet> = {}): IBattlePet {
  const defaultPet: IBattlePet = {
    id: 1,
    petId: 1001,
    name: '测试精灵',
    level: 100,
    hp: 300,
    maxHp: 300,
    attack: 200,
    defence: 150,
    spAtk: 180,
    spDef: 160,
    speed: 150,
    type: 1, // 草系
    skills: [1001, 1002, 1003, 1004],
    catchTime: Date.now(),
    statusArray: new Array(20).fill(0),
    battleLv: [0, 0, 0, 0, 0, 0],
    battleLevels: [0, 0, 0, 0, 0, 0],
    effectCounters: {},
    status: undefined,
    statusTurns: 0,
    statusDurations: new Array(20).fill(0),
    flinched: false,
    bound: false,
    boundTurns: 0,
    fatigue: false,
    fatigueTurns: 0,
    lastMove: 0,
    skillPP: [30, 30, 30, 30],
    encore: false,
    encoreTurns: 0,
    immuneFlags: {
      statDown: false,
      status: false
    }
  };

  return { ...defaultPet, ...options };
}

/**
 * 创建攻击方精灵（带完整属性）
 */
export function createAttacker(options: Partial<IBattlePet> = {}): IBattlePet {
  return createMockBattlePet({
    id: 1,
    name: '攻击方',
    hp: 300,
    maxHp: 300,
    attack: 250,
    defence: 150,
    spAtk: 200,
    spDef: 160,
    speed: 180,
    type: 1, // 草系
    ...options
  });
}

/**
 * 创建防御方精灵（带完整属性）
 */
export function createDefender(options: Partial<IBattlePet> = {}): IBattlePet {
  return createMockBattlePet({
    id: 2,
    name: '防御方',
    hp: 280,
    maxHp: 280,
    attack: 180,
    defence: 200,
    spAtk: 150,
    spDef: 180,
    speed: 120,
    type: 2, // 水系
    ...options
  });
}

/**
 * 创建效果上下文
 */
export function createMockEffectContext(
  attacker: IBattlePet,
  defender: IBattlePet,
  options: Partial<IEffectContext> = {}
): IEffectContext {
  const defaultContext: IEffectContext = {
    attacker,
    defender,
    skillId: 1001,
    skillType: 1,
    skillCategory: SkillCategory.PHYSICAL,
    skillPower: 80,
    damage: 0,
    originalDamage: 0,
    turn: 1,
    timing: EffectTiming.BEFORE_SKILL,
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

  return { ...defaultContext, ...options };
}

/**
 * 创建效果上下文（简化版本）
 */
export function createEffectContextSimple(
  attackerHp: number = 300,
  defenderHp: number = 280,
  attackerType: number = 1,
  defenderType: number = 2
): IEffectContext {
  const attacker = createAttacker({ hp: attackerHp, maxHp: attackerHp, type: attackerType });
  const defender = createDefender({ hp: defenderHp, maxHp: defenderHp, type: defenderType });

  return createMockEffectContext(attacker, defender);
}

/**
 * 模拟造成伤害后的效果上下文
 */
export function createDamageContext(
  baseDamage: number,
  attacker: IBattlePet,
  defender: IBattlePet
): IEffectContext {
  return createMockEffectContext(attacker, defender, {
    damage: baseDamage,
    originalDamage: baseDamage,
    timing: EffectTiming.AFTER_DAMAGE_APPLY
  });
}

/**
 * 创建精灵并应用能力等级
 */
export function createPetWithStages(
  stages: number[],
  isAttacker: boolean = true
): IBattlePet {
  const pet = isAttacker ? createAttacker() : createDefender();
  pet.battleLevels = [...stages];
  return pet;
}

/**
 * 创建精灵并设置状态
 */
export function createPetWithStatus(
  status: BattleStatus,
  turns: number = 3
): IBattlePet {
  const pet = createAttacker();
  pet.status = status;
  pet.statusTurns = turns;
  pet.statusDurations = new Array(20).fill(0);
  pet.statusDurations[status] = turns;
  return pet;
}

/**
 * 重置精灵HP
 */
export function resetPetHp(pet: IBattlePet, hp?: number): IBattlePet {
  pet.hp = hp || pet.maxHp;
  return pet;
}

/**
 * 造成伤害
 */
export function applyDamage(pet: IBattlePet, damage: number): IBattlePet {
  pet.hp = Math.max(0, pet.hp - damage);
  return pet;
}

/**
 * 恢复HP
 */
export function healPet(pet: IBattlePet, amount: number): IBattlePet {
  pet.hp = Math.min(pet.maxHp, pet.hp + amount);
  return pet;
}

/**
 * 模拟技能使用（减少PP）
 */
export function useSkill(pet: IBattlePet, skillIndex: number): boolean {
  if (!pet.skillPP || !pet.skills[skillIndex]) return false;
  if (pet.skillPP[skillIndex] <= 0) return false;

  pet.skillPP[skillIndex]--;
  pet.lastMove = pet.skills[skillIndex];
  return true;
}

/**
 * 模拟回合开始（状态持续时间减少）
 */
export function tickTurnStart(pet: IBattlePet): IBattlePet {
  // 减少状态持续时间
  if (pet.status && pet.statusTurns && pet.statusTurns > 0) {
    pet.statusTurns--;
    if (pet.statusTurns <= 0) {
      pet.status = undefined;
    }
  }

  if (pet.statusDurations) {
    for (let i = 0; i < pet.statusDurations.length; i++) {
      if (pet.statusDurations[i] > 0) {
        pet.statusDurations[i]--;
      }
    }
  }

  // 减少束缚回合
  if (pet.bound && pet.boundTurns && pet.boundTurns > 0) {
    pet.boundTurns--;
    if (pet.boundTurns <= 0) {
      pet.bound = false;
    }
  }

  // 减少疲惫回合
  if (pet.fatigue && pet.fatigueTurns && pet.fatigueTurns > 0) {
    pet.fatigueTurns--;
    if (pet.fatigueTurns <= 0) {
      pet.fatigue = false;
    }
  }

  // 减少克制回合
  if (pet.encore && pet.encoreTurns && pet.encoreTurns > 0) {
    pet.encoreTurns--;
    if (pet.encoreTurns <= 0) {
      pet.encore = false;
    }
  }

  return pet;
}