'use strict';

const {hasElement} = require('./UniverseBossElements');

const IDS = new Set([912, 925, 1025, 1308, 1325, 1346, 1360, 1371, 1405, 1431, 1458, 1473, 125, 1000, 1121]);
const attack = skill => skill && (skill.category === 1 || skill.category === 2);
const state = battle => battle.universeBossState || (battle.universeBossState = {});
const id = battle => battle.universeBoss?.petId;
const levels = pet => pet.battleLevels || [0, 0, 0, 0, 0, 0];
const armored = pet => levels(pet)[1] >= 0 && levels(pet)[3] >= 0;
const positiveDefense = pet => levels(pet)[1] > 0 || levels(pet)[3] > 0;
const live = battle => IDS.has(id(battle)) && battle.enemy.hp > 0;
const playerKey = pet => pet.catchTime ?? pet;
const budget = () => require('./UniverseBossBudget');
const isFatigued = pet => !!pet.fatigue || pet.fatigueTurns > 0 || pet.statusDurations?.[7] > 0;

function beginTurn(battle) {
    if (!live(battle)) return;
    const s = state(battle);
    s.frontierBossActed = false;
    if (id(battle) === 1346 && s.quicksandPet !== playerKey(battle.player)) {
        s.quicksandPet = playerKey(battle.player);
        s.quicksandLayers = 0;
        s.quicksandActions = 0;
    }
}

function endTurn(battle) {
    if (!live(battle)) return;
    const s = state(battle), boss = battle.enemy, turn = battle.turn;
    switch (id(battle)) {
    case 925:
        if (!s.stoneThreshold && boss.hp * 2 < boss.maxHp) {
            s.stoneThreshold = true;
            s.stoneReformTurn = turn + 1;
        }
        break;
    case 1308:
        if (s.earthAttributeTurn === turn) {
            budget().queuePeriodicHeal(battle, boss, Math.floor(boss.maxHp * 0.05), 'earth-spirit');
        }
        break;
    case 1346:
        if (s.quicksandActionTurn === turn && s.quicksandActions % 2 === 0) s.quicksandLayers = Math.min(2, (s.quicksandLayers || 0) + 1);
        break;
    case 1360:
        if (!s.earthWallThreshold && boss.hp * 2 <= boss.maxHp) {
            s.earthWallThreshold = true;
            s.earthWallReformTurn = turn + 1;
        }
        break;
    case 1473: {
        if (s.contractTurn === turn) s.contractTurn = 0;
        const low = boss.hp * 100 <= boss.maxHp * 30;
        const middle = boss.hp * 100 <= boss.maxHp * 60;
        if (low && !s.contract30) {
            s.contract30 = true;
            s.contract60 = true;
            s.contractTurn = turn + 1; s.contractActive = true; s.contractHits = 0;
        } else if (middle && !s.contract60) {
            s.contract60 = true;
            s.contractTurn = turn + 1; s.contractActive = true; s.contractHits = 0;
        }
        break;
    }
    case 125:
        if (turn % 3 === 0) {
            s.bladeTurn = turn + 1;
            s.bladeBroken = !!s.bladeHistory?.[turn] && !!s.bladeHistory?.[turn - 1] && s.bladeHistory[turn] !== s.bladeHistory[turn - 1];
        }
        break;
    }
}

function onAction(battle, attacker, skill) {
    if (!live(battle)) return;
    const s = state(battle);
    if (attacker === battle.enemy) {
        s.frontierBossActed = true;
        if (skill?.id) {
            (s.frontierCooldowns || (s.frontierCooldowns = {}))[skill.id] = battle.turn;
            s.frontierStatusStreak = skill.category === 4 ? (s.frontierStatusStreak || 0) + 1 : 0;
            if (id(battle) === 1473 && skill.id === 21811) s.contractHealUses = (s.contractHealUses || 0) + 1;
        }
        return;
    }
    if (attacker !== battle.player) return;
    if (id(battle) === 1308 && skill.category === 4) s.earthEffectsBefore = {...battle.player.effectStates};
}

function breakContract(battle, s) {
    if (!s.contractActive) return;
    s.contractActive = false;
}



