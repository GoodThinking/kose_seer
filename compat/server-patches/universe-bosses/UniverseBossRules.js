'use strict';

const {hasElement} = require('./UniverseBossElements');

function beginTurn(battle) {
    if (!battle.universeBoss) return;
    const state = battle.universeBossState || (battle.universeBossState = {});
    if (battle.universeBoss.petId === 361) state.batteryActed = false;
    if (battle.universeBoss.petId === 1055) state.cannonActed = false;
    if (battle.universeBoss.petId === 1337 && battle.enemy.hp > 0 && battle.enemy.hp * 10 <= battle.enemy.maxHp * 3) state.dragonOverload = true;
    if (battle.universeBoss.petId === 1484 && battle.enemy.hp > 0) {
        if (state.alloyLayers === undefined) state.alloyLayers = 2;
        if (battle.enemy.hp * 2 <= battle.enemy.maxHp) { state.alloySecondPhase = true; state.alloyLayers = 0; }
        if (battle.enemy.hp * 10 <= battle.enemy.maxHp * 3) state.alloyFinalPhase = true;
    }
}
function endTurn(battle) {
    if (!battle.universeBoss || battle.enemy.hp <= 0) return;
    const state = battle.universeBossState || (battle.universeBossState = {});
    if (battle.universeBoss.petId === 361 && battle.enemy.hp * 2 <= battle.enemy.maxHp &&
        (state.batteryDeclarations || 0) < 2 && battle.turn + 1 >= (state.batteryLastUse || -4) + 4 &&
        require('./UniverseBossBudget').canHeal(battle, {roundOffset: 1}) && require('./UniverseBossBudget').healingRemaining(battle) > 0) {
        const index = battle.enemy.skills.indexOf(20392);
        if (index >= 0 && battle.enemy.skillPP[index] > 0) {
            state.batteryTurn = battle.turn + 1;
            state.batteryDeclarations = (state.batteryDeclarations || 0) + 1;
        }
    }
    if (battle.universeBoss.petId === 1055 && state.scanLastTurn === battle.turn && state.scanCount >= 2) {
        state.cannonTurn = battle.turn + 1;
        state.scanCount = 0;
    }
    if (battle.universeBoss.petId === 888 && !(state.magazineBrokenThrough >= battle.turn)) {
        if (state.magazineLayers === undefined) state.magazineLayers = 3;
        state.magazineLayers = Math.min(3, state.magazineLayers + 1);
    }
    if (battle.universeBoss.petId === 503 && battle.turn % 3 === 0 && (battle.enemy.battleLevels?.[0] || 0) <= 0)
        state.tigerTurn = battle.turn + 1;
}


function replacementSkill(battle, selected, configs) {
    if (battle.universeBoss?.petId !== 361 || selected.id !== 20392 || battle.universeBossState?.batteryInterrupted !== battle.turn) return selected;
    const enemy = battle.enemy;
    const preferred = enemy.skills.indexOf(10871);
    let index = preferred >= 0 && enemy.skillPP[preferred] > 0 ? preferred : enemy.skills.findIndex((id, i) => enemy.skillPP[i] > 0 && [1, 2].includes(configs.get(id)?.category));
    return index < 0 ? null : require('../Pet/Countermarks').Skill(enemy, configs.get(enemy.skills[index]));
}


function onAction(battle, attacker, skill) {
    if (!battle.universeBoss) return;
    const state = battle.universeBossState || (battle.universeBossState = {});
    if (attacker === battle.enemy) (state.skillLastUse || (state.skillLastUse = {}))[skill.id] = battle.turn;
    if (attacker === battle.enemy) {
        state.statusActions = skill.category === 4 ? (state.statusLastTurn === battle.turn - 1 ? (state.statusActions || 0) + 1 : 1) : 0;
        state.statusLastTurn = battle.turn;
    }
    if (battle.universeBoss.petId === 361 && attacker === battle.enemy) {
        state.batteryActed = true;
        if (skill.id === 20392) state.batteryLastUse = battle.turn;
    }
    if (battle.universeBoss.petId === 1055 && attacker === battle.enemy) state.cannonActed = true;
    if (battle.universeBoss.petId === 1204 && attacker === battle.player && skill.id > 0) {
        (state.ppLastSkills || (state.ppLastSkills = new Map())).set(attacker.catchTime || attacker, skill.id);
    }
    if (battle.universeBoss.petId === 1204 && attacker === battle.enemy && skill.id === 12902 && (state.ppExtraCount || 0) < 4) {
        const lastSkill = state.ppLastSkills?.get(battle.player.catchTime || battle.player);
        const index = battle.player.skills.indexOf(lastSkill);
        if (index >= 0 && battle.player.skillPP[index] > 0) {
            battle.player.skillPP[index]--;
            state.ppExtraCount = (state.ppExtraCount || 0) + 1;
        }
    }
}

