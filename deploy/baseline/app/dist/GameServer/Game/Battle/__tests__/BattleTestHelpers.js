"use strict";
/**
 * 战斗测试辅助工具
 * 提供 IBattlePet、IEffectContext 等对象的 mock 构建函数
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockBattlePet = createMockBattlePet;
exports.createAttacker = createAttacker;
exports.createDefender = createDefender;
exports.createMockEffectContext = createMockEffectContext;
exports.createEffectContextSimple = createEffectContextSimple;
exports.createDamageContext = createDamageContext;
exports.createPetWithStages = createPetWithStages;
exports.createPetWithStatus = createPetWithStatus;
exports.resetPetHp = resetPetHp;
exports.applyDamage = applyDamage;
exports.healPet = healPet;
exports.useSkill = useSkill;
exports.tickTurnStart = tickTurnStart;
const EffectContext_1 = require("../effects/core/EffectContext");
const BattleAlgorithm_1 = require("../BattleAlgorithm");
/**
 * 创建测试用精灵数据
 */
function createMockBattlePet(options = {}) {
    const defaultPet = {
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
function createAttacker(options = {}) {
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
function createDefender(options = {}) {
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
function createMockEffectContext(attacker, defender, options = {}) {
    const defaultContext = {
        attacker,
        defender,
        skillId: 1001,
        skillType: 1,
        skillCategory: BattleAlgorithm_1.SkillCategory.PHYSICAL,
        skillPower: 80,
        damage: 0,
        originalDamage: 0,
        turn: 1,
        timing: EffectContext_1.EffectTiming.BEFORE_SKILL,
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
function createEffectContextSimple(attackerHp = 300, defenderHp = 280, attackerType = 1, defenderType = 2) {
    const attacker = createAttacker({ hp: attackerHp, maxHp: attackerHp, type: attackerType });
    const defender = createDefender({ hp: defenderHp, maxHp: defenderHp, type: defenderType });
    return createMockEffectContext(attacker, defender);
}
/**
 * 模拟造成伤害后的效果上下文
 */
function createDamageContext(baseDamage, attacker, defender) {
    return createMockEffectContext(attacker, defender, {
        damage: baseDamage,
        originalDamage: baseDamage,
        timing: EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY
    });
}
/**
 * 创建精灵并应用能力等级
 */
function createPetWithStages(stages, isAttacker = true) {
    const pet = isAttacker ? createAttacker() : createDefender();
    pet.battleLevels = [...stages];
    return pet;
}
/**
 * 创建精灵并设置状态
 */
function createPetWithStatus(status, turns = 3) {
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
function resetPetHp(pet, hp) {
    pet.hp = hp || pet.maxHp;
    return pet;
}
/**
 * 造成伤害
 */
function applyDamage(pet, damage) {
    pet.hp = Math.max(0, pet.hp - damage);
    return pet;
}
/**
 * 恢复HP
 */
function healPet(pet, amount) {
    pet.hp = Math.min(pet.maxHp, pet.hp + amount);
    return pet;
}
/**
 * 模拟技能使用（减少PP）
 */
function useSkill(pet, skillIndex) {
    if (!pet.skillPP || !pet.skills[skillIndex])
        return false;
    if (pet.skillPP[skillIndex] <= 0)
        return false;
    pet.skillPP[skillIndex]--;
    pet.lastMove = pet.skills[skillIndex];
    return true;
}
/**
 * 模拟回合开始（状态持续时间减少）
 */
function tickTurnStart(pet) {
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
//# sourceMappingURL=BattleTestHelpers.js.map