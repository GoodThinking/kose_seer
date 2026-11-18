import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType, IStatModifierParams } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 受击提升能力参数接口
 */
export interface IOnHitStatBoostParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'on_hit_stat_boost';
    duration: number;
    stat: number;
    change: number;
    probability?: number;
    minDamage?: number;
}
/**
 * 受击提升能力原子效果
 * 在X回合内，受到任何伤害时，自身指定能力提高
 *
 * 用途：
 * - Effect_123: 受击提升能力（受到伤害时提升防御）
 *
 * 特性：
 * - 受到伤害时触发
 * - 可以提升任意能力
 * - 支持概率触发
 * - 可以设置最小伤害阈值
 *
 * @example
 * // 受到伤害时100%提升1级防御，持续5回合
 * {
 *   type: 'special',
 *   specialType: 'on_hit_stat_boost',
 *   duration: 5,
 *   stat: 1, // 防御
 *   change: 1,
 *   probability: 100
 * }
 *
 * @example
 * // 受到50点以上伤害时50%提升2级速度
 * {
 *   type: 'special',
 *   specialType: 'on_hit_stat_boost',
 *   duration: 3,
 *   stat: 4, // 速度
 *   change: 2,
 *   probability: 50,
 *   minDamage: 50
 * }
 *
 * @category Stat
 */
