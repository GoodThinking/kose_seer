'use strict';

const {hasElement} = require('./UniverseBossElements');
const attack = skill => skill && [1, 2].includes(skill.category);
const levels = pet => pet.battleLevels || pet.battleLv;
const id = battle => battle.enemy.sptBossProfile.sptId;
const active = battle => !!battle?.enemy?.sptBossProfile && !battle.enemy.sptBossProfile.native && !battle.universeBoss && !battle.isPvp;
const has = (skill, types) => types.some(type => hasElement(skill, type));
const cycle = (turn, size) => Math.floor((turn - 1) / size);
const phase = boss => `${boss.bossState?.livesLeft}:${boss.bossState?.phase}`;
const ARMOR = {
  4: {layers:2, percent:20, types:[3,11], other:2},
  8: {layers:2, percent:25, types:[3,7,11], other:2},
  37:{layers:2, percent:20, types:[2]},
  39:{layers:3, percent:20, segments:true, regrow:4},
  44:{layers:3, percent:15, segments:true, bonus:[11], regrow:4},
  57:{layers:3, percent:20, segments:true},
  58:{layers:2, percent:20, types:[11,15]},
  59:{layers:4, percent:15, segments:true, bonus:[11], regrow:2},
  62:{layers:4, percent:15, segments:true, bonus:[1,5]},
  67:{layers:2, percent:20, types:[3,4], other:2, cycle:3},
  70:{layers:2, percent:20, types:[1,5], category:1},
  78:{layers:2, percent:20, types:[15,11], other:2},
  81:{layers:3, percent:15, types:[3,6], category:2}
};
function state(battle) {
  if (!active(battle)) return null;
  const boss = battle.enemy;
  const s = battle.sptBossState || (battle.sptBossState = {weekday:boss.sptBossWeekday, healed:0, heals:0, thresholds:0, attacks:0, turn:-1});
  const current = phase(boss);
  if (s.phase !== current) {
    s.phase = current; s.layers = ARMOR[id(battle)]?.layers || 0; s.hits = 0;
    s.armorGone = false; s.openThrough = -1; s.keyHits = 0;
  }
  return s;
}
function stage(battle, index, amount, max=6) {
  const own = levels(battle.enemy), before = own[index];
  own[index] = Math.max(-6, amount > 0 ? Math.max(before, Math.min(max, before + amount)) : before + amount);
  return own[index] - before;
}
function positiveDown(battle, indices) {
  const own = levels(battle.enemy), index = indices.find(index => own[index] > 0);
  if (index !== undefined) stage(battle, index, -1);
}
function inflict(pet, status, turns, skillId) {
  return require('./SkillEffectRuntime').SkillEffectRuntime.Inflict(pet, status, turns, skillId);
}
function healing(battle, percent, maxUses, total) {
  const s = state(battle), boss = battle.enemy;
  if (s.heals >= maxUses || boss.hp <= 0) return 0;
  const requested = Math.min(Math.floor(boss.maxHp * percent / 100), Math.max(0, Math.floor(boss.maxHp * total / 100) - s.healed));
  if (requested <= 0) return 0;
  const actual = require('./UniverseBossBudget').heal(battle, boss, requested, {source:'spt-passive'});
  if (actual > 0) { s.healed += actual; s.heals++; }
  return actual;
}
function beginTurn(battle) {
  const s = state(battle); if (!s || s.turn === battle.turn) return;
  const t = battle.turn, n = id(battle), own = levels(battle.enemy);
  s.turn = t; s.bossActed = false; s.action = null;
  const armor = ARMOR[n];
  if (armor?.cycle && s.armorCycle !== cycle(t, armor.cycle)) {
    s.armorCycle = cycle(t, armor.cycle); s.layers = armor.layers; s.hits = 0;
  }
  if (n === 14 && [3,6].includes(s.weekday) && t === 1) s.gaiaDefense = own[1] > 0;
  if (n === 14 && [3,6].includes(s.weekday) && t === 4) {
    if (s.gaiaDefense && own[1] > 0) stage(battle, 1, -1);
    s.vulnerableTurn = t;
  }
  if (s.restoreStage && s.restoreStage.through < t) {
    stage(battle, s.restoreStage.index, 1); s.restoreStage = null;
  }
  if (n === 72 && s.chargedTurn === t) s.restoreSpeed = stage(battle,4,-1) < 0;
  if (n === 73 && s.nextAdaptTurn === t) { s.adaptCategory = s.nextAdaptCategory; s.adaptTurn = t; }
  if (n === 79 && s.nextAdaptTurn === t) { s.adaptCategory = s.nextAdaptCategory; s.adaptTurn = t; }
  if (n === 38 && s.featherTurn === t && s.featherPet !== battle.player.catchTime) s.featherTurn = -1;
}
function onAction(battle, actor, skill) {
  const s = state(battle); if (!s) return;
  s.action = {actor, skill:skill.id, counted:false, damage:0, direct:false};
  if (actor === battle.enemy) s.bossActed = true;
}
function onStatClear(battle, source, target, indices, changes=[]) {
  const s = state(battle); if (!s || target !== battle.enemy) return;
  for (const change of changes) {
    if (change.after !== 0) continue;
    if (change.index === s.restoreStage?.index) s.restoreStage = null;
    if (change.index === 4) s.restoreSpeed = false;
    if (change.index === 1) s.gaiaDefense = false;
  }
  if (source !== battle.player) return;
  const cleared = changes.filter(change => change.before > 0 && change.after === 0);
  if (!cleared.length) return;
  s.clearedTurn = battle.turn;
  if (id(battle) === 69) s.focus = false;
  if (id(battle) === 53 && s.dragonGains) for (const change of cleared) s.dragonGains[change.index] = 0;
}
function checkHit(battle, skill) {
  const s = state(battle); if (!s || !attack(skill) || skill.mustHit) return;
  const n=id(battle), t=battle.turn;
  const airborne = [5,32,55].includes(n) && t % 3 !== 0 && s.brokenCycle !== cycle(t,3);
  if (!(airborne || n === 13 && s.weekday === 2)) return;
  if (s.lastDodged) { s.lastDodged = false; return; }
  s.lastDodged = Math.random() < 0.2;
  if (s.lastDodged) return false;
}
function damageState(battle) {
  const s=state(battle), n=id(battle), t=battle.turn, own=levels(battle.enemy);
  const context=battle.universeBudgetState?.actionContext;
  const before=context?.bossBeforeLevels;
  // This comparison runs after skill effects but before direct damage. ClearStage
  // events are excluded, so clearing +1 to 0 cannot impersonate a weakening.
  const lowered = index => s.action?.actor === battle.player && before && own[index] < before[index] && !context.statClears.some(event=>event.target===battle.enemy&&event.changes.some(change=>change.index===index));
  if ([7,34,40].includes(n) && [1,3].some(index=>own[index]<0) && [1,3].some(lowered)) s.openThrough=t+2;
  if (n===14 && own[1]<=0) s.gaiaDefense=false;
  if (n===39 && lowered(1)) s.regrowCancelled=true;
  if (n===57 && !s.defenseBroken && [1,3].some(index=>own[index]<0&&lowered(index))) {s.layers=Math.max(0,s.layers-2);s.defenseBroken=true;}
  if (n===62 && [1,3].some(index=>own[index]<0)) s.layers=0;
  if (n===54 && [1,3].some(lowered)) s.brokenCycle=cycle(t,4);
  if ([25,42,45,72].includes(n) && lowered(0) || n===45 && lowered(2) || n===80 && lowered(2)) {
    if ([45,80].includes(n)) s.charges=0;
    else s.cancelledTurn=t;
  }
  const durations=battle.enemy.statusDurations || [];
  if ([24,56,43,31].includes(n)) {
    const status={24:5,56:2,43:0,31:0}[n];
    if (durations[status]>0) s.openThrough=t+2;
  }
  if ([28,51,63,76].includes(n)) {
    const status={28:1,51:8,63:6,76:8}[n];
    if (durations[status]>0) s.openThrough=t+1;
  }
  if (n===37 && durations[5]>0 && !s.frostActive) s.layers=Math.max(0,s.layers-1);
  if(n===37)s.frostActive=durations[5]>0;
  if(n===58&&durations[2]>0)s.layers=0;
  if ([20,48].includes(n)&&durations[2]>0)s.healBlockedThrough=t+1;
  return s;
}
function modifyDirectDamage(battle, actor, target, skill, beforeDefense, reduced) {
  const s = damageState(battle); if (!s || !attack(skill)) return reduced;
  const n=id(battle), t=battle.turn, own=levels(battle.enemy);
  if (actor===battle.enemy && target===battle.player) {
    let bonus=0;
    if ([6,45,80].includes(n)&&hasElement(skill,5)) bonus=(s.charges||0)*(n===6?10:15);
    if (n===13&&s.weekday===0&&target&&actor.hp*100<actor.maxHp*30)bonus=25;
    const chargeType = n === 50 ? 3 : n === 75 ? 9 : 0;
    if ([25,42,50,72,75].includes(n)&&s.chargedTurn===t&&s.cancelledTurn!==t&&(!chargeType||hasElement(skill,chargeType)))bonus=n===42||n===75?25:30;
    if (n===55&&t%3===0&&s.brokenCycle!==cycle(t,3))bonus=25;
    if (n===66&&battle.universeBudgetState?.actionContext?.isFirst&&hasElement(skill,4))bonus=20;
    if (n===68&&hasElement(skill,3))bonus=(s.charges??2)*10;
    if (n===69&&skill.category===2&&s.focus)bonus=25;
    return Math.floor(reduced*(100+bonus)/100);
  }
  if (actor!==battle.player||target!==battle.enemy||beforeDefense<=0)return reduced;
  let reduction=0, vulnerability=0;
  const armor=ARMOR[n];
  if (armor&&(!armor.category||armor.category===skill.category)&&!(n===67&&t%3===0))reduction=s.layers*armor.percent;
  switch(n){
    case 5: if(t%3===0)vulnerability=20;break;
    case 7: if(own[1]>=0&&own[3]>=0&&!(s.openThrough>=t))reduction=60;break;
    case 9: if(!s.armorGone)reduction=50;break;
    case 11: if(!hasElement(skill,[2,3,1][s.sequence||0]))reduction=60;break;
    case 13: if(s.weekday===6)reduction=30;break;
    case 14:
      if([1,5].includes(s.weekday)&&t<=2&&skill.category===1)reduction=30;
      if([0,2,4].includes(s.weekday)&&!s.armorGone)reduction=40;
      if(s.vulnerableTurn===t)vulnerability=20;
      break;
    case 17: if(t%3!==0&&s.brokenCycle!==cycle(t,3))reduction=50;break;
    case 23: if(!(s.openThrough>=t)&&(t%2?skill.category===1:skill.category===2))reduction=50;break;
    case 24: if(!s.armorGone&&!(s.openThrough>=t))reduction=40;break;
    case 28: if(!(s.openThrough>=t))reduction=40;break;
    case 29: if(own[skill.category===1?1:3]>=0)reduction=40;break;
    case 30: if(skill.category===1&&s.elastic&&!(s.openThrough>=t))reduction=40;break;
    case 31: if(s.lastSkill===skill.id&&!(s.openThrough>=t))reduction=50;break;
    case 34: if(!(s.openThrough>=t))reduction=50;break;
    case 35: if((s.attacks+1)%3===0&&!s.skipUnloading)reduction=50;break;
    case 38: if(s.featherTurn===t&&s.featherPet===actor.catchTime&&skill.category===1)reduction=50;break;
    case 40: if(skill.category===1&&own[1]>=0&&!(s.openThrough>=t))reduction=50;break;
    case 42: if(s.lastCategory===skill.category)reduction=50;break;
    case 43: if(!(s.openThrough>=t))reduction=50;break;
    case 47: if(s.shieldOffTurn!==t)reduction=50;if(s.vulnerableThrough>=t)vulnerability=20;break;
    case 49: if(t%3!==0)reduction=t%3===1?60:30;if(s.openThrough>=t)reduction=Math.min(20,reduction);break;
    case 51: if(s.openThrough>=t)vulnerability=20;else if(skill.category===1)reduction=50;break;
    case 54: if(t%4!==0&&skill.category===1&&s.brokenCycle!==cycle(t,4))reduction=50;break;
    case 55: if(t%3===0)vulnerability=20;break;
    case 56: if(!(s.openThrough>=t))reduction=40;break;
    case 61: if(t<=2&&!s.armorGone)reduction=40;if(s.huntTurn===t&&s.huntSkill===skill.id)reduction=Math.max(reduction,50);break;
    case 63: if(!s.armorGone&&!(s.openThrough>=t))reduction=40;break;
    case 64: if(own[skill.category===1?1:3]>=0)reduction=50;break;
    case 65: if(t%4!==0&&!hasElement(skill,[12,13][s.sequence||0]))reduction=50;break;
    case 68: if(s.vulnerableFrom<=t&&s.vulnerableThrough>=t)vulnerability=20;break;
    case 71: if(t%3===0)vulnerability=20;else if(!skill.mustHit&&s.brokenCycle!==cycle(t,3))reduction=40;break;
    case 73: if(s.adaptTurn===t&&s.adaptCategory===skill.category&&s.overheatedTurn!==t)reduction=50;break;
    case 74: if(!s.armorGone&&!(s.openThrough>=t))reduction=40;break;
    case 76: if(!s.armorGone&&!(s.openThrough>=t))reduction=40;break;
    case 77: if(skill.category===2&&!(s.openThrough>=t))reduction=50;break;
    case 79: if(t%4!==0&&s.adaptTurn===t&&s.adaptCategory===skill.category&&!s.clearAdapt)reduction=40;break;
  }
  return Math.floor(Math.min(reduced,Math.floor(beforeDefense*(100-reduction)/100))*(100+vulnerability)/100);
}
function onDirectDamageSegment(battle, actor, target, skill, segment) {
  const s=state(battle);if(!s||actor!==battle.player||target!==battle.enemy||segment.actualDamage<=0)return;
  s.action.direct=true;s.action.damage+=segment.actualDamage;
  const armor=ARMOR[id(battle)];
  if(armor?.segments)s.layers=Math.max(0,s.layers-1);
}
function afterDirectDamage(battle, actor, target, skill, damage) {
  const s=state(battle);if(!s||damage<=0||actor!==battle.player||target!==battle.enemy||!attack(skill))return;
  const a=s.action;if(!a||a.counted)return;a.counted=true;a.direct=true;a.damage=damage;
  const n=id(battle),t=battle.turn;
  const armor=ARMOR[n];
  if(armor&&!armor.segments&&s.layers>0){
    if(armor.types&&has(skill,armor.types))s.layers--;
    else if(armor.other&&++s.hits>=armor.other){s.hits=0;s.layers--;}
  }
  if(armor?.bonus&&has(skill,armor.bonus))s.layers=Math.max(0,s.layers-1);
  switch(n){
    case 1:if(has(skill,[3,4]))s.contactOffThrough=t+1;break;
    case 6:if(hasElement(skill,7)){s.charges=0;s.chargeBlockedThrough=t+1;}break;
    case 9:if(skill.id===10323||has(skill,[12,5])||++s.keyHits>=3)s.armorGone=true;break;
    case 11:if(hasElement(skill,[2,3,1][s.sequence||0]))s.sequence=((s.sequence||0)+1)%3;break;
    case 14:if([0,2,4].includes(s.weekday)&&(battle.universeBudgetState?.actionContext?.isCrit||++s.keyHits>=2))s.armorGone=true;break;
    case 15:if(++s.hits%2===0){stage(battle,0,1,3);stage(battle,2,1,3);}break;
    case 17:if(has(skill,[1,5]))s.brokenCycle=cycle(t,3);if(hasElement(skill,5)&&s.healTurn===t&&!s.bossActed)s.cancelledTurn=t;break;
    case 18:if(hasElement(skill,2))s.contactOffThrough=t+1;break;
    case 19:if(has(skill,[11,15])&&s.chargedTurn===t&&!s.bossActed)s.cancelledTurn=t;break;
    case 20:case 48:if(hasElement(skill,3))s.healBlockedThrough=t+1;break;
    case 23:if(has(skill,[3,6]))s.openThrough=t+1;break;
    case 24:if(has(skill,[2,7])&&++s.keyHits>=2)s.armorGone=true;break;
    case 25:if(s.chargedTurn===t&&!s.bossActed)s.cancelledTurn=t;break;
    case 27:case 12:if(has(skill,[12,13])&&s.chargedTurn===t&&!s.bossActed)s.cancelledTurn=t;break;
    case 30:if(skill.category===2)s.elastic=false;else s.elastic=true;if(has(skill,[1,5]))s.openThrough=t+2;break;
    case 31:s.lastSkill=skill.id;break;
    case 32:if(has(skill,[2,12]))s.brokenCycle=cycle(t,3);break;
    case 33:if(has(skill,[3,4]))s.healBlockedThrough=t+1;break;
    case 34:stage(battle,0,1,3);stage(battle,2,1,3);break;
    case 35:if((s.attacks+1)%3===0)s.skipUnloading=false;if(hasElement(skill,11))s.skipUnloading=true;break;
    case 36:if(has(skill,[1,5]))s.healBlockedThrough=t+2;break;
    case 38:
      if(skill.category===1){if(s.featherPet!==actor.catchTime){s.featherPet=actor.catchTime;s.physicalHits=0;}if(++s.physicalHits>=2){s.featherTurn=t+1;s.physicalHits=0;}}
      if(skill.mustHit)s.featherTurn=-1;break;
    case 40:if(hasElement(skill,7))s.openThrough=t+2;break;
    case 41:if(++s.hits%2===0)stage(battle,0,1,3);if(has(skill,[3,11]))positiveDown(battle,[1,3]);break;
    case 42:
      if(s.lastCategory===skill.category)s.nextCharge=t+1;
      s.lastCategory=has(skill,[4,10])?null:skill.category;break;
    case 43:if(hasElement(skill,7))s.openThrough=t+2;break;
    case 45:case 80:if(hasElement(skill,7))s.charges=0;break;
    case 47:
      if(has(skill,[1,5])){s.shieldOffTurn=t;const type=hasElement(skill,1)?1:5;if(s.tideHitTurn===t-1&&s.tideType!==type)s.vulnerableThrough=t+2;s.tideHitTurn=t;s.tideType=type;}break;
    case 49:if(has(skill,[2,1]))s.openThrough=t+1;break;
    case 50:if(has(skill,[2,7])&&s.chargedTurn===t&&!s.bossActed)s.cancelledTurn=t;break;
    case 52:if(has(skill,[3,4]))positiveDown(battle,[3]);break;
    case 53:
      if(s.lastSkill===skill.id){const gains=s.dragonGains||(s.dragonGains={});for(const index of[0,2])gains[index]=(gains[index]||0)+Math.max(0,stage(battle,index,1,2));}
      if(s.lastSkill!==skill.id||has(skill,[15,11])){for(const index of[0,2]){const gained=s.dragonGains?.[index]||0;if(gained>0)stage(battle,index,-Math.min(gained,Math.max(0,levels(target)[index])));}s.dragonGains={};}
      s.lastSkill=skill.id;break;
    case 55:if(has(skill,[5,9]))s.brokenCycle=cycle(t,3);break;
    case 56:if(hasElement(skill,3))s.openThrough=t+2;break;
    case 61:if(has(skill,[12,5]))s.armorGone=true;s.lastSkill=skill.id;break;
    case 63:if(has(skill,[12,13])&&++s.keyHits>=2)s.armorGone=true;break;
    case 65:if(hasElement(skill,[12,13][s.sequence||0]))s.sequence=1-(s.sequence||0);break;
    case 66:if(has(skill,[5,9])&&t>=(s.speedLast||-2)+2){stage(battle,4,-1);s.speedLast=t;}break;
    case 68:if(has(skill,[2,7])){s.charges=Math.max(0,(s.charges??2)-1);if(!s.charges){s.vulnerableFrom=t+1;s.vulnerableThrough=t+1;}}break;
    case 69:if(has(skill,[12,13]))s.focus=false;break;
    case 71:if(has(skill,[5,9]))s.brokenCycle=cycle(t,3);break;
    case 72:if(has(skill,[2,1])&&s.chargedTurn===t&&!s.bossActed)s.cancelledTurn=t;break;
    case 73:if(has(skill,[3,7]))s.overheatedTurn=t+1;break;
    case 74:if(has(skill,[12,5])){s.openThrough=t+2;if(++s.keyHits>=2)s.armorGone=true;}break;
    case 75:if(hasElement(skill,3)&&s.chargedTurn===t&&!s.bossActed)s.cancelledTurn=t;break;
    case 76:if(has(skill,[3,11])&&++s.keyHits>=2)s.armorGone=true;break;
    case 77:if(hasElement(skill,1))s.openThrough=t+2;break;
    case 79:if(hasElement(skill,11))s.clearAdapt=true;break;
  }
  s.attacks++;
  if(n===73){s.categoryStreak=s.lastCategory===skill.category?(s.categoryStreak||0)+1:1;s.lastCategory=skill.category;if(s.categoryStreak>=2){s.nextAdaptCategory=skill.category;s.nextAdaptTurn=t+1;}}
  if(n===79){s.nextAdaptCategory=skill.category;s.nextAdaptTurn=t+1;s.clearAdapt=hasElement(skill,11);}
}
function afterAction(battle, actor, target, skill, result, context) {
  const s=state(battle);if(!s||!context.acted||result?.skillId!==skill.id||!skill.id)return;
  const n=id(battle),t=battle.turn,a=s.action;
  damageState(battle);
  if(actor===battle.player){
    const own=levels(actor), before=context.playerBeforeLevels;
    if(n===46&&s.copiedTurn!==t){const index=own.findIndex((value,index)=>value>before[index]);if(index>=0){stage(battle,index,1,2);s.copiedTurn=t;}}
    if(n===52&&skill.category===4&&s.leafTurn!==t){stage(battle,3,1,2);s.leafTurn=t;}
    if(a?.direct){
      const contact=n===1?{status:1,turns:2}:n===16?{status:6,turns:1}:n===18?{status:2,turns:2}:null;
      if(contact&&skill.category===1&&!(s.contactOffThrough>=t)&&Math.random()<0.3)inflict(actor,contact.status,contact.turns);
      if(n===13&&s.weekday===3){const reflected=Math.min(Math.floor(a.damage*0.2),Math.floor(actor.maxHp*0.1));require('./UniverseBossBudget').reflect(battle,actor,target,reflected,'spt-reflection');}
    }
  }else{
    if(attack(skill)){
      s.enemyAttacks=(s.enemyAttacks||0)+1;
      if(n===6&&hasElement(skill,5)&&!(s.chargeBlockedThrough>=t))s.charges=Math.min(3,(s.charges||0)+1);
      if(n===45&&hasElement(skill,5))s.charges=Math.min(2,(s.charges||0)+1);
      if(n===25&&s.enemyAttacks%2===0)s.nextCharge=t+1;
      if([25,50,72].includes(n)&&s.chargedTurn===t&&s.cancelledTurn!==t){const index=n===50?3:1;if(stage(battle,index,-1)<0)s.restoreStage={index,through:t+1};}
      if([12,27].includes(n)&&s.chargedTurn===t&&s.cancelledTurn!==t&&context.hit&&hasElement(skill,10)&&Math.random()<(n===27?0.4:1))inflict(target,n===27?9:10,1,skill.id);
      if(n===75&&context.hit&&hasElement(skill,9)&&Math.random()<0.2)inflict(target,5,2,skill.id);
      if(n===36&&context.hit&&result.damage>0&&!(s.healBlockedThrough>=t)){
        const requested=Math.min(Math.floor(result.damage*0.2),Math.floor(actor.maxHp*0.05),Math.max(0,Math.floor(actor.maxHp*0.2)-s.healed));
        if(requested>0)s.healed+=require('./UniverseBossBudget').heal(battle,actor,requested,{source:'spt-lifesteal'});
      }
    }
    if(n===69&&skill.category===4&&context.hit)s.focus=true;
    if(n===69&&skill.category===2)s.focus=false;
    if(n===17&&s.healTurn===t){if(s.cancelledTurn!==t)healing(battle,10,1,10);s.healTurn=-1;}
    if(n===19&&s.chargedTurn===t&&s.cancelledTurn!==t){stage(battle,0,1);stage(battle,2,1);}
  }
  if(n===10){for(const [index,percent]of[75,50,25].entries()){if(!(s.thresholds&(1<<index))&&battle.enemy.hp*100<=battle.enemy.maxHp*percent){s.thresholds|=1<<index;stage(battle,0,1);}}}
  if(n===64&&!s.halfUsed&&battle.enemy.hp*2<battle.enemy.maxHp){s.halfUsed=true;stage(battle,1,-1);stage(battle,3,-1);stage(battle,0,1);}
  if(result){result.attackerRemainHp=actor.hp;result.defenderRemainHp=target.hp;}
}
function endTurn(battle) {
  const s=state(battle);if(!s||battle.enemy.hp<=0)return;
  const n=id(battle),t=battle.turn,armor=ARMOR[n];
  damageState(battle);
  if(armor?.regrow&&t%armor.regrow===0){if(!s.regrowCancelled)s.layers=Math.min(armor.layers,s.layers+1);s.regrowCancelled=false;}
  if(n===11&&t%3===0)s.sequence=((s.sequence||0)+1)%3;
  if(n===13&&s.weekday===4&&t%3===0)healing(battle,5,3,15);
  if(n===17&&!s.healDeclared&&battle.enemy.hp*100<battle.enemy.maxHp*40){s.healDeclared=true;s.healTurn=t+1;}
  if(n===19){for(const [index,percent]of[2/3,1/3].entries())if(!(s.thresholds&(1<<index))&&battle.enemy.hp<=battle.enemy.maxHp*percent){s.thresholds|=1<<index;s.nextCharge=t+1;}}
  if([12,27,50,72,75].includes(n)&&t%(n===12?4:3)===0)s.nextCharge=t+1;
  if(s.nextCharge===t+1){s.chargedTurn=t+1;s.nextCharge=-1;}
  if(s.restoreSpeed){stage(battle,4,1);s.restoreSpeed=false;}
  if(n===20&&t%3===0&&!(s.healBlockedThrough>=t))healing(battle,8,3,24);
  if(n===28&&t%4===0&&!(s.openThrough>=t))healing(battle,5,3,15);
  if(n===33&&t%2===0&&!(s.healBlockedThrough>=t))healing(battle,5,4,20);
  if(n===48&&!(s.healBlockedThrough>=t))healing(battle,3,5,15);
  if(n===61&&t%3===0){s.huntTurn=t+1;s.huntSkill=s.lastSkill;}
  if(n===68&&t%3===0)s.charges=Math.min(2,(s.charges??2)+1);
  if(n===74&&t%4===0&&!s.armorGone)s.openThrough=-1;
  if(n===80&&t%2===0)s.charges=Math.min(2,(s.charges||0)+1);
}
function survive(battle) {
  const s=state(battle);if(!s||id(battle)!==13||s.weekday!==5||s.reborn||battle.enemy.hp>0)return false;
  s.reborn=true;battle.enemy.hp=Math.max(1,Math.floor(battle.enemy.maxHp*0.2));return true;
}
function nextTelegraph(battle) {
  const s=state(battle);if(!s)return null;
  const boss=battle.enemy,profile=boss.sptBossProfile,t=battle.turn+1,n=id(battle);
  const parts=[`【${profile.name}】第${t}回合`,profile.mechanic];
  if(ARMOR[n])parts.push(`剩余护甲${s.layers}层`);
  if(s.charges!==undefined)parts.push(`蓄能${s.charges}层`);
  if(s.heals||s.healed)parts.push(`已回复${s.healed}体力/${s.heals}次`);
  if(s.chargedTurn===t)parts.push('本回合执行已预告动作；先手反制有效');
  if(s.healTurn===t)parts.push('低血回复已预告，先手电系命中可取消');
  if([5,32,55,67,71].includes(n))parts.push(t%3===0?'自然开放回合':'防护周期中');
  if(n===13)parts.push(`星期状态${s.weekday}`);
  if(n===11)parts.push(`当前龙鳞属性${[2,3,1][s.sequence||0]}`);
  if(n===65)parts.push(t%4===0?'瞳镜关闭':`当前瞳镜属性${[12,13][s.sequence||0]}`);
  return parts.join('；')+'。';
}
module.exports={active,state,beginTurn,endTurn,onAction,onStatClear,checkHit,modifyDirectDamage,onDirectDamageSegment,afterDirectDamage,afterAction,survive,nextTelegraph};
