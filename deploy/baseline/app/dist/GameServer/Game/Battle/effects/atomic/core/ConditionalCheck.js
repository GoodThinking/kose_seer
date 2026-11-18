"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionalCheck = void 0;
const BaseAtomicEffect_1 = require("./BaseAtomicEffect");
const IAtomicEffect_1 = require("./IAtomicEffect");
const AtomicEffectFactory_1 = require("./AtomicEffectFactory");
/**
 * 条件判断原子效果
 * 根据条件判断执行不同的效果
 */
class ConditionalCheck extends BaseAtomicEffect_1.BaseAtomicEffect {
    params;
    thenEffects = [];
    elseEffects = [];
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.CONDITIONAL, 'Conditional Check', []);
        this.params = params;
        // 创建then分支的子效果
        if (params.then && params.then.length > 0) {
            this.thenEffects = AtomicEffectFactory_1.atomicEffectFactory.createBatch(params.then);
        }
        // 创建else分支的子效果
        if (params.else && params.else.length > 0) {
            this.elseEffects = AtomicEffectFactory_1.atomicEffectFactory.createBatch(params.else);
        }
    }
    execute(context) {
        const results = [];
        const conditionMet = this.checkCondition(context);
        // 添加条件判断结果
        results.push(this.createResult(conditionMet, 'both', 'conditional', `条件${this.params.condition}判定: ${conditionMet ? '成功' : '失败'}`, conditionMet ? 1 : 0));
        // 根据条件执行对应分支的效果
        const effectsToExecute = conditionMet ? this.thenEffects : this.elseEffects;
        for (const effect of effectsToExecute) {
            const subResults = effect.execute(context);
            results.push(...subResults);
        }
        return results;
    }
    checkCondition(context) {
        switch (this.params.condition) {
            case IAtomicEffect_1.ConditionType.ALWAYS:
                return true;
            case IAtomicEffect_1.ConditionType.NEVER:
                return false;
            case IAtomicEffect_1.ConditionType.PROBABILITY:
                return this.checkProbability(Number(this.params.probability ?? (this.params.value || 50)));
            case IAtomicEffect_1.ConditionType.FIRST_STRIKE:
                return context.attacker.effectStates?._first ?? context.attacker.speed > context.defender.speed;
            case IAtomicEffect_1.ConditionType.SECOND_STRIKE:
                return !(context.attacker.effectStates?._first ?? context.attacker.speed > context.defender.speed);
            case IAtomicEffect_1.ConditionType.HP_LOWER_THAN_TARGET:
                return context.attacker.hp < context.defender.hp;
            case IAtomicEffect_1.ConditionType.HP_PERCENT_BELOW: {
                const pet = this.params.target === 'opponent' ? context.defender : context.attacker;
                const threshold = this.params.hpDivisor ? 100 / Number(this.params.hpDivisor) : Number(this.params.value);
                return pet.maxHp > 0 && pet.hp * 100 < pet.maxHp * threshold;
            }
            case IAtomicEffect_1.ConditionType.SELF_HAS_STATUS:
            case IAtomicEffect_1.ConditionType.TARGET_HAS_STATUS: {
                const pet = this.params.condition === IAtomicEffect_1.ConditionType.SELF_HAS_STATUS ? context.attacker : context.defender;
                return [].concat(this.params.value).some(status => (pet.statusDurations?.[Number(status)] ?? 0) > 0);
            }
            case IAtomicEffect_1.ConditionType.SAME_TYPE:
                return this.params.compare === 'opponent' ? context.attacker.type === context.defender.type : context.skillType === context.attacker.type;
            case IAtomicEffect_1.ConditionType.SELF_HAS_STAT_DEBUFF:
            case IAtomicEffect_1.ConditionType.TARGET_HAS_STAT_DEBUFF: {
                const pet = this.params.condition === IAtomicEffect_1.ConditionType.SELF_HAS_STAT_DEBUFF ? context.attacker : context.defender;
                return (pet.battleLevels ?? []).some(level => level < 0);
            }
            default:
                this.log(`未实现的条件类型: ${this.params.condition}`, 'warn');
                return false;
        }
    }
    validate(params) {
        return params && params.type === IAtomicEffect_1.AtomicEffectType.CONDITIONAL &&
            Object.values(IAtomicEffect_1.ConditionType).includes(params.condition);
    }
}
exports.ConditionalCheck = ConditionalCheck;
//# sourceMappingURL=ConditionalCheck.js.map