function onStatClear(battle, source, target, indices, changes = []) {
    if (!battle.universeBoss || source !== battle.player || target !== battle.enemy) return;
    indices = changes.filter(change => change.before > 0 && change.after === 0).map(change => change.index);
    if (!indices.length) return;
    const state = battle.universeBossState || (battle.universeBossState = {});
    if (battle.universeBoss.petId === 1266) state.dragonDispelTurn = battle.turn + 1;
    if (battle.universeBoss.petId === 1337 && indices.some(i => i === 1 || i === 3)) state.dragonArmorOpenTurn = battle.turn + 1;
    if (battle.universeBoss.petId === 505 && indices.some(i => i === 0 || i === 2) && (target.battleLevels?.[0] || 0) <= 0 && (target.battleLevels?.[2] || 0) <= 0) state.trialWeakenTurn = battle.turn + 1;
}

function afterAction(battle, attacker, defender, skill, result, context) {
    if (!battle.universeBoss || battle.enemy.hp <= 0) return;
    const state = battle.universeBossState || (battle.universeBossState = {});
    if (battle.universeBoss.petId === 1055 && attacker === battle.player && context.acted && result?.skillId === skill.id && skill.id > 0) {
        if (skill.category === 4) {
            state.scanCount = state.scanLastTurn === battle.turn - 1 ? (state.scanCount || 0) + 1 : 1;
            state.scanLastTurn = battle.turn;
        } else state.scanCount = 0;
    }
    if (battle.universeBoss.petId === 1354 && attacker === battle.enemy && skill.id === 13156 && context.acted && context.hit && defender.statusDurations?.[5] > 0 && defender.hp > 0) {
        const extra = require('./UniverseBossBudget').damage(battle, attacker, defender, 'fraction', Math.floor(defender.maxHp * 0.08));
        const actual = Math.min(defender.hp, extra);
        defender.hp -= actual;
    }
    if (!context.acted || attacker !== battle.player) return;
    const defenseWeakenedBelowZero = (context.statDecreases || []).some(change =>
        change.target === battle.enemy && (change.index === 1 || change.index === 3) && change.after < 0);
    if (battle.universeBoss.petId === 888 && defenseWeakenedBelowZero) {
        state.magazineLayers = 0;
        state.magazineBrokenThrough = battle.turn + 2;
    }
    if (battle.universeBoss.petId === 1484 && defenseWeakenedBelowZero) state.alloyLayers = 0;
    if (battle.universeBoss.petId === 505 && (context.statDecreases || []).some(change => change.target === battle.enemy && [0, 2].includes(change.index)) && battle.enemy.battleLevels[0] <= 0 && battle.enemy.battleLevels[2] <= 0) state.trialWeakenTurn = battle.turn + 1;
}