function modifyDirectDamage(battle, attacker, defender, skill, beforeDefense, skillReduced) {
    if (!live(battle) || !attack(skill)) return skillReduced;
    const s = state(battle), turn = battle.turn, species = id(battle);
    if (attacker === battle.enemy && defender === battle.player) {
        if (species === 125 && s.bladeTurn === turn && !s.bladeBroken) return Math.floor(skillReduced * 1.3);
        return skillReduced;
    }
    if (attacker !== battle.player || defender !== battle.enemy || !(beforeDefense > 0)) return skillReduced;
    if (species === 1346) return Math.floor(skillReduced * (100 - (s.quicksandLayers || 0) * 20) / 100);
    let reduction = 0, vulnerability = 0;
    switch (species) {
    case 912: if ((turn - 1) % 3 < 2) reduction = skill.mustHit ? 0 : 60; else vulnerability = 20; break;
    case 925: if (armored(defender)) reduction = 70; break;
    case 1025: if (s.resonanceCategory === skill.category && s.resonanceCount >= 2) reduction = 60; break;
    case 1308: if (s.earthOpenTurn === turn) vulnerability = 25; break;
    case 1360: if (positiveDefense(defender)) reduction = 50; if (s.earthWallOpenTurn === turn) vulnerability = 20; break;
    case 1371:
        if ((turn - 1) % 3 < 2 && s.cloudBrokenCycle !== Math.floor((turn - 1) / 3) && !skill.mustHit) reduction = 50;
        if ((turn - 1) % 3 === 2) vulnerability = 20;
        break;
    case 1405: if (s.echoDamageSkill === skill.id) reduction = 60; break;
    case 1431: reduction = (s.rockLayers ?? 2) * 25; break;
    case 1458:
        if ((turn - 1) % 4 < 2 && s.sandOpenTurn !== turn) reduction = 60;
        else vulnerability = 20;
        break;
    case 1473: if (s.contractActive) reduction = 50; break;
    case 1000: if (turn % 3 === 0) vulnerability = 20; else if (s.mirrorHitTurn === turn - 1 && s.mirrorHitSkill === skill.id) reduction = 60; break;
    case 1121: reduction = (s.giantLayers ?? 2) * 20; break;
    }
    return Math.floor(Math.min(skillReduced, Math.floor(beforeDefense * (100 - reduction) / 100)) * (100 + vulnerability) / 100);
}


function onDirectDamageSegment(battle, attacker, defender, skill, segment) {
    if (!live(battle) || id(battle) !== 1121 || attacker !== battle.player || defender !== battle.enemy || !attack(skill) || segment.actualDamage <= 0) return;
    const s = state(battle);
    s.giantLayers = s.giantLayers ?? 2;
    s.giantDamage = (s.giantDamage || 0) + segment.actualDamage;
    while (s.giantLayers > 0 && s.giantDamage * 10 >= defender.maxHp) {
        s.giantLayers--;
        s.giantDamage -= defender.maxHp / 10;
    }
}

function afterDirectDamage(battle, attacker, defender, skill, actualDamage) {
    if (!battle.universeBoss || attacker !== battle.player || defender !== battle.enemy || !attack(skill)) return;
    const s = state(battle), turn = battle.turn;
    if (actualDamage <= 0) return;
    if (id(battle) === 125) {
        (s.bladeHistory || (s.bladeHistory = {}))[turn] = skill.id;
        delete s.bladeHistory[turn - 2];
    }
    if (id(battle) === 1473 && s.contractActive && ++s.contractHits >= 2) breakContract(battle, s);
    if (id(battle) === 1371 && skill.mustHit) s.cloudBrokenCycle = Math.floor((turn - 1) / 3);
    if (id(battle) === 1346 && (hasElement(skill, 2) || hasElement(skill, 4))) s.quicksandLayers = Math.max(0, (s.quicksandLayers || 0) - 1);
    if (id(battle) === 1000) { s.mirrorHitTurn = turn; s.mirrorHitSkill = skill.id; }
    switch (id(battle)) {
    case 1025:
        if (actualDamage > 0 && s.resonanceHitTurn !== turn) {
            s.resonanceHitTurn = turn;
            s.resonanceCount = s.resonanceCategory === skill.category ? (s.resonanceCount || 0) + 1 : 1;
            s.resonanceCategory = skill.category;
        }
        break;
    case 1325:
        if (actualDamage > 0 && skill.category === 1 && s.stubbornActionTurn !== turn && (s.stubbornStacks || 0) < 2) {
            s.stubbornActionTurn = turn;
            const stages = levels(defender);
            if (stages[0] < 6) { stages[0]++; s.stubbornStacks = (s.stubbornStacks || 0) + 1; }
        }
        break;
    case 1405:
        if (actualDamage > 0) { s.echoDamageTurn = turn; s.echoDamageSkill = skill.id; }
        break;
    case 1431:
        if (skill.category === 1 && s.rockHitTurn !== turn) { s.rockHitTurn = turn; s.rockLayers = Math.max(0, (s.rockLayers ?? 2) - 1); }
        break;
    case 1458:
        if (hasElement(skill, 2) && actualDamage > 0 && (turn - 1) % 4 < 2 && s.sandOpenTurn !== turn) s.sandOpenTurn = turn + 1;
        break;
    }
}


