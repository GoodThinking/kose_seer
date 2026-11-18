"use strict";
/**
 * 技能效果触发器
 * 负责在战斗中触发和应用技能效果
 *
 * 集成原子效果系统到战斗流程
 *
 * 支持多效果技能：
 * - 单效果: SideEffect="4", SideEffectArg="0 100 1"
 * - 多效果: SideEffect="4 4 4", SideEffectArg="0 100 1 1 100 1 2 100 1"
 *
 * 使用原子效果组合：
 * - 从 skill_effects_v2.json 读取 atomicComposition 配置
 * - 使用 AtomicEffectFactory 创建原子效果实例
 * - 执行原子效果组合并返回结果
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EffectTrigger = void 0;
const utils_1 = require("../../../shared/utils");
const EffectContext_1 = require("./effects/core/EffectContext");
const EffectTimingResolver_1 = require("./effects/core/EffectTimingResolver");
const SkillEffectsConfig_1 = require("../../../shared/config/game/SkillEffectsConfig");
const AtomicEffectFactory_1 = require("./effects/atomic/core/AtomicEffectFactory");
const EffectApplicator_1 = require("./EffectApplicator");
const SkillEffectRuntime_1 = require("./SkillEffectRuntime");
/**
 * 效果触发器类
 */
class EffectTrigger {
    /**
     * 触发技能的所有附加效果（支持多效果）
     *
     * @param skill 技能配置
     * @param attacker 攻击方
     * @param defender 防守方
     * @param damage 造成的伤害
     * @param timing 触发时机
     * @returns 效果结果数组
     */
    static TriggerSkillEffect(skill, attacker, defender, damage, timing) {
        // 如果技能没有附加效果，直接返回
        if (!skill.sideEffect || skill.sideEffect === 0) {
            return [];
        }
        // 只在INFO级别显示技能效果触发
        utils_1.Logger.Info(`[技能效果] ${skill.name} 触发效果 (时机=${timing})`);
        // 检查是否为多效果技能
        const sideEffectStr = skill.sideEffect.toString();
        if (sideEffectStr.includes(' ')) {
            // 多效果技能
            return this.TriggerMultipleSkillEffects(skill, attacker, defender, damage, timing);
        }
        else {
            // 单效果技能
            return this.TriggerSingleSkillEffect(skill, attacker, defender, damage, timing);
        }
    }
    /**
     * 触发单个技能效果（使用原子效果组合）
     *
     * @param skill 技能配置
     * @param attacker 攻击方
     * @param defender 防守方
     * @param damage 造成的伤害
     * @param timing 触发时机
     * @returns 效果结果数组
     */
    static TriggerSingleSkillEffect(skill, attacker, defender, damage, timing) {
        const results = [];
        try {
            const effectId = typeof skill.sideEffect === 'number'
                ? skill.sideEffect
                : parseInt(skill.sideEffect?.toString() || '0');
            if (SkillEffectRuntime_1.SkillEffectRuntime.Handles(effectId, skill) || SkillEffectRuntime_1.SkillEffectRuntime.EffectBlocked(defender, effectId, skill))
                return [];
            // 1. 从新配置系统获取效果信息
            const effectConfig = SkillEffectsConfig_1.SkillEffectsConfig.Instance.GetEffectById(effectId);
            if (!effectConfig) {
                utils_1.Logger.Warn(`[EffectTrigger] 效果配置不存在: effectId=${effectId}`);
                return [];
            }
            // 2. 检查是否有原子效果组合配置
            if (!effectConfig.atomicComposition || !effectConfig.atomicComposition.atoms) {
                utils_1.Logger.Warn(`[EffectTrigger] 效果缺少原子组合配置: effectId=${effectId}, name=${effectConfig.name}`);
                return [];
            }
            // 3. 检查是否在正确的时机触发
            if (!(0, EffectTimingResolver_1.MatchesEffectTiming)(effectConfig.timing, timing)) {
                // 效果时机不匹配，静默跳过
                return [];
            }
            // 4. 创建效果上下文
            const context = (0, EffectContext_1.createEffectContext)(attacker, defender, skill.id, damage, timing);
            context.effectId = effectId;
            context.skillType = skill.type;
            context.skillCategory = skill.category;
            context.skillPower = skill.power;
            if (timing === EffectContext_1.EffectTiming.BEFORE_DAMAGE_CALC || timing === EffectContext_1.EffectTiming.BEFORE_SPEED_CHECK)
                context.skill = { power: skill.power || 0, accuracy: skill.accuracy, priority: skill.priority || 0 };
            // 5. 解析 SideEffectArg 参数
            const effectArgs = this.ParseEffectArgs(skill.sideEffectArg);
            const healBindingArgs = this.ParseHealBindingArgs(skill.sideEffectArg);
            context.effectArgs = effectArgs;
            // 6. 执行原子效果组合
            const atoms = effectConfig.atomicComposition.atoms;
            utils_1.Logger.Debug(`[EffectTrigger] 执行原子效果组合: ${effectConfig.name} (ID=${effectId}), ` +
                `原子数: ${atoms.length}, 时机: ${timing}, 参数: ${effectArgs.join(',')}`);
            for (const atomConfig of atoms) {
                // 深度克隆原子配置，避免修改原始配置
                const atomConfigWithArgs = JSON.parse(JSON.stringify(atomConfig));
                // 根据效果配置的参数定义，覆盖原子效果的参数
                if (effectConfig.args && effectConfig.args.length > 0 && effectArgs.length > 0) {
                    // 构建参数映射表
                    const argMap = {};
                    for (let i = 0; i < effectConfig.args.length && i < effectArgs.length; i++) {
                        const argDef = effectConfig.args[i];
                        const argValue = effectArgs[i];
                        if (argDef.name) {
                            // 将参数值应用到顶层原子效果配置
                            atomConfigWithArgs[argDef.name] = argValue;
                            argMap[argDef.name] = argValue;
                        }
                    }
                    // 将参数传播到嵌套的 then/else 子效果中
                    this.PropagateArgsToNestedAtoms(atomConfigWithArgs, argMap);
                }
                if (!this.ResolveDamageHealBindings(atomConfigWithArgs, effectConfig.args, healBindingArgs))
                    continue;
                const atom = AtomicEffectFactory_1.AtomicEffectFactory.getInstance().create(atomConfigWithArgs);
                if (!atom) {
                    utils_1.Logger.Warn(`[EffectTrigger] 创建原子效果失败: type=${atomConfig.type}`);
                    continue;
                }
                // 检查原子效果是否可以在当前时机触发
                if (!atom.canTriggerAt(timing)) {
                    // 原子效果时机不匹配，静默跳过
                    continue;
                }
                // 执行原子效果
                const atomResults = atom.execute(context);
                results.push(...atomResults);
                utils_1.Logger.Debug(`[EffectTrigger] 原子效果执行: ${atom.name}, 结果数: ${atomResults.length}`);
            }
            if (results.length > 0) {
                utils_1.Logger.Info(`[EffectTrigger] 效果执行成功: ${effectConfig.name} (ID=${effectId}), ` +
                    `总结果数: ${results.length}`);
            }
        }
        catch (error) {
            utils_1.Logger.Error(`[EffectTrigger] 单效果执行失败: ${error}`, error);
        }
        return results;
    }
    /**
     * 触发多个技能效果（使用原子效果组合）
     *
     * 示例：
     * SideEffect="4 4 4 4 4 4"
     * SideEffectArg="0 100 1 1 100 1 2 100 1 3 100 1 4 100 1 5 100 1"
     *
     * @param skill 技能配置
     * @param attacker 攻击方
     * @param defender 防守方
     * @param damage 造成的伤害
     * @param timing 触发时机
     * @returns 效果结果数组
     */
    static TriggerMultipleSkillEffects(skill, attacker, defender, damage, timing) {
        const allResults = [];
        try {
            // 1. 解析多个效果ID
            const sideEffectStr = skill.sideEffect?.toString() || '';
            const effectIds = sideEffectStr.split(' ').map(id => parseInt(id.trim())).filter(id => id > 0);
            if (effectIds.length === 0) {
                return [];
            }
            utils_1.Logger.Debug(`[EffectTrigger] 多效果技能: ${skill.name} (ID=${skill.id}), ` +
                `效果数: ${effectIds.length}, 时机: ${timing}`);
            // 2. 解析所有参数，按每个效果的argsNum分割
            const allArgs = this.ParseEffectArgs(skill.sideEffectArg);
            const allHealArgs = this.ParseHealBindingArgs(skill.sideEffectArg);
            let argOffset = 0;
            let healArgOffsetKnown = true;
            // 3. 按顺序处理每个效果
            const skillState = timing === EffectContext_1.EffectTiming.BEFORE_DAMAGE_CALC || timing === EffectContext_1.EffectTiming.BEFORE_SPEED_CHECK ? { power: skill.power || 0, accuracy: skill.accuracy, priority: skill.priority || 0 } : undefined;
            for (let i = 0; i < effectIds.length; i++) {
                const effectId = effectIds[i];
                if (SkillEffectRuntime_1.SkillEffectRuntime.Handles(effectId, skill) || SkillEffectRuntime_1.SkillEffectRuntime.EffectBlocked(defender, effectId, skill)) {
                    argOffset += SkillEffectRuntime_1.SkillEffectRuntime.ArgCount(effectId) ?? 0;
                    continue;
                }
                // 获取效果配置
                const effectConfig = SkillEffectsConfig_1.SkillEffectsConfig.Instance.GetEffectById(effectId);
                if (!effectConfig) {
                    utils_1.Logger.Warn(`[EffectTrigger] 效果配置不存在: effectId=${effectId}`);
                    healArgOffsetKnown = false;
                    argOffset += SkillEffectRuntime_1.SkillEffectRuntime.ArgCount(effectId) ?? 0;
                    continue;
                }
                // 提取当前效果的参数
                const argsNum = SkillEffectRuntime_1.SkillEffectRuntime.ArgCount(effectId) ?? (effectConfig.argsNum || (effectConfig.args ? effectConfig.args.length : 0));
                const effectArgs = allArgs.slice(argOffset, argOffset + argsNum);
                const healBindingArgs = healArgOffsetKnown ? allHealArgs.slice(argOffset, argOffset + argsNum) : [];
                argOffset += argsNum;
                // 检查是否有原子效果组合配置
                if (!effectConfig.atomicComposition || !effectConfig.atomicComposition.atoms) {
                    utils_1.Logger.Warn(`[EffectTrigger] 效果缺少原子组合配置: effectId=${effectId}, name=${effectConfig.name}`);
                    continue;
                }
                // 检查触发时机
                if (!(0, EffectTimingResolver_1.MatchesEffectTiming)(effectConfig.timing, timing)) {
                    // 效果时机不匹配，静默跳过
                    continue;
                }
                // 创建效果上下文
                const context = (0, EffectContext_1.createEffectContext)(attacker, defender, skill.id, damage, timing);
                context.effectId = effectId;
                context.skillType = skill.type;
                context.skillCategory = skill.category;
                context.skillPower = skill.power;
                context.skill = skillState;
                context.effectArgs = effectArgs;
                // 执行原子效果组合
                const atoms = effectConfig.atomicComposition.atoms;
                utils_1.Logger.Debug(`[EffectTrigger] 效果 ${i + 1}/${effectIds.length}: ${effectConfig.name} (ID=${effectId}), ` +
                    `原子数: ${atoms.length}, 参数: ${effectArgs.join(',')}`);
                for (const atomConfig of atoms) {
                    // 深度克隆原子配置，避免修改原始配置
                    const atomConfigWithArgs = JSON.parse(JSON.stringify(atomConfig));
                    // 根据效果配置的参数定义，覆盖原子效果的参数
                    if (effectConfig.args && effectConfig.args.length > 0 && effectArgs.length > 0) {
                        const argMap = {};
                        for (let j = 0; j < effectConfig.args.length && j < effectArgs.length; j++) {
                            const argDef = effectConfig.args[j];
                            const argValue = effectArgs[j];
                            if (argDef.name) {
                                atomConfigWithArgs[argDef.name] = argValue;
                                argMap[argDef.name] = argValue;
                            }
                        }
                        // 将参数传播到嵌套的 then/else 子效果中
                        this.PropagateArgsToNestedAtoms(atomConfigWithArgs, argMap);
                    }
                    if (!this.ResolveDamageHealBindings(atomConfigWithArgs, effectConfig.args, healBindingArgs))
                        continue;
                    const atom = AtomicEffectFactory_1.AtomicEffectFactory.getInstance().create(atomConfigWithArgs);
                    if (!atom) {
                        utils_1.Logger.Warn(`[EffectTrigger] 创建原子效果失败: type=${atomConfig.type}`);
                        continue;
                    }
                    // 检查原子效果是否可以在当前时机触发
                    if (!atom.canTriggerAt(timing)) {
                        continue;
                    }
                    // 执行原子效果
                    const atomResults = atom.execute(context);
                    allResults.push(...atomResults);
                    if (atomResults.length > 0) {
                        utils_1.Logger.Debug(`[EffectTrigger] 原子效果执行: ${atom.name}, 结果数: ${atomResults.length}`);
                    }
                }
            }
            utils_1.Logger.Info(`[EffectTrigger] 多效果技能执行完成: ${skill.name}, ` +
                `总结果数: ${allResults.length}`);
        }
        catch (error) {
            utils_1.Logger.Error(`[EffectTrigger] 多效果执行失败: ${error}`, error);
        }
        return allResults;
    }
    /**
     * 解析效果参数字符串
     *
     * @param sideEffectArg 参数字符串或数字，例如 "10" 或 10 或 "2 5" 或 "0 100 1"
     * @returns 参数数组
     */
    static ParseEffectArgs(sideEffectArg) {
        if (sideEffectArg === undefined || sideEffectArg === null) {
            return [];
        }
        try {
            // 如果是数字，直接返回单元素数组
            if (typeof sideEffectArg === 'number') {
                return [sideEffectArg];
            }
            // 如果是字符串，按空格分割
            const argStr = sideEffectArg.toString().trim();
            if (argStr === '') {
                return [];
            }
            return argStr.split(/\s+/).map(arg => {
                const num = parseInt(arg);
                return isNaN(num) ? 0 : num;
            });
        }
        catch (error) {
            utils_1.Logger.Warn(`[EffectTrigger] 解析效果参数失败: ${sideEffectArg}`);
            return [];
        }
    }
    /**
     * 批量触发效果（用于多个时机）
     */
    static TriggerMultipleEffects(skill, attacker, defender, damage, timings) {
        const allResults = [];
        for (const timing of timings) {
            const results = this.TriggerSkillEffect(skill, attacker, defender, damage, timing);
            allResults.push(...results);
        }
        return allResults;
    }
    /**
     * 应用效果结果到战斗精灵（委托给 EffectApplicator）
     */
    static ApplyEffectResults(results, attacker, defender) {
        EffectApplicator_1.EffectApplicator.Apply(results, attacker, defender);
    }
    /**
     * 检查效果是否应该触发（概率判定）
     */
    static ShouldTrigger(chance) {
        return EffectApplicator_1.EffectApplicator.ShouldTrigger(chance);
    }
    /**
     * 参数名到嵌套原子效果字段的映射
     * args中定义的name → 实际原子效果中的字段名
     */
    static ARG_FIELD_MAP = {
        'statIndex': 'stat',
        'level': 'change',
        'probability': 'value',
        'powerMultiplier': 'value',
        'priority': 'value',
        'powerBoost': 'value',
    };
    /** Strict parsing only for explicit healing bindings; keep legacy atom parsing unchanged. */
    static ParseHealBindingArgs(args) {
        if (typeof args === 'number')
            return [args];
        if (typeof args !== 'string' || !args.trim())
            return [];
        return args.trim().split(/\s+/).map(Number);
    }
    /** Normalize declared external units to HealEffect's ratio on the per-call clone. */
    static ResolveDamageHealBindings(atom, definitions, args) {
        if (atom.type === 'heal' && atom.mode === 'damage_percent' &&
            ('valueArg' in atom || 'valueUnit' in atom)) {
            const index = definitions?.findIndex(def => def.name === atom.valueArg) ?? -1;
            const input = index >= 0 ? args[index] : undefined;
            const valid = typeof input === 'number' && Number.isFinite(input) &&
                ((atom.valueUnit === 'percent' && input >= 0) ||
                    (atom.valueUnit === 'divisor' && Number.isInteger(input) && input > 0));
            if (!valid) {
                utils_1.Logger.Warn(`[EffectTrigger] 无效治疗参数绑定: ${atom.valueArg}/${atom.valueUnit}`);
                return false;
            }
            atom.value = atom.valueUnit === 'percent' ? input / 100 : 1 / input;
            delete atom.valueArg;
            delete atom.valueUnit;
        }
        for (const branch of ['then', 'else']) {
            if (Array.isArray(atom[branch])) {
                atom[branch] = atom[branch].filter((child) => this.ResolveDamageHealBindings(child, definitions, args));
            }
        }
        return true;
    }
    /**
     * 将参数传播到嵌套的 then/else 子效果中
     * 解决 conditional 包裹 stat_modifier 等场景下参数丢失的问题
     */
    static PropagateArgsToNestedAtoms(atomConfig, argMap) {
        const branches = ['then', 'else'];
        for (const branch of branches) {
            if (!Array.isArray(atomConfig[branch]))
                continue;
            for (const childAtom of atomConfig[branch]) {
                // 将参数应用到子效果，使用字段映射
                for (const [argName, argValue] of Object.entries(argMap)) {
                    const fieldName = this.ARG_FIELD_MAP[argName] || argName;
                    // 仅在子效果已有该字段时覆盖（避免污染不相关的原子效果）
                    if (fieldName in childAtom) {
                        childAtom[fieldName] = argValue;
                    }
                }
                // 递归处理更深层的嵌套
                this.PropagateArgsToNestedAtoms(childAtom, argMap);
            }
        }
    }
}
exports.EffectTrigger = EffectTrigger;
//# sourceMappingURL=EffectTrigger.js.map