// Applied only to the explicitly identified boss battle, never to a player's pet.
// skillReduced is the engine's damage after its normal defensive effects.  The
// specialist shield replaces a weaker same-purpose reduction, rather than
// multiplying with it.
function modifyDirectDamage(battle, attacker, defender, skill, beforeDefense, skillReduced) {
    if (battle.universeBoss && attacker === battle.enemy && defender === battle.player && (skill.category === 1 || skill.category === 2)) {
        const state = battle.universeBossState || {};
        let factor = 100;
        if (battle.universeBoss.petId === 1055 && skill.id === 12480 && state.cannonTurn === battle.turn && state.cannonCancelled !== battle.turn) factor += 40;
        return Math.floor(skillReduced * factor / 100);
    }
    if (!battle.universeBoss || defender !== battle.enemy || attacker !== battle.player || !(beforeDefense > 0)) return skillReduced;
    const category = skill.category;
    if (category !== 1 && category !== 2) return skillReduced;
    if (battle.universeBoss.petId === 888) {
        const state = battle.universeBossState || (battle.universeBossState = {});
        if (state.magazineLayers === undefined) state.magazineLayers = 3;
        if (state.magazineLayers > 0) return Math.min(skillReduced, Math.floor(beforeDefense * (100 - state.magazineLayers * 20) / 100));
    }
    const turn = battle.turn;
    let reduction = 0;
    let vulnerability = 0;
    switch (battle.universeBoss.petId) {
    case 1266: {
        const phase = (turn - 1) % 3;
        if ((phase === 0 && category === 2) || (phase === 1 && category === 1)) reduction = 60;
        if (battle.universeBossState?.dragonDispelTurn === turn) {
            reduction = Math.min(reduction, 30);
            if (skillReduced > 0) skillReduced = Math.max(skillReduced, Math.floor(beforeDefense * 0.7));
        }
        if (phase === 2) vulnerability = 25;
        break;
    }
    case 505: {
        const state = battle.universeBossState || (battle.universeBossState = {});
        const levels = defender.battleLevels || [];
        if ((levels[0] || 0) > 0 || (levels[2] || 0) > 0) reduction = 50;
        if (state.trialWeakenTurn === turn) reduction = Math.min(reduction, 30);
        break;
    }
    case 898: {
        const state = battle.universeBossState || (battle.universeBossState = {});
        if (state.adaptTurn === turn && state.adaptCategory === category) reduction = 60;
        break;
    }
    case 1337: {
        const state = battle.universeBossState || {};
        const levels = defender.battleLevels || [];
        if ((levels[1] || 0) >= 0 && (levels[3] || 0) >= 0) reduction = state.dragonArmorOpenTurn === turn ? 30 : 70;
        break;
    }
    case 1484: {
        const state = battle.universeBossState || (battle.universeBossState = {});
        if (!state.alloySecondPhase) {
            if (state.alloyLayers === undefined) state.alloyLayers = 2;
            reduction = state.alloyLayers * 25;
        }
        break;
    }
    case 1354:
        if ((turn - 1) % 3 === 1 && !(battle.player.statusDurations?.[5] > 0)) vulnerability = 20;
        break;
    case 1319:
        if ((turn - 1) % 4 < 2 && category === 1) reduction = skill.mustHit ? 30 : 70;
        else if ((turn - 1) % 4 >= 2) vulnerability = 20;
        break;
    case 1204:
        if (category === ((turn - 1) % 4 < 2 ? 1 : 2)) reduction = 50;
        break;
    case 503:
        if ((defender.battleLevels?.[0] || 0) > 0) reduction = 40;
        break;
    case 1055: {
        const levels = defender.battleLevels || [];
        if ((levels[1] || 0) > 0 || (levels[3] || 0) > 0) reduction = 30;
        break;
    }
    case 1122: {
        const state = battle.universeBossState || (battle.universeBossState = {});
        if (state.feathers === undefined) state.feathers = 3;
        if ((turn - 1) % 4 !== 3 && !skill.mustHit) reduction = state.feathers * 20;
        break;
    }
    case 1494: {
        const state = battle.universeBossState || (battle.universeBossState = {});
        if (state.lightCurtain === undefined) state.lightCurtain = 60;
        if (category === 2) reduction = state.lightCurtain;
        break;
    }
    default:
        return skillReduced;
    }
    const reduced = reduction > 0 ? Math.min(skillReduced, Math.floor(beforeDefense * (100 - reduction) / 100)) : skillReduced;
    return Math.floor(reduced * (100 + vulnerability) / 100);
}

