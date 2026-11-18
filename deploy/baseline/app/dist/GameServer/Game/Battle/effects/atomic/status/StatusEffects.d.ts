import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType, IStatusInflictorParams } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 封技效果参数接口
 */
export interface IDisableSkillParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'disable_skill';
    duration: number;
    disableType?: 'last' | 'all' | 'specific';
    skillId?: number;
    probability?: number;
}
/**
 * 封技原子效果
 * 使对方下X个回合无法使用技能
 *
 * 用途：
 * - Effect_52: 先手封技（封印对方上次使用的技能）
 *
 * 特性：
 * - 可以封印上次使用的技能
 * - 可以封印所有技能
 * - 可以封印指定技能
 * - 支持概率触发
 *
 * @example
 * // 封印对方上次使用的技能，持续3回合
 * {
 *   type: 'special',
 *   specialType: 'disable_skill',
 *   duration: 3,
 *   disableType: 'last'
 * }
 *
 * @example
 * // 50%概率封印所有技能，持续2回合
 * {
 *   type: 'special',
 *   specialType: 'disable_skill',
 *   duration: 2,
 *   disableType: 'all',
 *   probability: 50
 * }
 *
 * @category Status
 */
export declare class DisableSkill extends BaseAtomicEffect {
    private params;
    constructor(params: IDisableSkillParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
/**
 * 攻击附带状态效果参数接口
 */
export interface IOnDamageStatusParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'on_damage_status';
    /** 施加的状态ID */
    status: number;
    /** 触发概率（0-100） */
    probability: number;
    /** 状态持续回合数（可选） */
    duration?: number;
    /** 是否仅在造成伤害时触发（可选，默认true） */
    onlyOnDamage?: boolean;
    /** 最小伤害阈值（可选，低于此伤害不触发） */
    minDamageThreshold?: number;
    /** 是否仅对特定技能类别生效（可选：physical/special/status） */
    skillCategory?: 'physical' | 'special' | 'status';
}
/**
 * 攻击附带状态效果
 *
 * 功能：
 * - 攻击对手时有概率施加异常状态
 * - 可以设置触发概率和状态持续时间
 * - 支持最小伤害阈值（低于阈值不触发）
 * - 可以限制特定技能类别才能触发
 *
 * 使用场景：
 * - 火焰拳（攻击时10%概率灼伤）
 * - 雷电拳（攻击时10%概率麻痹）
 * - 冰冻拳（攻击时10%概率冰冻）
 * - 毒针（攻击时30%概率中毒）
 * - 舌舔（攻击时30%概率麻痹）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "on_damage_status",
 *   "status": 4,
 *   "probability": 10,
 *   "duration": 3,
 *   "onlyOnDamage": true,
 *   "minDamageThreshold": 1,
 *   "skillCategory": "physical"
 * }
 * ```
 *
 * 与StatusInflictor的区别：
 * - StatusInflictor: 必定施加状态（或固定概率）
 * - OnDamageStatus: 攻击附带状态，通常概率较低，需要造成伤害
 *
 * 与OnHitStatus的区别：
 * - OnHitStatus: 被动触发（受击时）
 * - OnDamageStatus: 主动触发（攻击时）
 */
export declare class OnDamageStatus extends BaseAtomicEffect {
    private status;
    private probability;
    private duration?;
    private onlyOnDamage;
    private minDamageThreshold;
    private skillCategory?;
    constructor(params: IOnDamageStatusParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    /**
     * 检查目标是否已有指定状态
     */
    private hasStatus;
    /**
     * 施加状态
     */
    private applyStatus;
    /**
     * 获取状态名称
     */
    private getStatusName;
    /**
     * 将 OnDamageStatus 的状态编号转换为 BattleStatusType 索引
     */
    private convertStatusIndex;
    /**
     * 获取技能类别数值
     */
    private getSkillCategoryValue;
}
/**
 * 受击状态效果参数接口
 */
export interface IOnHitStatusParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'on_hit_status';
    /** 施加的状态ID */
    status: number;
    /** 触发概率（0-100） */
    probability: number;
    /** 状态持续回合数（可选） */
    duration?: number;
    /** 是否对攻击者施加（true=攻击者，false=自己） */
    toAttacker?: boolean;
    /** 是否仅在受到伤害时触发（可选，默认true） */
    onlyOnDamage?: boolean;
    /** 最小伤害阈值（可选，低于此伤害不触发） */
    minDamageThreshold?: number;
}
/**
 * 受击状态效果
 *
 * 功能：
 * - 受到攻击时有概率对攻击者或自己施加异常状态
 * - 可以设置触发概率和状态持续时间
 * - 支持最小伤害阈值（低于阈值不触发）
 * - 可选择是否仅在受到伤害时触发
 *
 * 使用场景：
 * - 静电（受到接触攻击时30%概率麻痹对手）
 * - 火焰之躯（受到接触攻击时30%概率灼伤对手）
 * - 毒刺（受到接触攻击时30%概率中毒对手）
 * - 诅咒之躯（受到攻击时有概率封印对手技能）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "on_hit_status",
 *   "status": 2,
 *   "probability": 30,
 *   "duration": 3,
 *   "toAttacker": true,
 *   "onlyOnDamage": true,
 *   "minDamageThreshold": 1
 * }
 * ```
 *
 * 与StatusInflictor的区别：
 * - StatusInflictor: 主动施加状态（攻击时）
 * - OnHitStatus: 被动触发状态（受击时）
 */
export declare class OnHitStatus extends BaseAtomicEffect {
    private status;
    private probability;
    private duration?;
    private toAttacker;
    private onlyOnDamage;
    private minDamageThreshold;
    constructor(params: IOnHitStatusParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    /**
     * 检查目标是否已有指定状态
     */
    private hasStatus;
    /**
     * 施加状态
     */
    private applyStatus;
    /**
     * 获取状态名称
     */
    private getStatusName;
    /**
     * 将 OnHitStatus 的状态编号转换为 BattleStatusType 索引
     * OnHitStatus: 1=中毒 2=麻痹 3=冰冻 4=灼伤 5=睡眠 6=混乱 7=害怕 8=封印
     * BattleStatusType: 0=麻痹 1=中毒 2=烧伤 5=冻伤 6=害怕 8=睡眠 10=混乱
     */
    private convertStatusIndex;
}
/**
 * 随机异常状态参数接口
 */
export interface IRandomStatusParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'random_status';
    target: 'self' | 'opponent';
    statusList: number[];
    probability?: number;
    duration?: number;
    weights?: number[];
}
/**
 * 随机异常状态原子效果
 * 从指定状态列表中随机施加一个
 *
 * 用途：
 * - Effect_74: 随机异常状态（麻痹/中毒/烧伤）
 * - Effect_75: 随机异常状态（冰冻/睡眠/害怕）
 *
 * 特性：
 * - 从列表中随机选择一个状态
 * - 支持权重分配
 * - 支持概率触发
 * - 可以指定状态持续时间
 *
 * @example
 * // 随机施加麻痹、中毒或烧伤
 * {
 *   type: 'special',
 *   specialType: 'random_status',
 *   target: 'opponent',
 *   statusList: [2, 3, 4], // 麻痹、中毒、烧伤
 *   probability: 30
 * }
 *
 * @example
 * // 带权重的随机状态（冰冻50%，睡眠30%，害怕20%）
 * {
 *   type: 'special',
 *   specialType: 'random_status',
 *   target: 'opponent',
 *   statusList: [5, 6, 7],
 *   weights: [50, 30, 20],
 *   probability: 50
 * }
 *
 * @category Status
 */
export declare class RandomStatus extends BaseAtomicEffect {
    private params;
    private static readonly STATUS_NAMES;
    constructor(params: IRandomStatusParams);
    execute(context: IEffectContext): IEffectResult[];
    /**
     * 根据权重随机选择一个状态
     */
    private selectRandomStatus;
    validate(params: any): boolean;
}
/**
 * 状态施加原子效果
 * 给目标施加异常状态（中毒、麻痹、烧伤等）
 *
 * 状态类型：
 * - 0: 麻痹
 * - 1: 中毒
 * - 2: 烧伤
 * - 3: 冻结
 * - 4: 睡眠
 * - 5: 冻伤
 * - 6: 害怕
 * - 7: 混乱
 * - 8: 深度睡眠
 * - 9: 束缚
 * - 10: 疲惫
 *
 * @example
 * // 100%概率麻痹对方
 * { type: 'status_inflictor', target: 'opponent', status: 0, probability: 100 }
 *
 * // 30%概率中毒对方
 * { type: 'status_inflictor', target: 'opponent', status: 1, probability: 30 }
 *
 * // 烧伤对方，持续3回合
 * { type: 'status_inflictor', target: 'opponent', status: 2, duration: 3 }
 */
export declare class StatusInflictor extends BaseAtomicEffect {
    private params;
    private static readonly STATUS_NAMES;
    constructor(params: IStatusInflictorParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
/**
 * 状态同步效果参数接口
 */
export interface IStatusSyncParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'status_sync';
    /** 同步模式：copy=复制, swap=交换, transfer=转移 */
    mode: 'copy' | 'swap' | 'transfer';
    /** 同步方向：to_opponent=给对手, from_opponent=从对手 */
    direction?: 'to_opponent' | 'from_opponent';
}
/**
 * 状态同步效果
 *
 * 功能：
 * - 同步异常状态
 * - 支持复制、交换、转移三种模式
 * - 可指定同步方向
 * - 状态包括：麻痹、中毒、烧伤、冻伤、睡眠、混乱、害怕、疲惫
 *
 * 使用场景：
 * - 状态复制（复制对手的异常状态到自己）
 * - 状态交换（交换双方的异常状态）
 * - 状态转移（将自己的异常状态转移给对手）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "status",
 *   "mode": "copy",
 *   "direction": "from_opponent"
 * }
 * ```
 *
 * 模式说明：
 * - copy: 复制状态（源保持不变，目标获得相同状态）
 * - swap: 交换状态（双方状态互换）
 * - transfer: 转移状态（源状态清除，目标获得状态）
 *
 * 与StatSync的区别：
 * - StatSync: 同步能力变化等级
 * - StatusSync: 同步异常状态
 */
export declare class StatusSync extends BaseAtomicEffect {
    private mode;
    private direction;
    constructor(params: IStatusSyncParams);
    execute(context: IEffectContext): IEffectResult[];
    /**
     * 复制状态
     */
    private copyStatus;
    /**
     * 交换状态
     */
    private swapStatus;
    /**
     * 转移状态
     */
    private transferStatus;
    /**
     * 获取状态名称
     */
    private getStatusName;
    validate(params: any): boolean;
}
//# sourceMappingURL=StatusEffects.d.ts.map