function afterAction(battle, attacker, defender, skill, result, context) {
    if (!live(battle) || attacker !== battle.player || !context?.acted) return;
    const s = state(battle), turn = battle.turn;
    const before = context.bossBeforeLevels || levels(battle.enemy), now = levels(battle.enemy);
    if (id(battle) === 1308 && skill.category === 4 && context.hit) {
        const changed = context.playerBeforeLevels.some((value, index) => levels(attacker)[index] !== value) ||
            before.some((value, index) => now[index] !== value) || attacker.hp !== context.playerHpBefore || defender.hp !== context.bossHpBefore ||
            Object.keys(attacker.effectStates || {}).some(key => attacker.effectStates[key] !== s.earthEffectsBefore?.[key]);
        if (changed) s.earthAttributeTurn = turn;
    }
    if (id(battle) === 1346) {
        const key = playerKey(attacker);
        if (s.quicksandPet !== key) {
            s.quicksandPet = key;
            s.quicksandLayers = 0;
            s.quicksandActions = 0;
        }
        s.quicksandActions = (s.quicksandActions || 0) + 1;
        s.quicksandActionTurn = turn;
    }
    if (id(battle) === 125 && s.bladeTurn === turn && !s.frontierBossActed && now[0] < before[0] && !context.statClears?.some(event => event.target === battle.enemy && event.changes.some(change => change.index === 0))) s.bladeBroken = true;
    if (id(battle) === 1121 && !s.giantDefenseBroken && [1, 3].some(i => before[i] >= 0 && now[i] < 0)) {
        s.giantLayers = Math.max(0, (s.giantLayers ?? 2) - 1); s.giantDefenseBroken = true;
    }
}
function onStatClear(battle, source, target, indices, changes) {
    if (!live(battle) || source !== battle.player || target !== battle.enemy || !changes?.some(change => change.before > 0 && change.after === 0)) return;
    const s = state(battle);
    if (id(battle) === 1325) s.stubbornStacks = 0;
    if (id(battle) === 1473) breakContract(battle, s);
}