// Called only after the engine's normal hit and HP deduction.  Multi-hit skills
// are one action in this engine and therefore open at most one window.
function afterDirectDamage(battle, attacker, defender, skill, actualDamage) {
    if (!battle.universeBoss || attacker !== battle.player || defender !== battle.enemy || (skill.category !== 1 && skill.category !== 2)) return;
    const state = battle.universeBossState || (battle.universeBossState = {});
    if (actualDamage <= 0) return;
    if (battle.universeBoss.petId === 361 && skill.category === 1 && state.batteryTurn === battle.turn && !state.batteryActed) state.batteryInterrupted = battle.turn;
    if (battle.universeBoss.petId === 1122 && skill.mustHit) state.feathers = Math.max(0, (state.feathers ?? 3) - 1);
    if (battle.universeBoss.petId === 898 && actualDamage > 0) {
        state.adaptCategory = skill.category;
        state.adaptTurn = battle.turn + 1;
    }
    if (battle.universeBoss.petId === 1484 && actualDamage > 0) {
        if (state.alloySecondPhase) {
            state.alloyLayers = 0;
        } else {
            if (state.alloyLastCategory && state.alloyLastCategory !== skill.category) state.alloyLayers = 0;
            state.alloyLastCategory = skill.category;
        }
    }
    if (battle.universeBoss.petId === 1055 && state.cannonTurn === battle.turn && !state.cannonActed && actualDamage > 0) state.cannonCancelled = battle.turn;
    if (battle.universeBoss.petId === 1494 && (skill.category === 1 || skill.category === 2 && (hasElement(skill, 3) || hasElement(skill, 7)))) {
        if (state.lightCurtain === undefined) state.lightCurtain = 60;
        const before = state.lightCurtain;
        state.lightCurtain = Math.max(0, state.lightCurtain - 20);
        if (before > 0 && state.lightCurtain === 0 && !state.lightFirstBreak) { state.lightFirstBreak = true; state.lightSkillTurn = battle.turn + 1; }
    }
}

function selectLegalSkill(battle, proposed, configs) {
    if (!battle.universeBoss) return proposed;
    const boss = battle.enemy;
    const usable = (id, index) => {
        if (!(id > 0 && boss.skillPP[index] > 0 && configs.has(id))) return false;
        const state = battle.universeBossState || {};
        const last = state.skillLastUse?.[id];
        const cooldown = ({21102: 4, 21113: 4, 21289: 4, 21288: 3, 21632: 4, 21603: 4})[id];
        if (cooldown && last !== undefined && battle.turn - last < cooldown) return false;
        if (battle.universeBoss.petId === 888 && id === 21102 && ((boss.battleLevels?.[1] || 0) > 0 || (boss.battleLevels?.[3] || 0) > 0 || state.magazineBrokenThrough >= battle.turn)) return false;
        if (battle.universeBoss.petId === 1319 && id === 21603 && (battle.turn - 1) % 4 !== 0) return false;
        if (battle.universeBoss.petId === 1337 && id === 20337 && (state.dragonOverload || boss.hp * 10 <= boss.maxHp * 3)) return false;
        if (battle.universeBoss.petId === 1484 && id === 21112 && (state.alloyFinalPhase || boss.hp * 10 <= boss.maxHp * 3)) return false;
        const move = configs.get(id);
        const effects = String(move.sideEffect || '').trim().split(/\s+/).filter(Boolean);
        if (![505, 1204, 1354].includes(battle.universeBoss.petId) && !(battle.universeBoss.petId === 1319 && id === 21603) && !(battle.universeBoss.petId === 503 && id === 20853 && state.tigerTurn === battle.turn) && move.category === 4 && effects.length && effects.every(effect => effect === '4')) {
            const args = String(move.sideEffectArg || '').trim().split(/\s+/).map(Number);
            const boosted = effects.map((_, n) => [args[n * 3], args[n * 3 + 2]]).filter(([stat, change]) => Number.isInteger(stat) && change > 0);
            if (boosted.length && (boosted.some(([stat]) => (boss.battleLevels?.[stat] || 0) > 0) || last !== undefined && battle.turn - last < 4)) return false;
        }
        if (battle.universeBoss.petId === 361 && id === 20392 && state.batteryTurn !== battle.turn) return false;
        return true;
    };
    let fixed;
    if (battle.universeBoss.petId === 361 && battle.universeBossState?.batteryTurn === battle.turn) fixed = 20392;
    if (battle.universeBoss.petId === 503 && battle.universeBossState?.tigerTurn === battle.turn) fixed = 20853;
    if (battle.universeBoss.petId === 1055 && battle.universeBossState?.cannonTurn === battle.turn) fixed = 12480;
    if (battle.universeBoss.petId === 1494 && battle.universeBossState?.lightSkillTurn === battle.turn) fixed = 21839;
    if (battle.universeBoss.petId === 888 && [1, 2].includes(configs.get(proposed)?.category)) fixed = 12134;
    if (battle.universeBoss.petId === 1319 && (battle.turn - 1) % 4 === 0) fixed = 21603;
    if (battle.universeBoss.petId === 1204) fixed = [21511, 12906, 21510, 12902][(battle.turn - 1) % 4];
    if (battle.universeBoss.petId === 1354) fixed = [13158, 13156, 0][(battle.turn - 1) % 3];
    if (battle.universeBoss.petId === 505) {
        const phase = (battle.turn - 1) % 4;
        if (phase < 3) fixed = [21895, 13554, 13550][phase];
        else if (boss.hp * 100 <= boss.maxHp * 40 && require('./UniverseBossBudget').canHeal(battle)) fixed = 21894;
        else fixed = -1;
    }
    if (fixed === undefined && battle.universeBossState?.statusActions >= 2 && battle.universeBossState.statusLastTurn === battle.turn - 1 && configs.get(proposed)?.category === 4) proposed = 0;
    if (fixed > 0) proposed = fixed;
    if (fixed === -1) proposed = 0;
    const proposedIndex = boss.skills.indexOf(proposed);
    if (proposedIndex >= 0 && usable(proposed, proposedIndex)) return proposed;
    const attackIndex = boss.skills.findIndex((id, index) => usable(id, index) && [1, 2].includes(configs.get(id).category));
    if (attackIndex >= 0) return boss.skills[attackIndex];
    const anyIndex = boss.skills.findIndex(usable);
    return anyIndex >= 0 ? boss.skills[anyIndex] : 0;
}

