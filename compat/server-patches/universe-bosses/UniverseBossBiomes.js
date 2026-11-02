'use strict';

const {hasElement} = require('./UniverseBossElements');

const ids = new Set([367, 858, 943, 976, 1061, 1134, 1145, 1191, 1212, 1416, 1427, 1429, 1439, 1477, 502, 1200, 1201, 1202, 1297, 1298]);
const state = battle => battle.universeBossState || (battle.universeBossState = {});
const levels = pet => (pet.battleLevels || []).slice();
const attack = skill => skill && (skill.category === 1 || skill.category === 2);
const live = battle => ids.has(battle.universeBoss?.petId) && battle.enemy?.hp > 0;
const value = (a, i) => a[i] || 0;
const lowered = (before, after, indices) => indices.some(i => value(after, i) < value(before, i));
const increased = (before, after) => after.some((v, i) => v > value(before, i));
const own = battle => battle.universeBoss?.petId;
const petKey = pet => Number.isSafeInteger(pet?.catchTime) && pet.catchTime > 0 ? pet.catchTime : null;
const samePet = (key, pet) => key !== null && key !== undefined && key === petKey(pet);
const hasPP = (pet, skill) => pet.skills.some((id, i) => id === skill && pet.skillPP[i] > 0);
const seaScaleOpen = (s, turn) => s.seaScaleOpenFrom <= turn && s.seaScaleOpenThrough >= turn;
function openSeaScale(battle) {
    const s = state(battle), next = battle.turn + 1;
    if (!(s.seaScaleOpenThrough >= battle.turn)) s.seaScaleOpenFrom = next;
    s.seaScaleOpenThrough = next;
}
function beginTurn(battle) {
    if (!live(battle)) return;
    const s = state(battle);
    if (s.markedPet != null && !samePet(s.markedPet, battle.player)) { s.markedPet = null; s.thorns = 0; }
    if (s.rootPet != null && !samePet(s.rootPet, battle.player)) s.rootPet = null;
    if (own(battle) === 1202 && s.regrowTurn === battle.turn) s.rootCrowns = Math.min(2, (s.rootCrowns ?? 2) + 1);
    if (own(battle) === 1145) s.fieldDamage = 0;
}
function endTurn(battle) {
    if (!live(battle)) return;
    const s = state(battle), t = battle.turn;
    switch (own(battle)) {
    case 1061:
        if (t % 3 === 0 && !(samePet(s.thornProtectPet, battle.player) && s.thornProtectTurn === t + 1)) {
            if (!samePet(s.markedPet, battle.player)) s.thorns = 0;
            s.markedPet = petKey(battle.player); s.thorns = Math.min(2, (s.thorns || 0) + 1); s.thornFrom = t + 1;
        }
        break;
    case 1145:
        if ((s.fieldDamage || 0) * 20 >= battle.enemy.maxHp) s.fieldBlockedTurn = t + 1;
        else requestHeal(battle, Math.floor(battle.enemy.maxHp * 0.05));
        break;
    case 1416:
        if (battle.enemy.hp * 100 <= battle.enemy.maxHp * 45 && (s.tideHeals || 0) < 2 && hasPP(battle.enemy, 21734) && t + 1 >= (s.tideLast || -4) + 4 && canHeal(battle)) s.tideSkillTurn = t + 1;
        break;
    case 1427:
        if (t % 4 === 0) s.embers = Math.min(2, (s.embers ?? 2) + 1);
        break;
    case 1201:
        if ((s.heat || 0) >= 3) s.heatStrikeTurn = t + 1;
        break;
    case 1202:
        if (t % 4 === 0) s.regrowTurn = t + 1;
        break;
    case 1297:
        if (t % 3 === 0 && hasPP(battle.enemy, 20143)) { s.pumpTurn = t + 1; s.pumpBroken = false; }
        break;
    case 1298:
        if (t % 3 === 0 && hasPP(battle.enemy, 10102)) { s.hoofTurn = t + 1; s.hoofPet = petKey(battle.player); s.hoofBroken = false; }
        break;
    }
}
function onAction(battle, attacker, skill) {
    if (!live(battle)) return;
    const s = state(battle);
    s.biomeAction = {attacker, skill: skill.id, player: levels(battle.player), enemy: levels(battle.enemy), hit: false, removedEmber: false, bubbleHit: false, heatHit: false};
    if (attacker === battle.enemy) {
        const cooldowns = s.biomeCooldowns || (s.biomeCooldowns = {});
        cooldowns[skill.id] = battle.turn;
        if (skill.category === 4) {
            s.biomeStatusStreak = s.biomeStatusTurn === battle.turn - 1 ? (s.biomeStatusStreak || 0) + 1 : 1;
            s.biomeStatusTurn = battle.turn;
        } else {
            s.biomeStatusStreak = 0;
            s.biomeStatusTurn = battle.turn;
        }
        if (own(battle) === 943 && skill.id === 20588) s.leafBuffCycle = Math.floor((battle.turn - 1) / 3);
    }
}
function onHit(battle, attacker, defender, skill) {
    if (!live(battle)) return;
    const s = state(battle), a = s.biomeAction;
    if (a && a.attacker === attacker) a.hit = true;
}
function popBubble(battle) {
    const s = state(battle);
    if ((s.bubbles ?? 2) <= 0) return;
    s.bubbles = (s.bubbles ?? 2) - 1;
    if (!s.bubbles) s.bubblesOpenTurn = battle.turn + 1;
}
function modifyDirectDamage(battle, attacker, defender, skill, beforeDefense, skillReduced) {
    if (!live(battle) || !attack(skill)) return skillReduced;
    const s = state(battle), id = own(battle), t = battle.turn;
    if (attacker === battle.enemy && defender === battle.player) {
        let bonus = 0;
        if (id === 943 && skill.id === 12252 && t % 3 === 0) bonus = 25;
        if (id === 1061 && samePet(s.markedPet, defender) && s.thornFrom <= t) bonus = (s.thorns || 0) * 15;
        if (id === 1427) bonus = (s.embers ?? 2) * 15;
        if (id === 1201 && s.heatStrikeTurn === t && (s.heat || 0) >= 3) bonus = 30;
        if (id === 1298 && skill.id === 10102 && s.hoofTurn === t && samePet(s.hoofPet, defender) && !s.hoofBroken) bonus = 30;
        return Math.floor(skillReduced * (100 + bonus) / 100);
    }
    if (attacker !== battle.player || defender !== battle.enemy || !(beforeDefense > 0)) return skillReduced;
    let reduction = 0, vulnerability = 0;
    switch (id) {
    case 367: if (((t - 1) % 4 < 2 ? 1 : 2) === skill.category) reduction = 60; break;
    case 858: if (t % 2 === 0) vulnerability = 20; break;
    case 943: if ((t - 1) % 3 < 2 && s.leafBrokenCycle !== Math.floor((t - 1) / 3)) reduction = 50; break;
    case 976: if ((s.bubbles ?? 2) > 0) reduction = 50; if (s.bubblesOpenTurn === t) vulnerability = 20; break;
    case 1191: if ((defender.statusDurations || [])[2] > 0) s.vineBurned = true; if (!s.vineBurned && skill.category === 1) reduction = 50; break;
    case 1212: if (!(s.dualElementPauseThrough >= t) && (t % 2 ? skill.category === 1 : skill.category === 2)) reduction = 50; break;
    case 1416: if (s.tideOpenTurn === t) vulnerability = 30; break;
    case 1429: reduction = (s.resolve || 0) * 20; break;
    case 1439: if (s.songOpenTurn === t) vulnerability = 25; break;
    case 502: if (!(s.revealThrough >= t) && ((t - 1) % 4 < 2 ? skill.category === 1 : skill.category === 2)) reduction = 50; break;
    case 1200: if (!seaScaleOpen(s, t)) reduction = 40; break;
    case 1201: if (s.heatOpenTurn === t) vulnerability = 20; break;
    case 1202: reduction = (s.rootCrowns ?? 2) * 20; break;
    }
    return Math.floor(Math.min(skillReduced, Math.floor(beforeDefense * (100 - reduction) / 100)) * (100 + vulnerability) / 100);
}
function onDirectDamageSegment(battle, attacker, defender, skill, segment) {
    if (!live(battle) || attacker !== battle.player || defender !== battle.enemy || !attack(skill)) return;
    if (segment.actualDamage <= 0) return;
    const s = state(battle), id = own(battle), a = s.biomeAction;
    if (id === 1202 && a && !a.crownHit) { s.rootCrowns = Math.max(0, (s.rootCrowns ?? 2) - (hasElement(skill, 3) ? 2 : 1)); a.crownHit = true; }
    if (id === 502 && hasElement(skill, 1)) s.revealThrough = battle.turn + 1;
}

