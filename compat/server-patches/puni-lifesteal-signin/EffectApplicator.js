"use strict";
/**
 * 效果应用器
 * 负责将效果结果应用到战斗精灵上
 *
 * 从 EffectTrigger 中提取，专注于效果结果的应用逻辑
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EffectApplicator = void 0;
const utils_1 = require("../../../shared/utils");
const BossSpecialRules_1 = require("./BossSpecialRules");
const STAT_NAMES = ['攻击', '防御', '特攻', '特防', '速度', '命中'];
/**
 * 效果应用器
 */
class EffectApplicator {
    /**
     * 应用效果结果到战斗精灵
     */
    static Apply(results, attacker, defender) {
        for (const result of results) {
            if (!result.success)
                continue;
            const target = result.target === 'attacker' ? attacker : defender;
            if (this.IsImmune(target, result)) {
                utils_1.Logger.Info(`[效果应用] ${target.name} 免疫效果: ${result.type}`);
                continue;
            }
            this.ApplySingle(target, result, attacker, defender);
        }
    }
    /**
     * 检查效果概率是否触发
     */
    static ShouldTrigger(chance) {
        return Math.random() * 100 < chance;
    }
    // ==================== 内部方法 ====================
    static ApplySingle(target, result, attacker, defender) {
        switch (result.type) {
            case 'heal':
            case 'absorb':
            case 'damage_lifesteal':
                if (result.value && result.value > 0) {
                    target.hp = Math.min(target.maxHp, target.hp + result.value);
                    utils_1.Logger.Info(`[效果应用] ${result.target} 回复 ${result.value} HP`);
                }
                break;
            case 'damage':
            case 'recoil':
                if (result.value && result.value > 0) {
                    target.hp = Math.max(0, target.hp - result.value);
                    utils_1.Logger.Info(`[效果应用] ${result.target} 受到 ${result.value} 点伤害`);
                }
                break;
            case 'status':
                this.ApplyStatus(target, result);
                break;
            case 'stat_change':
                this.ApplyStatChange(target, result);
                break;
            case 'multi_hit':
                utils_1.Logger.Info(`[效果应用] 连续攻击 ${result.value} 次`);
                break;
            case 'hp_equal':
                if (BossSpecialRules_1.BossSpecialRules.IsSameLifeDeathImmune(defender)) {
                    utils_1.Logger.Info(`[效果应用] 同生共死被免疫: ${defender.name} (petId=${defender.petId})`);
                    break;
                }
                defender.hp = attacker.hp;
                utils_1.Logger.Info(`[效果应用] 同生共死: 对方HP变为 ${defender.hp}`);
                break;
            case 'mercy':
                if (defender.hp <= 0) {
                    defender.hp = 1;
                    utils_1.Logger.Info(`[效果应用] 手下留情: 对方HP保留1点`);
                }
                break;
            case 'encore':
                if (result.data && result.data.turns) {
                    defender.encore = true;
                    defender.encoreTurns = result.data.turns;
                    utils_1.Logger.Info(`[效果应用] 克制: 对方被迫使用上次技能 ${result.data.turns} 回合`);
                }
                break;
            case 'pp_reduce':
                if (defender.lastMove && defender.skillPP) {
                    const skillIndex = defender.skills.indexOf(defender.lastMove);
                    if (skillIndex >= 0 && defender.skillPP[skillIndex]) {
                        defender.skillPP[skillIndex] = Math.max(0, defender.skillPP[skillIndex] - 1);
                        utils_1.Logger.Info(`[效果应用] 减少对方技能PP`);
                    }
                }
                break;
            default:
                if (result.type === 'conditional' || result.type === 'fixed_damage')
                    break;
                utils_1.Logger.Debug(`[效果应用] 未处理的效果类型: ${result.type}`);
        }
    }
    static ApplyStatus(target, result) {
        if (!result.data || result.data.status === undefined)
            return;
        if (!target.statusDurations) {
            target.statusDurations = new Array(20).fill(0);
        }
        target.statusDurations[result.data.status] = result.data.duration || 3;
        target.status = result.data.status;
        target.statusTurns = result.data.duration || 3;
        utils_1.Logger.Info(`[效果应用] ${result.target} 进入状态: ${result.data.statusName}, ` +
            `持续 ${result.data.duration} 回合`);
    }
    static ApplyStatChange(target, result) {
        if (!result.data || result.data.stat === undefined || result.data.stages === undefined)
            return;
        if (!target.battleLv) {
            target.battleLv = [0, 0, 0, 0, 0, 0];
        }
        const statIndex = result.data.stat;
        const oldStage = target.battleLv[statIndex] || 0;
        const newStage = Math.max(-6, Math.min(6, oldStage + result.data.stages));
        target.battleLv[statIndex] = newStage;
        if (result.data.duration && result.data.duration > 0) {
            this.ApplyTemporaryStatChange(target, result, statIndex, oldStage, newStage);
        }
        else {
            const change = result.data.stages > 0 ? '提升' : '降低';
            utils_1.Logger.Info(`[效果应用] ${result.target} ${STAT_NAMES[statIndex]}${change} ` +
                `${Math.abs(result.data.stages)} 级 (${oldStage} → ${newStage})`);
        }
    }
    static ApplyTemporaryStatChange(target, result, statIndex, oldStage, newStage) {
        if (!target.effectCounters) {
            target.effectCounters = {};
        }
        const counterKey = `stat_${statIndex}_boost_${result.data.stages}`;
        const existingKeys = Object.keys(target.effectCounters).filter(k => k.startsWith(`stat_${statIndex}_boost_`));
        if (existingKeys.length > 0) {
            const stackRule = result.data.stackRule || 'refresh';
            if (stackRule === 'refresh') {
                target.effectCounters[existingKeys[0]] = result.data.duration;
                utils_1.Logger.Info(`[效果应用] ${result.target} 刷新能力变化持续时间: ` +
                    `${STAT_NAMES[statIndex]}, 持续${result.data.duration}回合`);
            }
            else if (stackRule === 'stack') {
                target.effectCounters[counterKey] = result.data.duration;
                utils_1.Logger.Info(`[效果应用] ${result.target} 叠加能力变化: ` +
                    `${STAT_NAMES[statIndex]} ${result.data.stages > 0 ? '+' : ''}${result.data.stages}, ` +
                    `持续${result.data.duration}回合`);
            }
            else if (stackRule === 'replace') {
                for (const oldKey of existingKeys) {
                    const oldMatch = oldKey.match(/stat_\d+_boost_(-?\d+)/);
                    if (oldMatch) {
                        const oldStages = parseInt(oldMatch[1]);
                        target.battleLv[statIndex] = Math.max(-6, Math.min(6, target.battleLv[statIndex] - oldStages));
                    }
                    delete target.effectCounters[oldKey];
                }
                target.effectCounters[counterKey] = result.data.duration;
                utils_1.Logger.Info(`[效果应用] ${result.target} 替换能力变化: ` +
                    `${STAT_NAMES[statIndex]} ${result.data.stages > 0 ? '+' : ''}${result.data.stages}, ` +
                    `持续${result.data.duration}回合`);
            }
        }
        else {
            target.effectCounters[counterKey] = result.data.duration;
            utils_1.Logger.Info(`[效果应用] ${result.target} 能力变化（临时${result.data.duration}回合）: ` +
                `${STAT_NAMES[statIndex]} ${result.data.stages > 0 ? '+' : ''}${result.data.stages} ` +
                `(${oldStage} → ${newStage})`);
        }
    }
    static IsImmune(target, result) {
        if (result.type === 'status' && BossSpecialRules_1.BossSpecialRules.IsStatusImmune(target, result.data?.status))
            return true;
        if (result.type === 'stat_change' && result.data?.stages < 0 && BossSpecialRules_1.BossSpecialRules.IsStatDownImmune(target))
            return true;
        return false;
    }
}
exports.EffectApplicator = EffectApplicator;
//# sourceMappingURL=EffectApplicator.js.map