function nextTelegraph(battle) {
    if (!battle?.universeBoss || battle.enemy.hp <= 0) return null;
    const next = battle.turn + 1, state = battle.universeBossState || {};
    switch (battle.universeBoss.petId) {
    case 361:
        if (state.batteryTurn === next) return `第${next}回合预告：浓缩电池；执行前物理攻击命中可取消回复，改用普通攻击。`;
        return null;
    case 503:
        if (state.tigerTurn === next) return `第${next}回合预告：猛虎下山；PP不足时改用可用攻击。`;
        return `第${next}回合：${(battle.enemy.battleLevels?.[0] || 0) > 0 ? '攻击强化维持虎威护盾，普通直伤减伤40%' : '攻击未强化，虎威护盾关闭'}。`;
    case 888:
        return `第${next}回合：装甲${state.magazineLayers ?? 3}层，破防可清空并暂停补甲；每个攻击命中段消耗一层。`;
    case 898:
        return `第${next}回合：${state.adaptTurn === next ? `适应${state.adaptCategory === 1 ? '物理' : '特殊'}直伤，减伤60%` : '适应防护未建立'}。`;
    case 1055:
        return state.cannonTurn === next ? `第${next}回合预告：离子加农炮伤害+40%；先手有效直伤可取消加成。` : `第${next}回合：连续属性扫描${state.scanCount || 0}/2。`;
    case 1122:
        return `第${next}回合：光羽${state.feathers ?? 3}片；${next % 4 === 0 ? '落地暂停防护' : '非必中攻击每片减伤20%'}。`;
    case 1266: {
        const phase = (next - 1) % 3;
        return `第${next}回合：${phase === 0 ? '特殊防护60%' : phase === 1 ? '物理防护60%' : '无防护且普通直伤易伤25%'}${state.dragonDispelTurn === next ? '，消强将防护限制为30%' : ''}。`;
    }
    case 1337:
        return `第${next}回合：龙铠${state.dragonArmorOpenTurn === next ? '消强窗口，最高减伤30%' : '双防非负时减伤70%'}。`;
    case 1484:
        return `第${next}回合：${state.alloySecondPhase ? '半血后合金护甲已永久撤下' : `合金护甲${state.alloyLayers ?? 2}层`}。`;
    case 1494:
        return state.lightSkillTurn === next ? `第${next}回合预告：黎明曙光；可准备消强。` : `第${next}回合：光幕特殊减伤${state.lightCurtain ?? 60}%。`;
    case 1204: {
        const names = ['圣光觉醒', '普通攻击', '八荒', '乾坤圣灵绝'];
        return `第${next}回合预告：${names[(next - 1) % 4]}；技能PP不足时改用可用攻击。`;
    }
    case 1354: {
        const names = ['冰封时刻', '寒冰破碎拳', '普通选招'];
        return `第${next}回合预告：${names[(next - 1) % 3]}；技能PP不足时改用可用攻击。`;
    }
    case 505: {
        if (next === 1) return '第1回合预告：六道轮回→苍茫永麟绝→天启诛魔印→回复或普通攻击；PP不足另选可用招式。';
        const names = ['六道轮回', '苍茫永麟绝', '天启诛魔印', '回复或普通攻击'];
        return `第${next}回合预告：${names[(next - 1) % 4]}；技能PP不足时改用可用攻击。`;
    }
    case 1319:
        return `第${next}回合：${(next - 1) % 4 < 2 ? '旋转，物理攻击减伤70%，必中物理减伤30%' : '过热，直接攻击易伤20%'}。`;
    default:
        return null;
    }
}


