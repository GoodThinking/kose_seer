"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatTransfer = exports.StatSync = exports.StatSteal = exports.StatModifier = exports.StatClear = exports.RandomStatChange = exports.OnHitStatBoost = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const IAtomicEffect_1 = require("../core/IAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
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
class OnHitStatBoost extends BaseAtomicEffect_1.BaseAtomicEffect {
    params;
    // 能力名称映射
    static STAT_NAMES = [
        '攻击', '防御', '特攻', '特防', '速度', '命中'
    ];
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'On Hit Stat Boost', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
        this.params = params;
    }
    execute(context) {
        const results = [];
        const defender = context.defender;
        const damage = context.damage;
        // 检查是否受到伤害
        if (damage <= 0) {
            return results;
        }
        // 检查最小伤害阈值
        if (this.params.minDamage && damage < this.params.minDamage) {
            return results;
        }
        // 检查概率
        const probability = this.params.probability || 100;
        if (!this.checkProbability(probability)) {
            results.push(this.createResult(false, 'defender', 'on_hit_stat_boost_failed', `受击提升触发失败（概率${probability}%）`, 0));
            return results;
        }
        // 初始化能力变化数组
        if (!defender.battleLevels) {
            defender.battleLevels = [0, 0, 0, 0, 0, 0];
        }
        const statIndex = this.params.stat;
        const oldValue = defender.battleLevels[statIndex];
        const newValue = Math.max(-6, Math.min(6, oldValue + this.params.change));
        // 应用能力变化
        defender.battleLevels[statIndex] = newValue;
        const statName = OnHitStatBoost.STAT_NAMES[statIndex] || `能力${statIndex}`;
        const changeDesc = this.params.change > 0 ? '提升' : '下降';
        const changeAmount = Math.abs(this.params.change);
        results.push(this.createResult(true, 'defender', 'on_hit_stat_boost', `受击后${statName}${changeDesc}${changeAmount}级`, newValue, { stat: statIndex, oldValue, newValue, damage }));
        this.log(`受击提升: 受到${damage}伤害, ${statName} ${oldValue} -> ${newValue}`);
        return results;
    }
    validate(params) {
        return params &&
            params.type === IAtomicEffect_1.AtomicEffectType.SPECIAL &&
            params.specialType === 'on_hit_stat_boost' &&
            typeof params.duration === 'number' &&
            params.duration > 0 &&
            typeof params.stat === 'number' &&
            params.stat >= 0 &&
            params.stat <= 5 &&
            typeof params.change === 'number';
    }
}
exports.OnHitStatBoost = OnHitStatBoost;
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
class RandomStatChange extends BaseAtomicEffect_1.BaseAtomicEffect {
    target;
    change;
    stats;
    count;
    allowDuplicate;
    probability;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'RandomStatChange', [EffectContext_1.EffectTiming.AFTER_SKILL, EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
        this.target = params.target;
        this.change = params.change;
        this.stats = params.stats;
        this.count = params.count ?? 1;
        this.allowDuplicate = params.allowDuplicate ?? false;
        this.probability = params.probability ?? 100;
    }
    execute(context) {
        const results = [];
        // 概率判断
        if (!this.checkProbability(this.probability)) {
            results.push(this.createResult(false, 'both', 'random_stat_change', '随机能力变化未触发', 0));
            return results;
        }
        const targetPet = this.getTarget(context, this.target);
        // 确定可选择的能力列表
        const availableStats = this.stats ?? [0, 1, 2, 3, 4]; // 默认：攻击、防御、特攻、特防、速度
        // 随机选择能力
        const selectedStats = this.selectRandomStats(availableStats, this.count, this.allowDuplicate);
        if (selectedStats.length === 0) {
            results.push(this.createResult(false, this.target === 'self' ? 'attacker' : 'defender', 'random_stat_change', '没有可选择的能力', 0));
            return results;
        }
        // 应用能力变化
        for (const statIndex of selectedStats) {
            const statName = this.getStatName(statIndex);
            const success = this.applyStatChange(targetPet, statIndex, this.change);
            if (success) {
                results.push(this.createResult(true, this.target === 'self' ? 'attacker' : 'defender', 'random_stat_change', `${statName}${this.change > 0 ? '提升' : '降低'}了${Math.abs(this.change)}级！`, this.change, {
                    stat: statIndex,
                    statName,
                    change: this.change
                }));
                this.log(`随机能力变化: ${this.target === 'self' ? '自己' : '对手'}的${statName}` +
                    `${this.change > 0 ? '提升' : '降低'}${Math.abs(this.change)}级`);
            }
        }
        return results;
    }
    validate(params) {
        if (!['self', 'opponent'].includes(params.target)) {
            this.log('target必须是self或opponent', 'error');
            return false;
        }
        if (params.change === undefined || params.change === 0) {
            this.log('change不能为0', 'error');
            return false;
        }
        if (params.count !== undefined && params.count < 1) {
            this.log('count必须大于0', 'error');
            return false;
        }
        return true;
    }
    /**
     * 随机选择能力
     */
    selectRandomStats(availableStats, count, allowDuplicate) {
        const selected = [];
        const pool = [...availableStats];
        for (let i = 0; i < count && pool.length > 0; i++) {
            const index = Math.floor(Math.random() * pool.length);
            const stat = pool[index];
            selected.push(stat);
            if (!allowDuplicate) {
                pool.splice(index, 1);
            }
        }
        return selected;
    }
    /**
     * 应用能力变化
     */
    applyStatChange(pet, statIndex, change) {
        if (!pet.battleLevels) {
            pet.battleLevels = [0, 0, 0, 0, 0, 0];
        }
        const currentLevel = pet.battleLevels[statIndex] ?? 0;
        const newLevel = Math.max(-6, Math.min(6, currentLevel + change));
        if (newLevel === currentLevel) {
            // 已达到上限或下限
            return false;
        }
        pet.battleLevels[statIndex] = newLevel;
        return true;
    }
    /**
     * 获取能力名称
     */
    getStatName(statIndex) {
        const statNames = ['攻击', '防御', '特攻', '特防', '速度', '命中', '闪避'];
        return statNames[statIndex] ?? `能力${statIndex}`;
    }
}
exports.RandomStatChange = RandomStatChange;
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
class StatClear extends BaseAtomicEffect_1.BaseAtomicEffect {
    params;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'Stat Clear', [EffectContext_1.EffectTiming.BEFORE_SKILL, EffectContext_1.EffectTiming.AFTER_SKILL]);
        this.params = params;
    }
    execute(context) {
        const results = [];
        const target = this.getTarget(context, this.params.target);
        if (!target) {
            this.log('目标不存在', 'warn');
            return results;
        }
        if (require("../../../AlderSealBattle").IsStatClearImmune(target)) {
            this.log('目标的能力提升无法被消除', 'info');
            results.push(this.createResult(false, this.params.target === 'self' ? 'attacker' : 'defender', 'stat_clear', '目标的能力提升无法被消除', 0));
            return results;
        }
        // 获取目标的能力等级变化
        const battleLevels = target.battleLevels || [0, 0, 0, 0, 0, 0];
        const previousLevels = battleLevels.slice();
        let clearedCount = 0;
        // 根据清除类型清除能力变化
        for (let i = 0; i < battleLevels.length; i++) {
            const change = battleLevels[i];
            if (this.params.clearType === 'all') {
                // 清除所有能力变化
                if (change !== 0) {
                    battleLevels[i] = 0;
                    clearedCount++;
                }
            }
            else if (this.params.clearType === 'debuff') {
                // 只清除负向变化（下降）
                if (change < 0) {
                    battleLevels[i] = 0;
                    clearedCount++;
                }
            }
            else if (this.params.clearType === 'buff') {
                // 只清除正向变化（提升）
                if (change > 0) {
                    battleLevels[i] = 0;
                    clearedCount++;
                }
            }
        }
        // 更新目标的能力变化
        target.battleLevels = battleLevels;
        const budget = require("../../../UniverseBossBudget"), battle = budget.battleFor(target);
        const changes = previousLevels.map((before, index) => ({index, before, after: battleLevels[index]})).filter(change => change.before !== 0 && change.after === 0);
        if (battle && changes.length) {
            battle.universeBudgetState.actionContext?.statClears.push({source: context.attacker, target, changes});
            require("../../../UniverseBossRules").onStatClear?.(battle, context.attacker, target, changes.map(change => change.index), changes);
        }
        const targetName = this.params.target === 'self' ? 'attacker' : 'defender';
        if (clearedCount > 0) {
            results.push(this.createResult(true, targetName, 'stat_clear', `清除了${clearedCount}项能力变化（${this.params.clearType}）`, clearedCount, { clearType: this.params.clearType, battleLevels }));
            this.log(`清除了${clearedCount}项能力变化（${this.params.clearType}）`);
        }
        else {
            results.push(this.createResult(false, targetName, 'stat_clear', '没有需要清除的能力变化', 0));
            this.log('没有需要清除的能力变化', 'debug');
        }
        return results;
    }
    validate(params) {
        if (!params || params.type !== IAtomicEffect_1.AtomicEffectType.SPECIAL) {
            return false;
        }
        if (params.specialType !== 'stat_clear') {
            return false;
        }
        if (!['self', 'opponent'].includes(params.target)) {
            this.log(`无效的目标: ${params.target}`, 'error');
            return false;
        }
        if (!['debuff', 'buff', 'all'].includes(params.clearType)) {
            this.log(`无效的清除类型: ${params.clearType}`, 'error');
            return false;
        }
        return true;
    }
}
exports.StatClear = StatClear;
// ============================================================
// StatModifier
// ============================================================
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
class StatModifier extends BaseAtomicEffect_1.BaseAtomicEffect {
    params;
    // 能力名称映射
    static STAT_NAMES = ['攻击', '防御', '特攻', '特防', '速度', '命中/闪避'];
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.STAT_MODIFIER, 'Stat Modifier', [EffectContext_1.EffectTiming.AFTER_SKILL, EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
        this.params = params;
    }
    execute(context) {
        const results = [];
        const target = this.getTarget(context, this.params.target);
        if (!target) {
            this.log('目标不存在', 'warn');
            return results;
        }
        if (this.params.mode === 'level' && this.params.change < 0 && require("../../../BossSpecialRules").BossSpecialRules.IsStatDownImmune(target)) {
            this.log('目标免疫能力下降', 'info');
            results.push(this.createResult(false, this.params.target === 'self' ? 'attacker' : 'defender', 'stat_modifier', '目标免疫能力下降', 0));
            return results;
        }
        // 初始化能力变化数组
        if (!target.battleLevels) {
            target.battleLevels = [0, 0, 0, 0, 0, 0];
        }
        const statIndex = this.params.stat;
        const oldValue = target.battleLevels[statIndex];
        let newValue = oldValue;
        // 根据模式修改能力
        if (this.params.mode === 'level') {
            // 等级模式：能力等级变化范围 -6 到 +6
            newValue = Math.max(-6, Math.min(6, oldValue + this.params.change));
        }
        else if (this.params.mode === 'value') {
            // 数值模式：直接设置能力值
            newValue = this.params.change;
        }
        else if (this.params.mode === 'sync') {
            // 同步模式：同步对方的能力等级
            const opponent = this.params.target === 'self' ? context.defender : context.attacker;
            if (opponent && opponent.battleLevels) {
                newValue = opponent.battleLevels[statIndex];
            }
        }
        target.battleLevels[statIndex] = newValue;
        const statName = StatModifier.STAT_NAMES[statIndex] || `能力${statIndex}`;
        const changeDesc = newValue > oldValue ? '提升' : newValue < oldValue ? '下降' : '不变';
        const targetName = this.params.target === 'self' ? 'attacker' : 'defender';
        results.push(this.createResult(true, targetName, 'stat_modifier', `${statName}${changeDesc}（${oldValue} -> ${newValue}）`, newValue, { stat: statIndex, oldValue, newValue, change: this.params.change }));
        this.log(`${statName}变化: ${oldValue} -> ${newValue}`);
        return results;
    }
    validate(params) {
        if (!params || params.type !== IAtomicEffect_1.AtomicEffectType.STAT_MODIFIER) {
            return false;
        }
        if (!['self', 'opponent'].includes(params.target)) {
            this.log(`无效的目标: ${params.target}`, 'error');
            return false;
        }
        if (typeof params.stat !== 'number' || params.stat < 0 || params.stat > 5) {
            this.log(`无效的能力索引: ${params.stat}`, 'error');
            return false;
        }
        if (typeof params.change !== 'number') {
            this.log(`无效的变化值: ${params.change}`, 'error');
            return false;
        }
        if (!['level', 'value', 'sync'].includes(params.mode)) {
            this.log(`无效的模式: ${params.mode}`, 'error');
            return false;
        }
        return true;
    }
}
exports.StatModifier = StatModifier;
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
class StatSteal extends BaseAtomicEffect_1.BaseAtomicEffect {
    stat;
    levels;
    probability;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'StatSteal', [EffectContext_1.EffectTiming.AFTER_SKILL, EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
        this.stat = params.stat;
        this.levels = params.levels;
        this.probability = params.probability ?? 100;
    }
    execute(context) {
        const results = [];
        // 概率判断
        if (!this.checkProbability(this.probability)) {
            results.push(this.createResult(false, 'both', 'stat_steal', '能力窃取未触发', 0));
            return results;
        }
        const attacker = this.getAttacker(context);
        const defender = this.getDefender(context);
        const statName = this.getStatName(this.stat);
        const attackerLevel = this.getStatLevel(attacker, this.stat);
        const defenderLevel = this.getStatLevel(defender, this.stat);
        // 计算实际窃取的等级（考虑上下限）
        const actualSteal = Math.min(this.levels, defenderLevel + 6, // 对手最多降低到-6
        6 - attackerLevel // 自己最多提升到+6
        );
        if (actualSteal <= 0) {
            results.push(this.createResult(false, 'both', 'stat_steal', `无法窃取${statName}`, 0));
            return results;
        }
        // 降低对手能力
        const newDefenderLevel = Math.max(-6, defenderLevel - actualSteal);
        this.setStatLevel(defender, this.stat, newDefenderLevel);
        // 提升自己能力
        const newAttackerLevel = Math.min(6, attackerLevel + actualSteal);
        this.setStatLevel(attacker, this.stat, newAttackerLevel);
        results.push(this.createResult(true, 'both', 'stat_steal', `窃取了对手的${statName}！`, actualSteal, {
            stat: this.stat,
            statName,
            stolenLevels: actualSteal,
            attackerOld: attackerLevel,
            attackerNew: newAttackerLevel,
            defenderOld: defenderLevel,
            defenderNew: newDefenderLevel
        }));
        this.log(`能力窃取: ${statName} 窃取${actualSteal}级, ` +
            `攻击方${attackerLevel}→${newAttackerLevel}, ` +
            `防御方${defenderLevel}→${newDefenderLevel}`);
        return results;
    }
    validate(params) {
        if (params.stat === undefined || params.stat < 0 || params.stat > 6) {
            this.log('stat必须在0-6之间', 'error');
            return false;
        }
        if (params.levels === undefined || params.levels < 1) {
            this.log('levels必须至少为1', 'error');
            return false;
        }
        return true;
    }
    /**
     * 获取能力变化等级
     */
    getStatLevel(pet, statIndex) {
        if (!pet.battleLevels)
            return 0;
        return pet.battleLevels[statIndex] ?? 0;
    }
    /**
     * 设置能力变化等级
     */
    setStatLevel(pet, statIndex, level) {
        if (!pet.battleLevels) {
            pet.battleLevels = [0, 0, 0, 0, 0, 0];
        }
        pet.battleLevels[statIndex] = Math.max(-6, Math.min(6, level));
    }
    /**
     * 获取能力名称
     */
    getStatName(statIndex) {
        const statNames = ['攻击', '防御', '特攻', '特防', '速度', '命中', '闪避'];
        return statNames[statIndex] ?? `能力${statIndex}`;
    }
}
exports.StatSteal = StatSteal;
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
class StatSync extends BaseAtomicEffect_1.BaseAtomicEffect {
    mode;
    stats;
    includeLevels;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'StatSync', [EffectContext_1.EffectTiming.AFTER_SKILL]);
        this.mode = params.mode;
        this.stats = params.stats;
        this.includeLevels = params.includeLevels ?? false;
    }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const defender = this.getDefender(context);
        // 确定要同步的能力
        const statsToSync = this.stats ?? [0, 1, 2, 3, 4]; // 默认同步所有能力
        for (const statIndex of statsToSync) {
            const statName = this.getStatName(statIndex);
            const attackerStat = this.getStat(attacker, statIndex);
            const defenderStat = this.getStat(defender, statIndex);
            let newAttackerStat = attackerStat;
            let newDefenderStat = defenderStat;
            switch (this.mode) {
                case 'average':
                    // 平均值模式
                    const average = Math.floor((attackerStat + defenderStat) / 2);
                    newAttackerStat = average;
                    newDefenderStat = average;
                    break;
                case 'copy':
                    // 复制模式（攻击方复制防御方）
                    newAttackerStat = defenderStat;
                    break;
                case 'swap':
                    // 交换模式
                    newAttackerStat = defenderStat;
                    newDefenderStat = attackerStat;
                    break;
            }
            // 应用能力变化
            this.setStat(attacker, statIndex, newAttackerStat);
            if (this.mode !== 'copy') {
                this.setStat(defender, statIndex, newDefenderStat);
            }
            // 如果包含能力变化等级，也进行同步
            if (this.includeLevels) {
                const attackerLevel = this.getStatLevel(attacker, statIndex);
                const defenderLevel = this.getStatLevel(defender, statIndex);
                switch (this.mode) {
                    case 'average':
                        const avgLevel = Math.floor((attackerLevel + defenderLevel) / 2);
                        this.setStatLevel(attacker, statIndex, avgLevel);
                        this.setStatLevel(defender, statIndex, avgLevel);
                        break;
                    case 'copy':
                        this.setStatLevel(attacker, statIndex, defenderLevel);
                        break;
                    case 'swap':
                        this.setStatLevel(attacker, statIndex, defenderLevel);
                        this.setStatLevel(defender, statIndex, attackerLevel);
                        break;
                }
            }
            results.push(this.createResult(true, this.mode === 'copy' ? 'attacker' : 'both', 'stat_sync', `${statName}同步！`, 0, {
                stat: statIndex,
                statName,
                mode: this.mode,
                attackerOld: attackerStat,
                attackerNew: newAttackerStat,
                defenderOld: defenderStat,
                defenderNew: newDefenderStat
            }));
            this.log(`能力同步(${this.mode}): ${statName} ` +
                `攻击方${attackerStat}→${newAttackerStat}, ` +
                `防御方${defenderStat}→${newDefenderStat}`);
        }
        return results;
    }
    validate(params) {
        if (!['average', 'copy', 'swap'].includes(params.mode)) {
            this.log('mode必须是average、copy或swap', 'error');
            return false;
        }
        if (params.stats && !Array.isArray(params.stats)) {
            this.log('stats必须是数组', 'error');
            return false;
        }
        return true;
    }
    /**
     * 获取能力值
     */
    getStat(pet, statIndex) {
        const statNames = ['attack', 'defense', 'spAttack', 'spDefense', 'speed'];
        const statName = statNames[statIndex];
        return pet[statName] ?? 0;
    }
    /**
     * 设置能力值
     */
    setStat(pet, statIndex, value) {
        const statNames = ['attack', 'defense', 'spAttack', 'spDefense', 'speed'];
        const statName = statNames[statIndex];
        if (pet[statName] !== undefined) {
            pet[statName] = value;
        }
    }
    /**
     * 获取能力变化等级
     */
    getStatLevel(pet, statIndex) {
        if (!pet.battleLevels)
            return 0;
        return pet.battleLevels[statIndex] ?? 0;
    }
    /**
     * 设置能力变化等级
     */
    setStatLevel(pet, statIndex, level) {
        if (!pet.battleLevels) {
            pet.battleLevels = [0, 0, 0, 0, 0, 0];
        }
        pet.battleLevels[statIndex] = level;
    }
    /**
     * 获取能力名称
     */
    getStatName(statIndex) {
        const statNames = ['攻击', '防御', '特攻', '特防', '速度'];
        return statNames[statIndex] ?? `能力${statIndex}`;
    }
}
exports.StatSync = StatSync;
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
class StatTransfer extends BaseAtomicEffect_1.BaseAtomicEffect {
    stats;
    mode;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'StatTransfer', [EffectContext_1.EffectTiming.AFTER_SKILL]);
        this.stats = params.stats;
        this.mode = params.mode;
    }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const defender = this.getDefender(context);
        // 确定要转移的能力
        const statsToTransfer = this.stats ?? [0, 1, 2, 3, 4]; // 默认所有能力
        for (const statIndex of statsToTransfer) {
            const statName = this.getStatName(statIndex);
            const attackerLevel = this.getStatLevel(attacker, statIndex);
            const defenderLevel = this.getStatLevel(defender, statIndex);
            switch (this.mode) {
                case 'copy':
                    // 复制对手的能力变化
                    this.setStatLevel(attacker, statIndex, defenderLevel);
                    results.push(this.createResult(true, 'attacker', 'stat_transfer_copy', `复制了对手的${statName}变化！`, defenderLevel, {
                        stat: statIndex,
                        statName,
                        level: defenderLevel
                    }));
                    this.log(`能力复制: ${statName} = ${defenderLevel}`);
                    break;
                case 'swap':
                    // 交换双方的能力变化
                    this.setStatLevel(attacker, statIndex, defenderLevel);
                    this.setStatLevel(defender, statIndex, attackerLevel);
                    results.push(this.createResult(true, 'both', 'stat_transfer_swap', `交换了${statName}变化！`, 0, {
                        stat: statIndex,
                        statName,
                        attackerOld: attackerLevel,
                        attackerNew: defenderLevel,
                        defenderOld: defenderLevel,
                        defenderNew: attackerLevel
                    }));
                    this.log(`能力交换: ${statName} 攻击方${attackerLevel}↔${defenderLevel}防御方`);
                    break;
                case 'steal':
                    // 窃取对手的能力提升（仅正值）
                    if (defenderLevel > 0) {
                        const newAttackerLevel = Math.min(6, attackerLevel + defenderLevel);
                        this.setStatLevel(attacker, statIndex, newAttackerLevel);
                        this.setStatLevel(defender, statIndex, 0);
                        const universeBattle = __universeBudget.battleFor(defender);
                        if (universeBattle) {
                            const changes = [{index: statIndex, before: defenderLevel, after: 0}];
                            const action = universeBattle.universeBudgetState?.actionContext;
                            if (action) (action.statClears || (action.statClears = [])).push({source: attacker, target: defender, changes});
                            require('../../../UniverseBossRules').onStatClear?.(universeBattle, attacker, defender, [statIndex], changes);
                        }
                        results.push(this.createResult(true, 'both', 'stat_transfer_steal', `窃取了对手的${statName}提升！`, defenderLevel, {
                            stat: statIndex,
                            statName,
                            stolenLevels: defenderLevel,
                            attackerNew: newAttackerLevel
                        }));
                        this.log(`能力窃取: ${statName} 窃取${defenderLevel}级，攻击方${attackerLevel}→${newAttackerLevel}`);
                    }
                    break;
            }
        }
        return results;
    }
    validate(params) {
        if (!['copy', 'swap', 'steal'].includes(params.mode)) {
            this.log('mode必须是copy、swap或steal', 'error');
            return false;
        }
        if (params.stats && !Array.isArray(params.stats)) {
            this.log('stats必须是数组', 'error');
            return false;
        }
        return true;
    }
    /**
     * 获取能力变化等级
     */
    getStatLevel(pet, statIndex) {
        if (!pet.battleLevels)
            return 0;
        return pet.battleLevels[statIndex] ?? 0;
    }
    /**
     * 设置能力变化等级
     */
    setStatLevel(pet, statIndex, level) {
        if (!pet.battleLevels) {
            pet.battleLevels = [0, 0, 0, 0, 0, 0];
        }
        pet.battleLevels[statIndex] = Math.max(-6, Math.min(6, level));
    }
    /**
     * 获取能力名称
     */
    getStatName(statIndex) {
        const statNames = ['攻击', '防御', '特攻', '特防', '速度', '命中', '闪避'];
        return statNames[statIndex] ?? `能力${statIndex}`;
    }
}
exports.StatTransfer = StatTransfer;
//# sourceMappingURL=StatEffects.js.map
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
