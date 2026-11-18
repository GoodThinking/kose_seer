"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusSync = exports.StatusInflictor = exports.RandomStatus = exports.OnHitStatus = exports.OnDamageStatus = exports.DisableSkill = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const IAtomicEffect_1 = require("../core/IAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
const BattleModel_1 = require("../../../../../../shared/models/BattleModel");
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
class DisableSkill extends BaseAtomicEffect_1.BaseAtomicEffect {
    params;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'Disable Skill', [EffectContext_1.EffectTiming.AFTER_SKILL]);
        this.params = params;
    }
    execute(context) {
        const results = [];
        const defender = context.defender;
        // 检查概率
        const probability = this.params.probability || 100;
        if (!this.checkProbability(probability)) {
            results.push(this.createResult(false, 'defender', 'disable_skill_failed', `封技失败（概率${probability}%）`, 0));
            return results;
        }
        // 根据封技类型处理
        let disabledSkillId = null;
        let disableMessage = '';
        switch (this.params.disableType) {
            case 'last':
                // 封印上次使用的技能
                if (defender.lastMove) {
                    disabledSkillId = defender.lastMove;
                    disableMessage = `上次使用的技能被封印${this.params.duration}回合`;
                }
                else {
                    results.push(this.createResult(false, 'defender', 'disable_skill_no_last', '没有上次使用的技能', 0));
                    return results;
                }
                break;
            case 'all':
                // 封印所有技能
                disableMessage = `所有技能被封印${this.params.duration}回合`;
                break;
            case 'specific':
                // 封印指定技能
                if (this.params.skillId) {
                    disabledSkillId = this.params.skillId;
                    disableMessage = `技能${this.params.skillId}被封印${this.params.duration}回合`;
                }
                break;
            default:
                // 默认封印上次使用的技能
                if (defender.lastMove) {
                    disabledSkillId = defender.lastMove;
                    disableMessage = `上次使用的技能被封印${this.params.duration}回合`;
                }
                break;
        }
        // 应用封技效果
        if (disabledSkillId !== null || this.params.disableType === 'all') {
            // 设置encore状态（克制/封技状态）
            defender.encore = true;
            defender.encoreTurns = this.params.duration;
            // 存储被封印的技能ID到effectCounters
            if (!defender.effectCounters) {
                defender.effectCounters = {};
            }
            defender.effectCounters['disabledSkill'] = disabledSkillId || -1; // -1表示全部
            results.push(this.createResult(true, 'defender', 'disable_skill', disableMessage, this.params.duration, { disabledSkillId, duration: this.params.duration }));
            this.log(`封技成功: ${disableMessage}`);
        }
        return results;
    }
    validate(params) {
        return params &&
            params.type === IAtomicEffect_1.AtomicEffectType.SPECIAL &&
            params.specialType === 'disable_skill' &&
            typeof params.duration === 'number' &&
            params.duration > 0;
    }
}
exports.DisableSkill = DisableSkill;
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
class OnDamageStatus extends BaseAtomicEffect_1.BaseAtomicEffect {
    status;
    probability;
    duration;
    onlyOnDamage;
    minDamageThreshold;
    skillCategory;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'OnDamageStatus', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY, EffectContext_1.EffectTiming.ON_ATTACKED]);
        this.status = params.status;
        this.probability = params.probability;
        this.duration = params.duration;
        this.onlyOnDamage = params.onlyOnDamage ?? true;
        this.minDamageThreshold = params.minDamageThreshold ?? 1;
        this.skillCategory = params.skillCategory;
    }
    execute(context) {
        const results = [];
        // 检查技能类别
        if (this.skillCategory && context.skillCategory) {
            if (context.skillCategory !== this.getSkillCategoryValue(this.skillCategory)) {
                results.push(this.createResult(false, 'both', 'on_damage_status', `技能类别不匹配，未触发状态`, 0));
                return results;
            }
        }
        // 检查是否需要伤害触发
        if (this.onlyOnDamage) {
            const damage = context.damage ?? 0;
            if (damage < this.minDamageThreshold) {
                results.push(this.createResult(false, 'both', 'on_damage_status', `伤害不足，未触发状态`, 0));
                return results;
            }
        }
        // 概率判断
        if (!this.checkProbability(this.probability)) {
            results.push(this.createResult(false, 'both', 'on_damage_status', `攻击附带状态未触发`, 0));
            return results;
        }
        // 目标是防御方
        const target = this.getDefender(context);
        // 检查目标是否已有该状态
        if (this.hasStatus(target, this.status)) {
            results.push(this.createResult(false, 'defender', 'on_damage_status', `对手已经处于该状态`, 0));
            return results;
        }
        // 施加状态
        this.applyStatus(target, this.status, this.duration);
        results.push(this.createResult(true, 'defender', 'on_damage_status', `对手陷入了${this.getStatusName(this.status)}状态！`, this.status, {
            status: this.status,
            duration: this.duration,
            probability: this.probability,
            damage: context.damage
        }));
        this.log(`攻击附带状态: 对手陷入${this.getStatusName(this.status)}` +
            `(概率${this.probability}%, 伤害${context.damage ?? 0}, 持续${this.duration ?? '永久'}回合)`);
        return results;
    }
    validate(params) {
        if (params.status === undefined || params.status < 0) {
            this.log('status必须是有效的状态ID', 'error');
            return false;
        }
        if (params.probability === undefined || params.probability < 0 || params.probability > 100) {
            this.log('probability必须在0-100之间', 'error');
            return false;
        }
        if (params.skillCategory && !['physical', 'special', 'status'].includes(params.skillCategory)) {
            this.log('skillCategory必须是physical、special或status', 'error');
            return false;
        }
        return true;
    }
    /**
     * 检查目标是否已有指定状态
     */
    hasStatus(pet, status) {
        if (!pet.status && !pet.battleStatus)
            return false;
        const currentStatus = pet.status ?? pet.battleStatus;
        return currentStatus === status;
    }
    /**
     * 施加状态
     */
    applyStatus(pet, status, duration) {
        // 转换状态编号为 BattleStatusType 索引
        const convertedStatus = this.convertStatusIndex(status);
        if (__ubBlocked(pet, convertedStatus)) return;
        if (pet.status !== undefined) {
            pet.status = convertedStatus;
        }
        if (pet.battleStatus !== undefined) {
            pet.battleStatus = convertedStatus;
        }
        // 设置状态持续时间（使用转换后的索引）
        if (duration !== undefined) {
            if (!pet.statusDurations) {
                pet.statusDurations = {};
            }
            pet.statusDurations[convertedStatus] = duration;
        }
    }
    /**
     * 获取状态名称
     */
    getStatusName(status) {
        const statusNames = {
            1: '中毒', 2: '麻痹', 3: '冰冻', 4: '灼伤', 5: '睡眠', 6: '混乱', 7: '害怕', 8: '封印'
        };
        return statusNames[status] ?? `状态${status}`;
    }
    /**
     * 将 OnDamageStatus 的状态编号转换为 BattleStatusType 索引
     */
    convertStatusIndex(status) {
        const mapping = {
            1: 1, 2: 0, 3: 5, 4: 2, 5: 8, 6: 10, 7: 6, 8: 9
        };
        return mapping[status] ?? status;
    }
    /**
     * 获取技能类别数值
     */
    getSkillCategoryValue(category) {
        const categoryMap = {
            'physical': 1,
            'special': 2,
            'status': 3
        };
        return categoryMap[category] ?? 1;
    }
}
exports.OnDamageStatus = OnDamageStatus;
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
class OnHitStatus extends BaseAtomicEffect_1.BaseAtomicEffect {
    status;
    probability;
    duration;
    toAttacker;
    onlyOnDamage;
    minDamageThreshold;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'OnHitStatus', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY, EffectContext_1.EffectTiming.ON_ATTACKED]);
        this.status = params.status;
        this.probability = params.probability;
        this.duration = params.duration;
        this.toAttacker = params.toAttacker ?? true;
        this.onlyOnDamage = params.onlyOnDamage ?? true;
        this.minDamageThreshold = params.minDamageThreshold ?? 1;
    }
    execute(context) {
        const results = [];
        // 检查是否需要伤害触发
        if (this.onlyOnDamage) {
            const damage = context.damage ?? 0;
            if (damage < this.minDamageThreshold) {
                results.push(this.createResult(false, 'both', 'on_hit_status', `伤害不足，未触发状态`, 0));
                return results;
            }
        }
        // 概率判断
        if (!this.checkProbability(this.probability)) {
            results.push(this.createResult(false, 'both', 'on_hit_status', `受击状态未触发`, 0));
            return results;
        }
        // 确定目标
        const target = this.toAttacker ? this.getAttacker(context) : this.getDefender(context);
        const targetName = this.toAttacker ? '攻击方' : '防御方';
        // 检查目标是否已有该状态
        if (this.hasStatus(target, this.status)) {
            results.push(this.createResult(false, this.toAttacker ? 'attacker' : 'defender', 'on_hit_status', `${targetName}已经处于该状态`, 0));
            return results;
        }
        // 施加状态
        this.applyStatus(target, this.status, this.duration);
        results.push(this.createResult(true, this.toAttacker ? 'attacker' : 'defender', 'on_hit_status', `${targetName}陷入了${this.getStatusName(this.status)}状态！`, this.status, {
            status: this.status,
            duration: this.duration,
            probability: this.probability
        }));
        this.log(`受击触发状态: ${targetName}陷入${this.getStatusName(this.status)}` +
            `(概率${this.probability}%, 持续${this.duration ?? '永久'}回合)`);
        return results;
    }
    validate(params) {
        if (params.status === undefined || params.status < 0) {
            this.log('status必须是有效的状态ID', 'error');
            return false;
        }
        if (params.probability === undefined || params.probability < 0 || params.probability > 100) {
            this.log('probability必须在0-100之间', 'error');
            return false;
        }
        return true;
    }
    /**
     * 检查目标是否已有指定状态
     */
    hasStatus(pet, status) {
        if (!pet.status && !pet.battleStatus)
            return false;
        const currentStatus = pet.status ?? pet.battleStatus;
        return currentStatus === status;
    }
    /**
     * 施加状态
     */
    applyStatus(pet, status, duration) {
        // 转换状态编号为 BattleStatusType 索引
        const convertedStatus = this.convertStatusIndex(status);
        if (__ubBlocked(pet, convertedStatus)) return;
        if (pet.status !== undefined) {
            pet.status = convertedStatus;
        }
        if (pet.battleStatus !== undefined) {
            pet.battleStatus = convertedStatus;
        }
        // 设置状态持续时间（使用转换后的索引）
        if (duration !== undefined) {
            if (!pet.statusDurations) {
                pet.statusDurations = {};
            }
            pet.statusDurations[convertedStatus] = duration;
        }
    }
    /**
     * 获取状态名称
     */
    getStatusName(status) {
        const statusNames = {
            1: '中毒', 2: '麻痹', 3: '冰冻', 4: '灼伤', 5: '睡眠', 6: '混乱', 7: '害怕', 8: '封印'
        };
        return statusNames[status] ?? `状态${status}`;
    }
    /**
     * 将 OnHitStatus 的状态编号转换为 BattleStatusType 索引
     * OnHitStatus: 1=中毒 2=麻痹 3=冰冻 4=灼伤 5=睡眠 6=混乱 7=害怕 8=封印
     * BattleStatusType: 0=麻痹 1=中毒 2=烧伤 5=冻伤 6=害怕 8=睡眠 10=混乱
     */
    convertStatusIndex(status) {
        const mapping = {
            1: 1, // 中毒 -> 1
            2: 0, // 麻痹 -> 0
            3: 5, // 冰冻 -> 5 (冻伤)
            4: 2, // 灼伤 -> 2 (烧伤)
            5: 8, // 睡眠 -> 8
            6: 10, // 混乱 -> 10
            7: 6, // 害怕 -> 6
            8: 9 // 封印 -> 9 (石化)
        };
        return mapping[status] ?? status;
    }
}
exports.OnHitStatus = OnHitStatus;
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
class RandomStatus extends BaseAtomicEffect_1.BaseAtomicEffect {
    params;
    // 状态名称映射
    static STATUS_NAMES = {
        0: '正常',
        1: '濒死',
        2: '麻痹',
        3: '中毒',
        4: '烧伤',
        5: '冰冻',
        6: '睡眠',
        7: '害怕',
        8: '混乱',
        9: '虚弱',
        10: '石化',
        11: '寄生',
        12: '烧伤（强化）',
        13: '中毒（剧毒）',
        14: '能力封印',
        15: '疲劳',
        16: '束缚',
        17: '畏缩',
        18: '诅咒',
        19: '衰弱'
    };
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'Random Status', [EffectContext_1.EffectTiming.AFTER_SKILL]);
        this.params = params;
    }
    execute(context) {
        const results = [];
        const target = this.getTarget(context, this.params.target);
        if (!target) {
            this.log('目标不存在', 'warn');
            return results;
        }
        // 检查概率
        const probability = this.params.probability || 100;
        if (!this.checkProbability(probability)) {
            results.push(this.createResult(false, this.params.target === 'self' ? 'attacker' : 'defender', 'random_status_failed', `随机状态触发失败（概率${probability}%）`, 0));
            return results;
        }
        // 检查目标是否已有异常状态
        if (target.status && target.status !== BattleModel_1.BattleStatus.NONE && target.status >= 0) {
            this.log(`目标已有异常状态${target.status}，无法施加新状态`, 'debug');
            results.push(this.createResult(false, this.params.target === 'self' ? 'attacker' : 'defender', 'random_status_blocked', '目标已有异常状态', 0));
            return results;
        }
        // 随机选择一个状态
        const selectedStatus = this.selectRandomStatus();
        // 施加状态
        if (__ubBlocked(target, selectedStatus, context.attacker)) return results;
        target.status = selectedStatus;
        if (this.params.duration) {
            target.statusTurns = this.params.duration;
        }
        const statusName = RandomStatus.STATUS_NAMES[selectedStatus] || `状态${selectedStatus}`;
        const targetName = this.params.target === 'self' ? 'attacker' : 'defender';
        results.push(this.createResult(true, targetName, 'random_status', `随机施加${statusName}状态`, selectedStatus, { status: selectedStatus, statusName, duration: this.params.duration }));
        this.log(`随机状态: 施加${statusName}（${selectedStatus}）`);
        return results;
    }
    /**
     * 根据权重随机选择一个状态
     */
    selectRandomStatus() {
        const statusList = this.params.statusList;
        const weights = this.params.weights;
        // 如果没有权重，均匀随机
        if (!weights || weights.length !== statusList.length) {
            const randomIndex = Math.floor(Math.random() * statusList.length);
            return statusList[randomIndex];
        }
        // 根据权重随机
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;
        for (let i = 0; i < statusList.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return statusList[i];
            }
        }
        // 兜底返回第一个
        return statusList[0];
    }
    validate(params) {
        return params &&
            params.type === IAtomicEffect_1.AtomicEffectType.SPECIAL &&
            params.specialType === 'random_status' &&
            ['self', 'opponent'].includes(params.target) &&
            Array.isArray(params.statusList) &&
            params.statusList.length > 0;
    }
}
exports.RandomStatus = RandomStatus;
// ============================================================================
// StatusInflictor
// ============================================================================
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
class StatusInflictor extends BaseAtomicEffect_1.BaseAtomicEffect {
    params;
    // 状态名称映射
    static STATUS_NAMES = {
        0: '麻痹', 1: '中毒', 2: '烧伤', 3: '冻结', 4: '睡眠',
        5: '冻伤', 6: '害怕', 7: '混乱', 8: '深度睡眠', 9: '束缚', 10: '疲惫'
    };
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.STATUS_INFLICTOR, 'Status Inflictor', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY, EffectContext_1.EffectTiming.AFTER_SKILL]);
        this.params = params;
    }
    execute(context) {
        const results = [];
        const target = this.getTarget(context, this.params.target);
        if (!target) {
            this.log('目标不存在', 'warn');
            return results;
        }
        if (require("../../../BossSpecialRules").BossSpecialRules.IsStatusImmune(target, this.params.status, context.skillId)) {
            this.log(`目标免疫异常状态${this.params.status}`, 'info');
            results.push(this.createResult(false, this.params.target === 'self' ? 'attacker' : 'defender', 'status', '目标免疫异常状态', 0));
            return results;
        }
        // 检查概率
        const probability = this.params.probability !== undefined ? this.params.probability : 100;
        if (!this.checkProbability(probability)) {
            this.log(`概率判定失败（${probability}%）`, 'debug');
            return results;
        }
        // 检查目标是否已有异常状态（-1和0都表示无状态）
        if (target.status !== undefined && target.status > 0) {
            this.log(`目标已有异常状态${target.status}，无法施加新状态`, 'debug');
            results.push(this.createResult(false, this.params.target === 'self' ? 'attacker' : 'defender', 'status', // 使用 'status' 类型
            '目标已有异常状态', 0));
            return results;
        }
        // 施加异常状态
        if (__ubBlocked(target, this.params.status, context.attacker)) return results;
        target.status = this.params.status;
        if (this.params.duration) {
            // 持续伤害类状态（中毒、烧伤、冻伤、流血）需要+1回合
            // 因为伤害在下一回合开始时才扣除，导致实际少一回合
            const damageStatuses = [1, 2, 5, 11]; // 中毒、烧伤、冻伤、流血
            const actualDuration = damageStatuses.includes(this.params.status)
                ? this.params.duration + 1
                : this.params.duration;
            target.statusTurns = actualDuration;
        }
        // Proxy 会自动同步 statusArray 和 statusDurations
        const statusName = StatusInflictor.STATUS_NAMES[this.params.status] || `状态${this.params.status}`;
        const targetName = this.params.target === 'self' ? 'attacker' : 'defender';
        results.push(this.createResult(true, targetName, 'status', // 使用 'status' 类型，与 ApplyEffectResults 匹配
        `施加${statusName}状态`, this.params.status, {
            status: this.params.status,
            duration: this.params.duration || 3,
            statusName: statusName
        }));
        this.log(`施加${statusName}状态（概率${probability}%）`);
        return results;
    }
    validate(params) {
        if (!params || params.type !== IAtomicEffect_1.AtomicEffectType.STATUS_INFLICTOR) {
            return false;
        }
        if (!['self', 'opponent'].includes(params.target)) {
            this.log(`无效的目标: ${params.target}`, 'error');
            return false;
        }
        if (typeof params.status !== 'number') {
            this.log(`无效的状态类型: ${params.status}`, 'error');
            return false;
        }
        if (params.probability !== undefined &&
            (typeof params.probability !== 'number' || params.probability < 0 || params.probability > 100)) {
            this.log(`无效的概率: ${params.probability}`, 'error');
            return false;
        }
        return true;
    }
}
exports.StatusInflictor = StatusInflictor;
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
class StatusSync extends BaseAtomicEffect_1.BaseAtomicEffect {
    mode;
    direction;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'StatusSync', [EffectContext_1.EffectTiming.AFTER_SKILL]);
        this.mode = params.mode;
        this.direction = params.direction ?? 'to_opponent';
    }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const defender = this.getDefender(context);
        if (!attacker || !defender) {
            this.log('状态同步效果：攻击者或防御者不存在', 'warn');
            return results;
        }
        switch (this.mode) {
            case 'copy':
                this.copyStatus(attacker, defender, results);
                break;
            case 'swap':
                this.swapStatus(attacker, defender, results);
                break;
            case 'transfer':
                this.transferStatus(attacker, defender, results);
                break;
        }
        return results;
    }
    /**
     * 复制状态
     */
    copyStatus(attacker, defender, results) {
        const source = this.direction === 'from_opponent' ? defender : attacker;
        const target = this.direction === 'from_opponent' ? attacker : defender;
        if (source.status !== undefined && source.status !== null) {
            if (__ubBlocked(target, source.status, source)) return;
            target.status = source.status;
            target.statusTurns = source.statusTurns || 0;
            const statusName = this.getStatusName(source.status);
            results.push(this.createResult(true, this.direction === 'from_opponent' ? 'attacker' : 'defender', 'status_sync', `复制${statusName}状态`, source.status, { mode: 'copy', direction: this.direction }));
            this.log(`状态同步效果：复制${statusName}状态`);
        }
        else {
            this.log('状态同步效果：源没有异常状态', 'warn');
        }
    }
    /**
     * 交换状态
     */
    swapStatus(attacker, defender, results) {
        const attackerStatus = attacker.status;
        const attackerStatusTurns = attacker.statusTurns || 0;
        const defenderStatus = defender.status;
        const defenderStatusTurns = defender.statusTurns || 0;
        // 交换状态
        if (__ubBlocked(attacker, defenderStatus, defender) || __ubBlocked(defender, attackerStatus, attacker)) return;
        attacker.status = defenderStatus;
        attacker.statusTurns = defenderStatusTurns;
        defender.status = attackerStatus;
        defender.statusTurns = attackerStatusTurns;
        const attackerStatusName = this.getStatusName(attackerStatus);
        const defenderStatusName = this.getStatusName(defenderStatus);
        results.push(this.createResult(true, 'both', 'status_sync', `交换异常状态`, 0, {
            mode: 'swap',
            attackerOldStatus: attackerStatusName,
            attackerNewStatus: defenderStatusName,
            defenderOldStatus: defenderStatusName,
            defenderNewStatus: attackerStatusName
        }));
        this.log(`状态同步效果：交换异常状态（${attackerStatusName} ↔ ${defenderStatusName}）`);
    }
    /**
     * 转移状态
     */
    transferStatus(attacker, defender, results) {
        const source = this.direction === 'to_opponent' ? attacker : defender;
        const target = this.direction === 'to_opponent' ? defender : attacker;
        if (source.status !== undefined && source.status !== null) {
            const statusName = this.getStatusName(source.status);
            // 转移状态
            if (__ubBlocked(target, source.status, source)) return;
            target.status = source.status;
            target.statusTurns = source.statusTurns || 0;
            // 清除源的状态
            source.status = undefined;
            source.statusTurns = 0;
            results.push(this.createResult(true, 'both', 'status_sync', `转移${statusName}状态`, source.status, { mode: 'transfer', direction: this.direction }));
            this.log(`状态同步效果：转移${statusName}状态`);
        }
        else {
            this.log('状态同步效果：源没有异常状态', 'warn');
        }
    }
    /**
     * 获取状态名称
     */
    getStatusName(statusId) {
        if (statusId === undefined || statusId === null) {
            return '无';
        }
        const statusNames = ['麻痹', '中毒', '烧伤', '冻伤', '睡眠', '混乱', '害怕', '疲惫'];
        return statusNames[statusId] || '未知';
    }
    validate(params) {
        if (!params.mode || !['copy', 'swap', 'transfer'].includes(params.mode)) {
            this.log('状态同步效果：mode必须是copy、swap或transfer', 'error');
            return false;
        }
        if (params.direction && !['to_opponent', 'from_opponent'].includes(params.direction)) {
            this.log('状态同步效果：direction必须是to_opponent或from_opponent', 'error');
            return false;
        }
        return true;
    }
}
exports.StatusSync = StatusSync;
//# sourceMappingURL=StatusEffects.js.map
const __universeBudget = require('../../../UniverseBossBudget');
function __ubHeal(pet, amount, source, active = false) {
    const b = __universeBudget.battleFor(pet);
    if (b) return __universeBudget.heal(b, pet, amount, {active, source});
    const old = pet.hp;
    pet.hp = Math.min(pet.maxHp, pet.hp + amount);
    return pet.hp - old;
}
function __ubDamage(source, pet, amount, kind) {
    const b = __universeBudget.battleFor(pet);
    const actual = Math.min(pet.hp, __universeBudget.damage(b, source, pet, kind, amount));
    pet.hp = Math.max(0, pet.hp - actual);
    return actual;
}
function __ubReflect(attacker, defender, amount, source) {
    const b = __universeBudget.battleFor(defender) || __universeBudget.battleFor(attacker);
    if (b) return __universeBudget.reflect(b, attacker, defender, amount, source);
    const actual = Math.min(attacker.hp, amount);
    attacker.hp = Math.max(0, attacker.hp - actual);
    return actual;
}
function __ubBlocked(target, status, source) {
    const b = __universeBudget.battleFor(target);
    if (!b || target !== b.enemy) return false;
    source = source || b.universeBudgetState?.actor;
    if (source === target && status === 7) b.universeBudgetState.selfFatigue = true;
    return source !== target && [0, 6, 7, 8, 9, 15].includes(status) && __universeBudget.controlResistant(b);
}
function __ubFatal(target) {
    const b = __universeBudget.battleFor(target);
    return !!(b && target === b.enemy);
}