function onDirectDamageSegment(battle, attacker, defender, skill, segment) {
    if (battle.universeBoss?.petId !== 888 || attacker !== battle.player || defender !== battle.enemy || segment.actualDamage <= 0) return;
    const state = battle.universeBossState || (battle.universeBossState = {});
    state.magazineLayers = Math.max(0, (state.magazineLayers ?? 3) - 1);
}
const core = {beginTurn, endTurn, onAction, onStatClear, afterAction, replacementSkill, modifyDirectDamage, onDirectDamageSegment, afterDirectDamage, selectLegalSkill, nextTelegraph};
const biomeIds = new Set([367,858,943,976,1061,1134,1145,1191,1212,1416,1427,1429,1439,1477,502,1200,1201,1202,1297,1298]);
const frontierIds = new Set([912,925,1025,1308,1325,1346,1360,1371,1405,1431,1458,1473,125,1000,1121]);
function owner(battle) {
    if (require('./SPTBossRules').active(battle)) return require('./SPTBossRules');
    const id = battle?.universeBoss?.petId;
    if (biomeIds.has(id)) return require('./UniverseBossBiomes');
    if (frontierIds.has(id)) return require('./UniverseBossFrontier');
    return core;
}
function route(name, fallback) {
    return (battle, ...args) => {
        const fn = owner(battle)[name];
        return fn ? fn(battle, ...args) : fallback?.(battle, ...args);
    };
}
const routedOnAction = route('onAction');
function countAction(battle, attacker, skill) {
    require('./UniverseBossBudget').spendExhaustedAttack(battle, attacker, skill);
    return routedOnAction(battle, attacker, skill);
}
module.exports = {
    beginTurn: route('beginTurn'), endTurn: route('endTurn'), onAction: countAction, onHit: route('onHit'),
    onMiss: route('onMiss'), onStatClear: route('onStatClear'), afterAction: route('afterAction'),
    replacementSkill: route('replacementSkill', (battle, selected) => selected),
    beforeDirectDamage: route('beforeDirectDamage'),
    modifyDirectDamage: route('modifyDirectDamage', (battle, attacker, defender, skill, before, reduced) => reduced),
    onDirectDamageSegment: route('onDirectDamageSegment'),
    afterDirectDamage: route('afterDirectDamage'), afterBossSkill: route('afterBossSkill'),
    selectLegalSkill: route('selectLegalSkill', (battle, proposed) => proposed),
    nextTelegraph: route('nextTelegraph', () => null),
    modifyIndirectDamage: route('modifyIndirectDamage', (battle, attacker, defender, kind, amount) => amount),
    modifyHealing: route('modifyHealing', (battle, amount) => amount)
};