export declare class OnHitStatBoost extends BaseAtomicEffect {
    private params;
    private static readonly STAT_NAMES;
    constructor(params: IOnHitStatBoostParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
/**
 * 随机能力变化效果参数接口
 */
export interface IRandomStatChangeParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'random_stat_change';
    /** 目标（self=自己，opponent=对手） */
    target: 'self' | 'opponent';
    /** 变化等级（正数=提升，负数=降低） */
    change: number;
    /** 可选择的能力列表（可选，不指定则从所有能力中随机） */
    stats?: number[];
    /** 随机选择的能力数量（可选，默认1） */
    count?: number;
    /** 是否允许重复选择（可选，默认false） */
    allowDuplicate?: boolean;
    /** 触发概率（可选，默认100） */
    probability?: number;
}
/**
 * 随机能力变化效果
 *
 * 功能：
 * - 随机提升或降低目标的能力
 * - 可以指定可选择的能力列表
 * - 可以一次随机多个能力
 * - 支持触发概率
 *
 * 使用场景：
 * - 古代之力（10%概率随机提升一项能力）
 * - 银色旋风（随机提升两项能力）
 * - 疯狂（随机提升攻击或特攻，降低防御或特防）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "random_stat_change",
 *   "target": "self",
 *   "change": 1,
 *   "stats": [0, 1, 2, 3, 4],
 *   "count": 1,
 *   "allowDuplicate": false,
 *   "probability": 10
 * }
 * ```
 *
 * 能力索引：
 * - 0: 攻击
 * - 1: 防御
 * - 2: 特攻
 * - 3: 特防
 * - 4: 速度
 * - 5: 命中
 * - 6: 闪避
 */
export declare class RandomStatChange extends BaseAtomicEffect {
    private target;
    private change;
    private stats?;
    private count;
    private allowDuplicate;
    private probability;
    constructor(params: IRandomStatChangeParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    /**
     * 随机选择能力
     */
    private selectRandomStats;
    /**
     * 应用能力变化
     */
    private applyStatChange;
    /**
     * 获取能力名称
     */
    private getStatName;
}
/**
 * 能力清除参数接口
 */
export interface IStatClearParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'stat_clear';
    target: 'self' | 'opponent';
    clearType: 'debuff' | 'buff' | 'all';
}
/**
 * 能力清除原子效果
 * 清除指定目标的能力等级变化
 *
 * @example
 * // 清除自身所有能力下降
 * { type: 'special', specialType: 'stat_clear', target: 'self', clearType: 'debuff' }
 *
 * // 清除对方所有能力提升
 * { type: 'special', specialType: 'stat_clear', target: 'opponent', clearType: 'buff' }
 *
 * // 清除自身所有能力变化
 * { type: 'special', specialType: 'stat_clear', target: 'self', clearType: 'all' }
 */
export declare class StatClear extends BaseAtomicEffect {
    private params;
    constructor(params: IStatClearParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
/**
 * 能力变化原子效果
 * 修改目标的能力等级（攻击、防御、特攻、特防、速度、命中、闪避）
 *
 * 能力索引：
 * - 0: 攻击 (Attack)
 * - 1: 防御 (Defense)
 * - 2: 特攻 (Special Attack)
 * - 3: 特防 (Special Defense)
 * - 4: 速度 (Speed)
 * - 5: 命中 (Accuracy)
 * - 6: 闪避 (Evasion)
 *
 * @example
 * // 提升自身攻击1级
 * { type: 'stat_modifier', target: 'self', stat: 0, change: 1, mode: 'level' }
 *
 * // 降低对方防御2级
 * { type: 'stat_modifier', target: 'opponent', stat: 1, change: -2, mode: 'level' }
 *
 * // 降低对方命中1级
 * { type: 'stat_modifier', target: 'opponent', stat: 5, change: -1, mode: 'level' }
 *
 * // 提升自身闪避1级
 * { type: 'stat_modifier', target: 'self', stat: 6, change: 1, mode: 'level' }
 */
export declare class StatModifier extends BaseAtomicEffect {
    private params;
    private static readonly STAT_NAMES;
    constructor(params: IStatModifierParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
/**
 * 能力窃取效果参数接口
 */
export interface IStatStealParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'stat_steal';
    /** 窃取的能力 */
    stat: number;
    /** 窃取等级数 */
    levels: number;
    /** 触发概率（可选，默认100） */
    probability?: number;
}
/**
 * 能力窃取效果
 *
 * 功能：
 * - 降低对手的能力，同时提升自己的能力
 * - 支持触发概率
 * - 自动处理能力等级上下限
 *
 * 使用场景：
 * - 力量窃取（降低对手攻击，提升自己攻击）
 * - 速度窃取（降低对手速度，提升自己速度）
 * - 能力吸收（窃取对手的能力提升）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "stat_steal",
 *   "stat": 0,
 *   "levels": 1,
 *   "probability": 100
 * }
 * ```
 *
 * 与StatTransfer的区别：
 * - StatTransfer: 转移能力变化等级（复制、交换、窃取所有提升）
 * - StatSteal: 窃取指定等级（降低对手N级，提升自己N级）
 */
export declare class StatSteal extends BaseAtomicEffect {
    private stat;
    private levels;
    private probability;
    constructor(params: IStatStealParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    /**
     * 获取能力变化等级
     */
    private getStatLevel;
    /**
     * 设置能力变化等级
     */
    private setStatLevel;
    /**
     * 获取能力名称
     */
    private getStatName;
}
/**
 * 能力同步效果参数接口
 */
export interface IStatSyncParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'stat_sync';
    /** 同步模式（average=平均值，copy=复制，swap=交换） */
    mode: 'average' | 'copy' | 'swap';
    /** 同步的能力（可选，不指定则同步所有能力） */
    stats?: number[];
    /** 是否包含能力变化等级（可选，默认false） */
    includeLevels?: boolean;
}
/**
 * 能力同步效果
 *
 * 功能：
 * - 同步自己和对手的能力值
 * - 支持三种同步模式：平均值、复制、交换
 * - 可以选择同步特定能力或所有能力
 * - 可以选择是否包含能力变化等级
 *
 * 使用场景：
 * - 力量均分（将双方攻击力平均）
 * - 速度同步（将双方速度平均）
 * - 能力复制（复制对手的能力）
 * - 能力交换（交换双方的能力）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "stat_sync",
 *   "mode": "average",
 *   "stats": [0, 4],
 *   "includeLevels": false
 * }
 * ```
 *
 * 能力索引：
 * - 0: 攻击
 * - 1: 防御
 * - 2: 特攻
 * - 3: 特防
 * - 4: 速度
 */
export declare class StatSync extends BaseAtomicEffect {
    private mode;
    private stats?;
    private includeLevels;
    constructor(params: IStatSyncParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    /**
     * 获取能力值
     */
    private getStat;
    /**
     * 设置能力值
     */
    private setStat;
    /**
     * 获取能力变化等级
     */
    private getStatLevel;
    /**
     * 设置能力变化等级
     */
    private setStatLevel;
    /**
     * 获取能力名称
     */
    private getStatName;
}
/**
 * 能力转移效果参数接口
 */
export interface IStatTransferParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'stat_transfer';
    /** 转移的能力列表（可选，不指定则转移所有能力变化） */
    stats?: number[];
    /** 转移模式（copy=复制，swap=交换，steal=窃取） */
    mode: 'copy' | 'swap' | 'steal';
}
/**
 * 能力转移效果
 *
 * 功能：
 * - 转移能力变化等级
 * - 支持复制、交换、窃取三种模式
 * - 可选择转移特定能力或所有能力
 *
 * 使用场景：
 * - 能力复制（复制对手的能力变化）
 * - 能力交换（交换双方的能力变化）
 * - 能力窃取（窃取对手的能力提升，清除对手的能力变化）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "stat_transfer",
 *   "stats": [0, 2, 4],
 *   "mode": "steal"
 * }
 * ```
 *
 * 模式说明：
 * - copy: 复制对手的能力变化到自己（对手保持不变）
 * - swap: 交换双方的能力变化
 * - steal: 窃取对手的能力提升（仅正值），清除对手的能力变化
 */
export declare class StatTransfer extends BaseAtomicEffect {
    private stats?;
    private mode;
    constructor(params: IStatTransferParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    /**
     * 获取能力变化等级
     */
    private getStatLevel;
    /**
     * 设置能力变化等级
     */
    private setStatLevel;
    /**
     * 获取能力名称
     */
    private getStatName;
}
//# sourceMappingURL=StatEffects.d.ts.map