function choose(battle, desired, configs) {
    const boss = battle.enemy, s = state(battle), species = id(battle), turn = battle.turn;
    const cooldown = {21127:4, 21264:4, 20279:4, 20888:4, 21618:4, 21646:4, 21645:4, 21791:4, 21677:4, 21811:4};
    const legal = (skillId, index) => {
        if (!(skillId > 0 && boss.skillPP[index] > 0 && configs.has(skillId))) return false;
        if (!fixed && (s.frontierStatusStreak || 0) >= 2 && configs.get(skillId).category === 4) return false;
        if (cooldown[skillId] && turn < (s.frontierCooldowns?.[skillId] ?? -999) + cooldown[skillId]) return false;
        if (skillId === 21126 && ((turn - 1) % 3 !== 0 || levels(boss)[0] > 0)) return false;
        if (skillId === 21264 && (levels(boss)[0] > 0 || levels(boss)[2] > 0)) return false;
        if (skillId === 21678 && ((turn - 1) % 3 !== 0 || levels(boss)[4] > 0)) return false;
        if (skillId === 21790 && (turn - 1) % 4 !== 0) return false;
        if (species === 1431 && skillId === 21757 && (boss.hp * 100 > boss.maxHp * 40 || boss.hp >= boss.maxHp || !budget().canHeal(battle))) return false;
        if (species === 1473 && skillId === 21812 && s.contractTurn !== turn) return false;
        if (species === 1473 && skillId === 21811 && ((s.contractHealUses || 0) >= 2 || !budget().canHeal(battle))) return false;
        if (skillId === 21677 && !budget().canHeal(battle)) return false;
        return true;
    };
    let fixed = 0;
    if (species === 925 && s.stoneReformTurn === turn) fixed = 21145;
    if (species === 1360 && s.earthWallReformTurn === turn) fixed = 21659;
    if (species === 1473 && s.contractTurn === turn) fixed = 21812;
    if (!fixed && species === 912 && (turn - 1) % 3 === 0) {
        const preferred = boss.skills.indexOf(21126);
        if (preferred >= 0 && legal(21126, preferred)) desired = 21126;
    }
    if (fixed) desired = fixed;
    const ix = boss.skills.indexOf(desired);
    if (ix >= 0 && legal(desired, ix)) return desired;
    const fallback = boss.skills.findIndex((skillId, index) => legal(skillId, index) && attack(configs.get(skillId)));
    if (fallback >= 0) return boss.skills[fallback];
    const any = boss.skills.findIndex(legal);
    return any < 0 ? 0 : boss.skills[any];
}
function selectLegalSkill(battle, proposed, configs) { return live(battle) ? choose(battle, proposed, configs) : proposed; }
function nextTelegraph(battle) {
    if (!live(battle)) return null;
    const s = state(battle), t = battle.turn + 1;
    const prefix = `第${t}回合：`;
    switch (id(battle)) {
    case 912: return prefix + ((t - 1) % 3 < 2 ? '浮空，非必中普通直伤减伤60%。' : '落地，普通直伤易伤20%。');
    case 925: return prefix + (s.stoneReformTurn === t ? '预告巨石身躯；' : '') + (armored(battle.enemy) ? '双防非负，普通直伤减伤70%。' : '护甲已破。');
    case 1025: return prefix + `晶壳${s.resonanceCount >= 2 ? '对上次攻击类别减伤60%' : '尚未形成'}。`;
    case 1308: return prefix + '实际使用有效属性技能，触发回合末5%回复；总池45%。';
    case 1325: return prefix + `倔强反击累计${s.stubbornStacks || 0}/2；物理伤害提高其攻击。`;
    case 1346: return prefix + `流沙${s.quicksandLayers || 0}层；水或飞行攻击命中可冲刷。`;
    case 1360: return prefix + (s.earthWallReformTurn === t ? '预告大地尘封；正常消耗行动和PP。' : positiveDefense(battle.enemy) ? '地脉壁垒减伤50%。' : '地脉壁垒关闭。');
    case 1371: return prefix + ((t - 1) % 3 < 2 ? '云衣减伤50%，必中命中可破衣。' : '自然落地并易伤20%。');
    case 1405: return prefix + '重复上次实际命中的攻击技能，普通直伤减伤60%。';
    case 1431: return prefix + `岩甲${s.rockLayers ?? 2}层；物理命中每行动拆1层，本场不重建。`;
    case 1458: return prefix + ((t - 1) % 4 < 2 && s.sandOpenTurn !== t ? '沙幕减伤60%，水系伤害可提前开放。' : '沙幕开放，普通直伤易伤20%。');
    case 1473: return prefix + (s.contractTurn === t ? '预告重生之力；契约由消强或两次有效攻击解除。' : s.contractActive ? '契约普通直伤减伤50%，消强或两次有效攻击可解除。' : '契约未生效；本体仅一条命。');
    case 125: return prefix + (s.bladeTurn === t ? (s.bladeBroken ? '蓄力斩已提前破势。' : '蓄力斩普通直伤提高30%；执行前实际降低攻击可破势。') : '每三回合末检查最近两回合命中招式，预告蓄力斩。');
    case 1000: return prefix + (t % 3 === 0 ? '显形，普通直伤易伤20%。' : '上回合命中招式重复使用减伤60%。');
    case 1121: return prefix + `岩护${s.giantLayers ?? 2}层，每层普通直伤减伤20%。`;
    default: return null;
    }
}
module.exports = {beginTurn, endTurn, onAction, modifyDirectDamage, onDirectDamageSegment, afterDirectDamage, afterAction, onStatClear, selectLegalSkill, nextTelegraph};
