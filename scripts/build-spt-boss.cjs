'use strict';
// Compose only the SPT cutover over an explicitly captured current release.
const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto');
const {parseArgs}=require('node:util');
const {values:v}=parseArgs({options:Object.fromEntries(['baseline','out'].map(key=>[key,{type:'string'}]))});
for(const key of ['baseline','out'])if(!v[key])throw Error('Missing --'+key);
const root=path.resolve(__dirname,'..'),base=path.resolve(v.baseline),out=path.resolve(v.out);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const check=(ok,message)=>{if(!ok)throw Error(message);};
const files=[];
function put(relative,bytes){const prior=path.join(base,relative),dest=path.join(out,relative);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);files.push({path:relative,before:fs.existsSync(prior)?hash(fs.readFileSync(prior)):null,after:hash(Buffer.from(bytes))});}
function replace(text,before,after,count=1){check(text.split(before).length-1===count,'Changed source anchor: '+before.slice(0,120));return text.split(before).join(after);}
function patch(relative,fn){put(relative,fn(fs.readFileSync(path.join(base,relative),'utf8')));}
const design=fs.readFileSync(path.join(root,'docs/SPT_BOSS_DESIGN.md'),'utf8');
const sections=[...design.matchAll(/^### (SPT-(\d+)|ENTRY-502-0) · (.+)\n([\s\S]*?)(?=^<a id=|^## |$(?![\s\S]))/gm)];
check(sections.length===128,'Expected 128 design groups');
const plans=new Map(sections.map(match=>{
  const body=match[4],passive=/\*\*([^*]+)\*\*：([^\n]+)/.exec(body),stats=/本体起始值：(\d+)级，(?:每命)?(\d+)体力/.exec(body);
  check(passive&&stats,'Missing design parameters '+match[1]);
  return [+(match[2]||0),{name:passive[1],mechanic:passive[2],level:+stats[1],hp:+stats[2],routeA:/对策A：([^\n]+)/.exec(body)[1],routeB:/对策B：([^\n]+)/.exec(body)[1]}];
}));
const config=JSON.parse(fs.readFileSync(path.join(base,'app/config/data/json/boss_abilities.json')));
const profiles=[];
for(const boss of config.bossConfigs){
  if(!boss.teamChallenge)continue;
  const sptId=boss.spt?.sptId||0;
  const native=boss.mapId===514||boss.mapId===677||boss.mapId===318&&boss.param2===0;
  const plan=native?null:plans.get(sptId);
  check(native||plan,'Missing design for '+boss.mapId+'/'+boss.param2);
  delete boss.teamChallenge;
  if(!native){
    boss.level=plan.level;boss.customHP=plan.hp;
    if(!boss.universeBossKey){
      const old=boss.mechanics||{},mechanics={};
      for(const key of ['immune','ohkoImmune','universeRequiemImmune'])if(old[key]!==undefined)mechanics[key]=old[key];
      if([3,24,26,56].includes(sptId))mechanics.extraLives=1;
      if(sptId===26)mechanics.phases=old.phases;
      if([2,34].includes(sptId))mechanics.lowHpCritPercent=sptId===2?30:25;
      if([4,58,75].includes(sptId))mechanics.statusImmune=[5];
      if([6,80].includes(sptId))mechanics.statusImmune=[0];
      if(sptId===18)mechanics.statusImmune=[2];
      const starts={15:[1,1,1,1,0,0],16:[0,0,2,0,0,0],34:[0,0,0,0,0,1],41:[0,1,0,1,0,0],66:[0,0,0,0,1,0]};
      if(starts[sptId])mechanics.startStages=starts[sptId];
      if(sptId===34)mechanics.openingSkill=old.openingSkill;
      boss.mechanics=mechanics;boss.abilities=[];delete boss.weekdayAbilities;delete boss.weekdayMechanics;
    }
  }
  const profile={sptId,mapId:boss.mapId,param2:boss.param2,petId:boss.petId,petName:boss.petName,native,
    name:plan?.name||boss.petName,mechanic:plan?.mechanic||boss.hint||'保留原生封印、阶段、招式和解法；不附加六职或伤害份额。',
    routeA:plan?.routeA,routeB:plan?.routeB,level:boss.level,hp:boss.customHP};
  if (plan) boss.hint = `【${plan.name}】${plan.mechanic}\n对策A：${plan.routeA}\n对策B：${plan.routeB}`;
  boss.sptBoss=profile;profiles.push(profile);
}
check(profiles.length===151,'Expected 151 SPT encounters');
check(new Set(profiles.map(p=>p.sptId).filter(Boolean)).size===135,'Expected 135 SPT IDs');
check(profiles.filter(p=>p.native).length===16,'Expected 16 native exemptions');
config.specialRules.specialKillCondition=config.specialRules.specialKillCondition.filter(rule=>rule.petId!==132);
config.specialRules.sequentialTypeBreak=config.specialRules.sequentialTypeBreak.filter(rule=>rule.petId!==216);
put('app/config/data/json/boss_abilities.json',JSON.stringify(config,null,2)+'\n');
const battleRoot='app/dist/GameServer/Game/Battle/';
put(battleRoot+'SPTBossRules.js',fs.readFileSync(path.join(root,'compat/server-patches/spt-boss/SPTBossRules.js')));
for(const name of ['UniverseBossRules','UniverseBossBiomes','UniverseBossFrontier'])put(battleRoot+name+'.js',fs.readFileSync(path.join(root,'compat/server-patches/universe-bosses',name+'.js')));
put(battleRoot+'UniverseBossBudget.js',fs.readFileSync(path.join(root,'compat/server-patches/universe-budgets/UniverseBossBudget.js')));
patch(battleRoot+'BossSpecialRules.js',text=>{
  text=replace(text,'        return require("./SPTTeamBattle").decorate(pet, bossConfig);','        if (bossConfig.sptBoss) {\n            pet.sptBossProfile = bossConfig.sptBoss; pet.sptBossWeekday = weekday;\n            if (!bossConfig.sptBoss.native && bossConfig.sptBoss.sptId === 13 && weekday === 0) pet.battleLevels[4] = 1;\n            if (!bossConfig.sptBoss.native && bossConfig.sptBoss.sptId === 14 && [1, 5].includes(weekday)) pet.battleLevels[0] = 1;\n            if (!bossConfig.sptBoss.native && bossConfig.sptBoss.sptId === 14 && [3, 6].includes(weekday)) pet.battleLevels[1] = 1;\n        }\n        return pet;');
  text=replace(text,'        if (defender.sptTeamProfile) return damage;\n','');
  text=replace(text,"        if (source === 'dot' && rule?.dotCannotKill && !boss.sptTeamProfile) {","        if (source === 'dot' && rule?.dotCannotKill) {");
  text=replace(text,'        if (require("./UniverseBossBudget").battleFor(pet)?.enemy === pet) return false;', '        if (require("./UniverseBossBudget").battleFor(pet)?.enemy === pet) return Array.isArray(mechanics?.statusImmune) && mechanics.statusImmune.includes(status);');
  text=replace(text,'        if (require("./UniverseBossBudget").battleFor(defender)?.enemy === defender) return undefined;', '        const bound = require("./UniverseBossBudget").battleFor(defender);\n        if (bound?.enemy === defender) return bound.universeBoss ? undefined : require("./SPTBossRules").checkHit(bound, skill);');
  text=replace(text,'        require(\'./PuniSealBattle\').ResolvePuniSurvival(battle, boss);','        if (require("./SPTBossRules").active(battle) && require("./SPTBossRules").survive(battle)) return;\n        require(\'./PuniSealBattle\').ResolvePuniSurvival(battle, boss);');
  text=replace(text,'pet.hp * 100 < pet.maxHp * percent);','(pet.sptBossProfile?.sptId === 2 ? pet.hp * 100 <= pet.maxHp * percent : pet.hp * 100 < pet.maxHp * percent));');
  return text;
});
patch(battleRoot+'BattleEffectIntegration.js',text=>replace(text,'        require("./SPTTeamBattle").prepare(battle);\n',''));
patch(battleRoot+'BattleTurnExecutor.js',text=>{
  text=replace(text,'        if (!battle.universeBoss && !require("./SPTTeamBattle").enabled(battle)) return this.ExecuteTurnUnbudgeted(battle, pet1SkillId, pet2SkillId, skillConfigs, options);','        if (!require("./UniverseBossBudget").enabled(battle)) return this.ExecuteTurnUnbudgeted(battle, pet1SkillId, pet2SkillId, skillConfigs, options);');
  text=replace(text,' require("./SPTTeamBattle").unbind(battle);','');
  text=replace(text,'        require("./SPTTeamBattle").beginTurn(battle);\n','');
  text=replace(text,'        require("./SPTTeamBattle").endTurn(battle);\n','');
  text=replace(text,'        const team = require("./SPTTeamBattle");\n        const context = team.beforeAction(battle, attacker, defender, skill, canAct);\n        const result = this.ExecuteAttackBudgeted(battle, attacker, defender, skill, attackerUserId, canAct, isFirst);\n        return team.afterAction(battle, attacker, defender, skill, result, context);','        return this.ExecuteAttackBudgeted(battle, attacker, defender, skill, attackerUserId, canAct, isFirst);');
  text=replace(text,' : require("./SPTTeamBattle").damage(battle, attacker, defender, universeDamageKind, damage);',' : damage;');
  // Extend the existing budgeted component pipeline, not a second damage path.
  text=text.replace(/battle\.universeBoss(?![?.\w])/g,'require("./UniverseBossBudget").enabled(battle)');
  text=replace(text,'&& [502, 1121, 1202].includes(battle.universeBoss.petId)', '&& (!battle.universeBoss || [502, 888, 1121, 1202].includes(battle.universeBoss.petId))');
  text=replace(text,'damage = require("./UniverseBossBudget").enabled(battle) && defender === battle.enemy ?', 'damage = battle.universeBoss && defender === battle.enemy ?');
  text=replace(text,'damage = require("./UniverseBossBudget").enabled(battle) && defender === battle.enemy && universeDamageKind === "ohko" ?', 'damage = battle.universeBoss && defender === battle.enemy && universeDamageKind === "ohko" ?');
  text=replace(text,'acted: !!canAct.canAct, hit: false, actionSerial:', 'acted: !!canAct.canAct, hit: false, isFirst, actionSerial:');
  text=replace(text,"            isCrit = SkillEffectRuntime_1.SkillEffectRuntime.Crit(battle, attacker, defender, skill, () => BattleCore_1.BattleCore.CheckCrit(attacker, defender, skill, isFirst));", "            isCrit = SkillEffectRuntime_1.SkillEffectRuntime.Crit(battle, attacker, defender, skill, () => BattleCore_1.BattleCore.CheckCrit(attacker, defender, skill, isFirst));\n            if (battle.universeBudgetState?.actionContext) battle.universeBudgetState.actionContext.isCrit = isCrit;");
  return text;
});
patch(battleRoot+'BattleManager.js',text=>{
  text=replace(text,'        if (!battle?.universeBoss && !require("./SPTTeamBattle").enabled(battle)) return;\n        const text = [require("./SPTTeamBattle").telegraph(battle), require("./UniverseBossRules").nextTelegraph(battle)].filter(Boolean).join("\\n");','        if (!battle?.universeBoss && !battle?.enemy?.sptBossProfile) return;\n        const text = require("./UniverseBossRules").nextTelegraph(battle) || battle.enemy.sptBossProfile?.mechanic || "";');
  text=replace(text,'        const isPP = medicine?.ItemType === 2;\n        const battle = this._currentBattle;', '        const isPP = medicine?.ItemType === 2;\n        const battle = this._currentBattle;\n        const isCure = !!battle?.enemy?.sptBossProfile && !battle.enemy.sptBossProfile.native && Number.isInteger(medicine?.RemoveMonStat);');
  text=replace(text,'battle.player.hp <= 0 || (!isPP && battle.player.hp >= battle.player.maxHp)', 'battle.player.hp <= 0 || (!isPP && !isCure && battle.player.hp >= battle.player.maxHp)');
  text=replace(text,'const healAmount = isPP ? medicine?.PP : medicine?.HP;', 'const healAmount = isPP ? medicine?.PP : isCure ? 0 : medicine?.HP;');
  text=replace(text,'        if ((!isPP && ![300011, 300012, 300013, 300014, 300015].includes(itemId)) || medicine?.ItemType !== (isPP ? 2 : 1) || !Number.isInteger(healAmount) ||\n            !healAmount || healAmount <= 0 || !pet || !item) {', '        if ((!isPP && !isCure && ![300011, 300012, 300013, 300014, 300015].includes(itemId)) ||\n            (!isCure && (medicine?.ItemType !== (isPP ? 2 : 1) || !Number.isInteger(healAmount) || healAmount <= 0)) ||\n            (isCure && !require("./SkillEffectRuntime").SkillEffectRuntime.HasStatus(battle.player, medicine.RemoveMonStat)) || !pet || !item) {');
  text=replace(text,'            const oldHp = battle.player.hp;\n            const nextHp = Math.min(battle.player.maxHp, oldHp + healAmount);', '            if (isCure) {\n                const status = medicine.RemoveMonStat;\n                if (battle.player.statusDurations) battle.player.statusDurations[status] = 0;\n                if (battle.player.status === status) { battle.player.status = -1; battle.player.statusTurns = 0; }\n                await this.Player.SendPacket(new Battle_1.PacketUsePetItem(this.UserID, itemId, battle.player.hp, 0));\n                await this.ContinueNieoMedicineTurn(catchTime, isCurrent);\n                return;\n            }\n            const oldHp = battle.player.hp;\n            const nextHp = Math.min(battle.player.maxHp, oldHp + healAmount);');
  // Committed medicine can end the fight; rewards must not wait on its inventory lock.
  text=replace(text,'const release = this.Player.ItemManager.ItemData.BeginMutation();','let release = this.Player.ItemManager.ItemData.BeginMutation();');
  text=replace(text,'await this.RunBattleAction(CommandID_1.CommandID.USE_PET_ITEM, () => this.UsePetItem(itemId, catchTime));', `await this.RunBattleAction(CommandID_1.CommandID.USE_PET_ITEM, async () => {
                    let continueTurn;
                    try {
                        continueTurn = await this.UsePetItem(itemId, catchTime);
                    }
                    finally {
                        const committedRelease = release;
                        release = undefined;
                        committedRelease?.();
                    }
                    if (continueTurn) {
                        this._petItemInProgress = true;
                        try { await this.ContinueNieoMedicineTurn(catchTime, continueTurn); }
                        finally { this._petItemInProgress = false; }
                    }
                });`,2);
  text=replace(text,'        finally {\n            release();\n        }\n    }\n    async UsePetItem', '        finally {\n            release?.();\n        }\n    }\n    async UsePetItem');
  text=replace(text,'                await this.ContinueNieoMedicineTurn(catchTime, isCurrent);\n                return;', '                return isCurrent;',2);
  text=replace(text,'            await this.ContinueNieoMedicineTurn(catchTime, isCurrent);', '            return isCurrent;');
  return replace(text,'        if (winnerId === this.UserID && !require("./SPTTeamBattle").victoryAllowed(battle)) { winnerId = 0; reason = 0; }\n','');
});
patch(battleRoot+'SkillEffectRuntime.js',text=>{
  text=text.replace(/battle\.universeBoss(?![?.\w])/g,'require("./UniverseBossBudget").enabled(battle)');
  text=replace(text,'        target.statusTurns = Math.max(1, turns);','        if (target.sptBossProfile?.sptId === 13 && target.sptBossWeekday === 1) turns = Math.min(turns, 1);\n        target.statusTurns = Math.max(1, turns);');
  text=replace(text,'// Root crowns count landed hits even when elemental immunity makes damage zero.','// Preserve the multi-hit display count on elemental immunity; zero damage never breaks armor.');
  return text;
});
const removed=[battleRoot+'SPTTeamBattle.js'];
const manifest={generatedAt:new Date().toISOString(),files,removed,restartGame:true,restartWeb:false,databaseChanges:false};
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'boss-plan.json'),JSON.stringify({profiles},null,2)+'\n');
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({out,files:files.length,removed,encounters:profiles.length,sptIds:135,designGroups:128}));
