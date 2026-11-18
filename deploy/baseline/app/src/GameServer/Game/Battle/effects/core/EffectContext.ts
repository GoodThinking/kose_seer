import { IBattlePet } from '../../../../../shared/models/BattleModel';

/**
 * 效果触发时机
 */
export enum EffectTiming {
  // 战斗开始
  BATTLE_START = 'BATTLE_START',
  
  // 回合开始
  TURN_START = 'TURN_START',
  
  // 技能使用前
  BEFORE_SKILL = 'BEFORE_SKILL',
  
  // 速度判定前
  BEFORE_SPEED_CHECK = 'BEFORE_SPEED_CHECK',
  
  // 命中判定前
  BEFORE_HIT_CHECK = 'BEFORE_HIT_CHECK',
  
  // 暴击判定前
  BEFORE_CRIT_CHECK = 'BEFORE_CRIT_CHECK',
  
  // 伤害计算前
  BEFORE_DAMAGE_CALC = 'BEFORE_DAMAGE_CALC',
  
  // 伤害计算后
  AFTER_DAMAGE_CALC = 'AFTER_DAMAGE_CALC',
  
  // 命中判定
  HIT_CHECK = 'HIT_CHECK',
  
  // 暴击判定
  CRIT_CHECK = 'CRIT_CHECK',
  
  // 伤害应用前
  BEFORE_DAMAGE_APPLY = 'BEFORE_DAMAGE_APPLY',
  
  // 伤害应用后
  AFTER_DAMAGE_APPLY = 'AFTER_DAMAGE_APPLY',
  
  // 技能使用后
  AFTER_SKILL = 'AFTER_SKILL',
  
  // 命中判定后
  AFTER_HIT_CHECK = 'AFTER_HIT_CHECK',
  
  // 击败对方后
  AFTER_KO = 'AFTER_KO',
  
  // 回合结束
  TURN_END = 'TURN_END',
  
  // 战斗结束
  BATTLE_END = 'BATTLE_END',
  
  // HP变化时
  ON_HP_CHANGE = 'ON_HP_CHANGE',
  
  // 受到攻击时
  ON_ATTACKED = 'ON_ATTACKED',
  
  // 攻击时
  ON_ATTACK = 'ON_ATTACK',
  
  // 击败对手时
  ON_KO = 'ON_KO',
  
  // 受到伤害时
  ON_RECEIVE_DAMAGE = 'ON_RECEIVE_DAMAGE',
  
  // 闪避时
  ON_EVADE = 'ON_EVADE',

  // 出手流程开始（每个攻击方出手前，异常扣血在此）
  ATTACK_START = 'ATTACK_START',

  // 命中时（命中判定通过后，技能效果结算前。需命中才触发）
  ON_HIT = 'ON_HIT',

  // 即时技能效果结算（命中后，伤害计算前。大部分技能副作用在此）
  SKILL_EFFECT = 'SKILL_EFFECT',

  // 出手流程结束时（单次攻击所有伤害结算完毕后）
  ATTACK_END = 'ATTACK_END',

  // 出手流程结束后（双方攻击都完成后，击杀控等）
  AFTER_ATTACK_END = 'AFTER_ATTACK_END'
}

/**
 * 效果上下文
 * 包含效果执行所需的所有信息
 */
export interface IEffectContext {
  // 战斗双方
  attacker: IBattlePet;
  defender: IBattlePet;
  
  // 技能信息
  skillId: number;
  skillType: number;      // 技能属性类型
  skillCategory: number;  // 技能类别 (1=物理, 2=特殊, 3=变化)
  skillPower: number;     // 技能威力
  
  // 伤害信息
  damage: number;         // 当前伤害值
  originalDamage: number; // 原始伤害值
  
  // 战斗状态
  turn: number;           // 当前回合数
  timing: EffectTiming;   // 当前时机
  
  // 效果参数
  effectId: number;       // 效果ID
  effectArgs: number[];   // 效果参数
  
  // 结果收集
  results: IEffectResult[];
  
  // 标志位
  isCrit: boolean;        // 是否暴击
  isMiss: boolean;        // 是否未命中
  isBlocked: boolean;     // 是否被格挡
  
  // 可修改的值
  damageMultiplier: number;  // 伤害倍率
  hitRateModifier: number;   // 命中率修正
  critRateModifier: number;  // 暴击率修正
  priorityModifier: number;  // 优先度修正
  
  // 特殊效果标志
  mustHit?: boolean;         // 必中
  alwaysFirst?: boolean;     // 先手
  instantKill?: boolean;     // 秒杀
  critRateBonus?: number;    // 暴击率加成
  
  // 扩展属性 - 用于原子效果间传递数据
  effectData?: any;          // 效果数据（用于MultiHit、RandomPower等）
  skill?: {                  // 技能对象（用于修改技能属性）
    power: number;
    accuracy: number;
    priority: number;
  };
  critRate?: number;         // 暴击率（用于CritModifier）
}

/**
 * 效果结果
 */
export interface IEffectResult {
  effectId: number;       // 效果ID
  effectName: string;     // 效果名称
  success: boolean;       // 是否成功
  target: 'attacker' | 'defender' | 'both';
  type: string;           // 效果类型
  effectType?: string;    // 效果类型别名（用于特殊效果识别）
  value?: number;         // 数值
  message: string;        // 描述信息
  data?: any;             // 额外数据
}

/**
 * 创建效果上下文
 */
export function createEffectContext(
  attacker: IBattlePet,
  defender: IBattlePet,
  skillId: number,
  damage: number = 0,
  timing: EffectTiming = EffectTiming.BEFORE_SKILL
): IEffectContext {
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