function afterDirectDamage(battle, attacker, defender, skill, damage) {
    if (!live(battle) || attacker !== battle.player || defender !== battle.enemy || !attack(skill)) return;
    const s = state(battle), a = s.biomeAction;
    if (a && damage > 0) a.directDamage = (a.directDamage || 0) + damage;
    if (damage <= 0) return;
    if (own(battle) === 943 && (hasElement(skill, 3) || hasElement(skill, 4))) s.leafBrokenCycle = Math.floor((battle.turn - 1) / 3);
    if (own(battle) === 1191 && hasElement(skill, 3)) s.vineBurned = true;
    if (own(battle) === 1212 && (hasElement(skill, 2) || hasElement(skill, 7))) s.dualElementPauseThrough = battle.turn + 1;
    if (own(battle) === 1061 && (hasElement(skill, 3) || hasElement(skill, 9)) && samePet(s.markedPet, attacker)) {
        s.markedPet = null; s.thorns = 0; s.thornProtectPet = petKey(attacker); s.thornProtectTurn = battle.turn + 1;
    }
    if (own(battle) === 1200) {
        if (s.seaScaleHitTurn === battle.turn - 1 && s.seaScaleCategory !== skill.category) openSeaScale(battle);
        s.seaScaleHitTurn = battle.turn; s.seaScaleCategory = skill.category;
    }
    if (own(battle) === 1427 && hasElement(skill, 2) && a && !a.removedEmber) {
        s.embers = Math.max(0, (s.embers ?? 2) - 1); a.removedEmber = true;
    }
    if (own(battle) === 976 && a && !a.bubbleHit && (hasElement(skill, 1) || hasElement(skill, 5))) { popBubble(battle); a.bubbleHit = true; }
    if (own(battle) === 1145 && damage > 0) s.fieldDamage = (s.fieldDamage || 0) + damage;
    if (own(battle) === 1201 && damage > 0 && hasElement(skill, 2) && a && !a.heatHit) { s.heat = Math.max(0, (s.heat || 0) - 1); a.heatHit = true; }
    if (own(battle) === 976 && damage > 0 && a && !a.bubbleHit) {
        a.bubbleHit = true; s.bubbleHits = (s.bubbleHits || 0) + 1;
        if (s.bubbleHits >= 2) { s.bubbleHits = 0; popBubble(battle); }
    }
}
function completeAction(battle, attacker, skill) {
    if (!live(battle)) return;
    const s = state(battle), a = s.biomeAction, id = own(battle), t = battle.turn;
    if (!a || a.attacker !== attacker || a.skill !== skill.id) return;
    const p = levels(battle.player), e = levels(battle.enemy);
    if (attacker === battle.player) {
        const attackDown = lowered(a.enemy, e, [0, 2]);
        if (id === 1427 && attackDown && !a.removedEmber) { s.embers = Math.max(0, (s.embers ?? 2) - 1); a.removedEmber = true; }
        if (id === 1429) {
            if (increased(a.player, p)) s.resolve = Math.min(2, (s.resolve || 0) + 1);
            if (attackDown || (a.clearEnemy || []).some(i => value(a.enemy, i) > 0 && value(e, i) <= 0)) s.resolve = 0;
        }
        if (id === 1200 && !s.seaScaleDefenseBroken && [1, 3].some(i => value(a.enemy, i) >= 0 && value(e, i) < 0)) {
            s.seaScaleDefenseBroken = true;
            openSeaScale(battle);
        }
        if (id === 1297 && s.pumpTurn === t && lowered(a.enemy, e, [1, 3])) s.pumpBroken = true;
        if (id === 1298 && s.hoofTurn === t && attackDown) s.hoofBroken = true;
        if (id === 1477 && samePet(s.rootPet, attacker) && s.rootStats?.length && s.rootStats.every(index => value(p, index) >= 0)) s.rootPet = null;
    } else {
        if (id === 1134 && skill.id === 11686 && t % 3 === 0) {
            if (a.hit && (a.clearPlayer || []).some(i => value(a.player, i) > 0 && value(p, i) <= 0)) requestHeal(battle, Math.floor(battle.enemy.maxHp * 0.05));
        }
        if (id === 1416 && skill.id === 21734) { s.tideHeals = (s.tideHeals || 0) + 1; s.tideLast = t; s.tideOpenTurn = t + 1; }
        if (id === 1439 && skill.id === 21769 && t % 3 === 0 && value(e, 0) <= 0 && value(e, 2) <= 0) s.songOpenTurn = t + 1;
        if (id === 1477 && skill.id === 21818 && lowered(a.player, p, a.player.map((_, i) => i)) && t >= (s.rootLast || -3) + 3) {
            s.rootPet = petKey(battle.player); s.rootTurn = t + 1; s.rootLast = t;
            s.rootStats = a.player.map((value, index) => index).filter(index => value(p, index) < value(a.player, index));
        }
        if (id === 1477 && skill.id === 13423 && s.rootTurn === t) s.rootPet = null;
        if (id === 1201 && attack(skill)) {
            if (s.heatStrikeTurn === t && (s.heat || 0) >= 3) { s.heat = 0; s.heatOpenTurn = t + 1; }
            else if (hasElement(skill, 3)) s.heat = Math.min(3, (s.heat || 0) + 1);
        }
    }
}
function canHeal(battle) {
    try { return require('./UniverseBossBudget').canHeal(battle); } catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; return false; }
}
function requestHeal(battle, amount) {
    const budget = require('./UniverseBossBudget');
    budget.heal(battle, battle.enemy, amount, {active: false, source: 'biome'});
}
function modifyHealing(battle, amount, options = {}) {
    if (!live(battle)) return amount;
    const s = state(battle), id = own(battle), e = levels(battle.enemy);
    if (id === 1200 && seaScaleOpen(s, battle.turn)) return 0;
    if (id === 1202 && options.active && (s.rootCrowns ?? 2) === 0) return 0;
    if (id === 1439 && s.biomeAction?.skill === 21769 && value(e, 0) <= 0 && value(e, 2) <= 0) return 0;
    return amount;
}
function onStatClear(battle, source, target, indices) {
    if (!live(battle)) return;
    const a = state(battle).biomeAction;
    if (!a || !Array.isArray(indices)) return;
    const key = target === battle.player ? 'clearPlayer' : target === battle.enemy ? 'clearEnemy' : null;
    if (key) a[key] = (a[key] || []).concat(indices);
}
function afterBossSkill() {}
function afterAction(battle, attacker, defender, skill, result, context) {
    if (!battle.universeBoss || !ids.has(own(battle))) return;
    const s = state(battle), a = s.biomeAction;
    if (!context.acted) return;
    if (!context.hit) {
        if (own(battle) === 1201 && attacker === battle.enemy && attack(skill) && live(battle)) {
            if (s.heatStrikeTurn === battle.turn && (s.heat || 0) >= 3) { s.heat = 0; s.heatOpenTurn = battle.turn + 1; }
            else if (hasElement(skill, 3)) s.heat = Math.min(3, (s.heat || 0) + 1);
        }
        return;
    }
    if (a && a.attacker === attacker && a.skill === skill.id) {
        a.player = context.playerBeforeLevels;
        a.enemy = context.bossBeforeLevels;
        a.hit = context.hit;
        completeAction(battle, attacker, skill);
        if (live(battle) && own(battle) === 858 && battle.turn % 2 === 1 && attacker === context.playerRef && a.directDamage > 0) {
            const reflected = Math.min(Math.floor(a.directDamage * 0.25), Math.floor(attacker.maxHp * 0.1));
            require('./UniverseBossBudget').reflect(battle, attacker, defender, reflected, 'species');
        }
    }
}
function selectLegalSkill(battle, proposed, configs) {
    if (!live(battle)) return proposed;
    const boss = battle.enemy, s = state(battle), t = battle.turn, id = own(battle), cd = s.biomeCooldowns || {};
    const usable = (skillId, i) => {
        if (!(skillId > 0 && boss.skillPP[i] > 0 && configs.has(skillId))) return false;
        const move = configs.get(skillId);
        const effects = String(move.sideEffect || '').trim().split(/\s+/).filter(Boolean);
        if (id !== 1439 && move.category === 4 && effects.length && effects.every(effect => effect === '4')) {
            const args = String(move.sideEffectArg || '').trim().split(/\s+/).map(Number);
            const boosted = effects.map((_, index) => [args[index * 3], args[index * 3 + 2]]).filter(([stat, change]) => Number.isInteger(stat) && change > 0);
            if (boosted.length && (boosted.some(([stat]) => value(levels(boss), stat) > 0) || cd[skillId] !== undefined && t < cd[skillId] + 4)) return false;
        }
        if (id === 858 && skillId === 20714 && t % 2 === 0) return false;
        if (id === 943 && skillId === 20588 && (t % 3 === 0 || s.leafBuffCycle === Math.floor((t - 1) / 3) || value(levels(boss), 2) > 0)) return false;
        if (id === 976 && skillId === 21208 && (s.bubbles ?? 2) > 0) return false;
        if (id === 1145 && skillId === 12691 && s.fieldBlockedTurn === t) return false;
        if (id === 1145 && skillId === 21401 && value(levels(boss), 2) > 0) return false;
        if (id === 1416 && skillId === 21734 && s.tideSkillTurn !== t) return false;
        if (id === 1427 && skillId === 21750 && (s.embers ?? 2) === 0) return false;
        if (id === 1297 && skillId === 20143 && (s.pumpTurn !== t || s.pumpBroken)) return false;
        const cooldown = {21295: 3, 21401: 4, 21451: 4, 21470: 4}[skillId];
        return !cooldown || cd[skillId] === undefined || t >= cd[skillId] + cooldown;
    };
    let fixed;
    if (id === 943 && t % 3 === 0) fixed = 12252;
    if (id === 1134 && t % 3 === 0) fixed = 11686;
    if (id === 1212) fixed = t % 2 ? 12827 : 12831;
    if (id === 1416 && s.tideSkillTurn === t) fixed = 21734;
    if (id === 1439) fixed = [21768, 13344, 21769][(t - 1) % 3];
    if (id === 1477 && s.rootTurn === t) fixed = 13423;
    if (id === 1297 && s.pumpTurn === t && !s.pumpBroken) fixed = 20143;
    if (id === 1298 && s.hoofTurn === t) fixed = 10102;
    if (fixed) proposed = fixed;
    if (id === 1201 && s.heatStrikeTurn === t && (s.heat || 0) >= 3) {
        const attackIndex = boss.skills.findIndex((v, i) => usable(v, i) && attack(configs.get(v)));
        if (attackIndex >= 0) return boss.skills[attackIndex];
    }
    if (!fixed && s.biomeStatusTurn === t - 1 && s.biomeStatusStreak >= 2) {
        const attackIndex = boss.skills.findIndex((v, i) => usable(v, i) && attack(configs.get(v)));
        if (attackIndex >= 0) return boss.skills[attackIndex];
    }
    const index = boss.skills.indexOf(proposed);
    if (index >= 0 && usable(proposed, index)) return proposed;
    const fallback = boss.skills.findIndex((v, i) => usable(v, i) && attack(configs.get(v)));
    if (fallback >= 0) return boss.skills[fallback];
    const any = boss.skills.findIndex(usable);
    return any < 0 ? 0 : boss.skills[any];
}
function replacementSkill(battle, selected, configs) {
    if (own(battle) !== 1297 || selected.id !== 20143 || !state(battle).pumpBroken) return selected;
    const boss = battle.enemy, index = boss.skills.findIndex((id, i) => boss.skillPP[i] > 0 && attack(configs.get(id)));
    return index < 0 ? null : require('../Pet/Countermarks').Skill(boss, configs.get(boss.skills[index]));
}
function modifyIndirectDamage(battle, attacker, defender, kind, amount) {
    if (live(battle) && own(battle) === 1297 && attacker === battle.enemy && defender === battle.player && kind === 'fraction' && state(battle).biomeAction?.skill === 20143) return Math.min(amount, Math.floor(defender.maxHp * 0.12));
    return amount;
}
function nextTelegraph(battle) {
    if (!live(battle)) return null;
    const s = state(battle), t = battle.turn + 1, id = own(battle);
    const messages = {
        367: `蝶翼${(t - 1) % 4 < 2 ? '物理' : '特殊'}防护，直伤减伤60%`,
        858: t % 2 ? '蟹壳闭合，反弹直接伤害' : '蟹壳打开，直伤易伤20%',
        943: t % 3 === 0 ? '绿光风暴强攻，PP不足改用可用攻击' : s.leafBrokenCycle === Math.floor((t - 1) / 3) ? '叶幕已破，本周期减伤暂停' : '叶幕减伤50%，火或飞行攻击命中可破幕',
        976: `剩余${s.bubbles ?? 2}层气泡`,
        1061: `荆棘标记${samePet(s.markedPet, battle.player) ? s.thorns : 0}层，火冰命中或换宠解除`,
        1134: t % 3 === 0 ? '宁静之雨；实际清除正强化才回复5%体力' : '净化花粉',
        1145: '本回合直接伤害达到最大体力5%可压制守护',
        1191: s.vineBurned ? '藤甲已烧毁' : '藤甲减免物理攻击，火系命中或烧伤可解除',
        1212: `${t % 2 ? '雷态物理' : '炎态特殊'}防护；水或地面命中可暂停`,
        1416: s.tideSkillTurn === t ? '贮能聚水，行动后下回合易伤' : '潮眠窗口',
        1427: `余烬${s.embers ?? 2}层${t % 4 === 0 ? '，回合末恢复一层' : ''}`,
        1429: `借势战意${s.resolve || 0}层；消强或实际降低攻击可清除`,
        1439: `潮汐乐章：${['英勇颂歌', '水舞终乐章', '咏叹调'][(t - 1) % 3]}`,
        1477: s.rootTurn === t ? '缠根追击，换宠或解除自身弱化可避开加成' : '缠根追击',
        502: s.revealThrough >= t ? '潮汐护盾已揭，防护暂停' : `潮汐${(t - 1) % 4 < 2 ? '物理' : '特殊'}防护，草系有效伤害揭潮`,
        1200: seaScaleOpen(s, t) ? '海鳞暂停且禁止回复' : '海鳞减伤40%，物特轮换或首次破防可打开',
        1201: s.heatStrikeTurn === t ? '满热，若有可用攻击则优先攻击并增强，水系伤害可降温' : `热度${s.heat || 0}层`,
        1202: `根冠${s.rootCrowns ?? 2}层${s.regrowTurn === t ? '，本回合再生一层' : ''}`,
        1297: s.pumpTurn === t && hasPP(battle.enemy, 20143) ? '海洋之心，降低防御可打断' : '潮泵蓄势',
        1298: s.hoofTurn === t && hasPP(battle.enemy, 10102) ? '烈火燎原追击，换宠或降低攻击可解除加成' : '熔蹄蓄势'
    };
    return `第${t}回合：${messages[id]}。`;
}
module.exports = {beginTurn, endTurn, onAction, onHit, onStatClear, replacementSkill, modifyDirectDamage, onDirectDamageSegment, afterDirectDamage, afterBossSkill, afterAction, selectLegalSkill, nextTelegraph, modifyIndirectDamage, modifyHealing};
