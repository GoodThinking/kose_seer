'use strict';
// Natural real-turn battles with legal learned moves, finite items and recorded entropy.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const [runtime,destination,scope='all']=process.argv.slice(2);if(!runtime||!destination)throw Error('Usage: node spt-boss-lab.cjs <runtime> <report.json> [all|map/region,...]');
const designMode=process.argv[5]==='design',contracts=require('./spt-boss-route-contracts.cjs');
const app=path.resolve(runtime),output=path.resolve(destination);process.chdir(app);
const load=f=>require(path.join(app,'dist',f));
const {Logger,LogLevel}=load('shared/utils/Logger');Logger.SetMinLevel(LogLevel.Error);
const {ConfigLoader}=load('shared/config/ConfigLoader'),{ConfigRegistry}=load('shared/config/ConfigRegistry'),{GetGameConfigRegistrations}=load('shared/config/ConfigDefinitions');
const {GameConfig}=load('shared/config/game/GameConfig'),{BossAbilityConfig}=load('GameServer/Game/Battle/BossAbility/BossAbilityConfig');
const {BattleInitService}=load('GameServer/Game/Battle/services/BattleInitService'),{BattleTurnService}=load('GameServer/Game/Battle/services/BattleTurnService');
const {BattleManager}=load('GameServer/Game/Battle/BattleManager'),{BattleEffectIntegration}=load('GameServer/Game/Battle/BattleEffectIntegration');
const {PetCalculator}=load('GameServer/Game/Pet/PetCalculator'),{BattleAlgorithm}=load('GameServer/Game/Battle/BattleAlgorithm');
const {hasElement}=load('GameServer/Game/Battle/UniverseBossElements');
const init=new BattleInitService({Uid:1}),service=new BattleTurnService(),originalRandom=Math.random;
const definitions=JSON.parse(fs.readFileSync(path.join(app,'config/data/json/boss_abilities.json')));
const argCounts=new Map(JSON.parse(fs.readFileSync(path.join(app,'config/data/json/skill_effects_v2.json'))).effects.map(e=>[e.effectId,e.argsNum||0]));
const entries=skill=>{const ids=String(skill?.SideEffect||'').trim().split(/\s+/).filter(Boolean).map(Number),args=String(skill?.SideEffectArg||'').trim().split(/\s+/).filter(Boolean).map(Number);let offset=0;return ids.map(id=>({id,args:args.slice(offset,offset+=argCounts.get(id)||0)}));};
const attack=s=>s&&[1,2].includes(s.Category)&&s.Power>0;
const heal=s=>s.Category===4&&entries(s).some(e=>[43,155].includes(e.id));
const clear=s=>entries(s).some(e=>[33,430,453].includes(e.id));
const lower=(s,index)=>entries(s).some(e=>e.id===5&&e.args[0]===index&&e.args[1]>=100&&e.args[2]<0);
const boost=s=>s.Category===4&&entries(s).some(e=>e.id===4&&[0,2].includes(e.args[0])&&e.args[2]>0);
const instant=s=>entries(s).some(e=>e.id===36&&e.args[0]>0);
const inflict=(s,status)=>entries(s).some(e=>({10:0,11:1,12:2,14:5,15:6,16:8})[e.id]===status&&(e.args[0]??30)>0);
const multi=s=>entries(s).some(e=>e.id===31);
const restore=s=>entries(s).some(e=>e.id===3||e.id===155);
const immune=s=>entries(s).some(e=>e.id===191||e.id===471);
const matches=(skill,rule)=>(!rule.types||rule.types.includes(skill.Type))&&(!rule.sequence||rule.sequence.includes(skill.Type))&&(!rule.notTypes||!rule.notTypes.some(type=>hasElement({type:skill.Type},type)))&&(!rule.category||skill.Category===rule.category)&&(!rule.mustHit||skill.MustHit)&&(!rule.multi||multi(skill))&&(!rule.noDefenseDrop||!entries(skill).some(e=>e.id===5&&[1,3].includes(e.args[0])&&e.args[2]<0));
const features=(boss,route)=>designMode?contracts.requirements(boss,route):{};
const actualRules=load('GameServer/Game/Battle/UniverseBossRules'),actualBudget=load('GameServer/Game/Battle/UniverseBossBudget'),effects=load('GameServer/Game/Battle/SkillEffectRuntime').SkillEffectRuntime;
if(designMode){
  const clear=actualRules.onStatClear;actualRules.onStatClear=function(b,source,target,indices,changes){b.designEvents?.push({kind:'clear',turn:b.turn,enemy:target===b.enemy,changes,first:b.universeBudgetState?.actionContext?.isFirst});return clear(...arguments);};
  const inflict=effects.Inflict;effects.Inflict=function(target,status){const b=actualBudget.battleFor(target),before=effects.HasStatus(target,status),result=inflict.apply(this,arguments);b?.designEvents?.push({kind:'status',turn:b.turn,enemy:target===b.enemy,status,success:!before&&effects.HasStatus(target,status)});return result;};
  const damage=actualBudget.damage;actualBudget.damage=function(b,source,target,kind,amount){const actual=damage(...arguments);if(actual>0)b?.designEvents?.push({kind:'damage',turn:b.turn,enemy:target===b.enemy,damageKind:kind,amount:actual});return actual;};
  const heal=actualBudget.heal;actualBudget.heal=function(b,pet,amount,options){const actual=heal(...arguments);if(actual>0)b?.designEvents?.push({kind:'heal',turn:b.turn,enemy:pet===b.enemy,amount:actual,active:!!options?.active});return actual;};
  const after=actualRules.afterAction;actualRules.afterAction=function(b,actor,target,skill,result,context){if(b?.designEvents&&actor===b.player&&context.acted&&context.hit)for(const status of[0,1,2,5,6,8])if(effects.HasStatus(b.enemy,status))b.designEvents.push({kind:'status',turn:b.turn,enemy:true,status,success:true});return after(...arguments);};
}
const learned=pet=>[...new Set((pet.LearnableMoves?.Move||[]).filter(m=>+(m.LearningLv||0)<=100).map(m=>+(m.ID||m.id)))].map(id=>GameConfig.GetSkillById(id)).filter(Boolean);
const COUNTERS={1:[3,4],4:[3,11],5:[5,9],6:[7],8:[3,7,11],9:[12,5],11:[2,3,1],12:[12,13],17:[1,5],18:[2],19:[15,11],20:[3],23:[3,6],24:[2,7],27:[12,13],30:[1,5],32:[2,12],33:[3,4],35:[11],36:[1,5],37:[2],40:[7],41:[3,11],43:[7],44:[11],45:[7],47:[1,5],48:[3],49:[2,1],50:[2,7],52:[3,4],53:[15,11],55:[5,9],56:[3],58:[11,15],59:[11],61:[12,5],62:[1,5],63:[12,13],65:[12,13],66:[5,9],67:[3,4],68:[2,7],69:[12,13],70:[1,5],71:[5,9],72:[2,1],73:[3,7],74:[12,5],75:[3],76:[3,11],77:[1],78:[15,11],80:[7],81:[3,6],90:[3,4],91:[1,5],94:[3,9],97:[3],99:[2,7],104:[2,4],110:[2],114:[2],118:[3,7],120:[1],125:[2],126:[2],127:[3]};
const DEFENSE=new Set([7,29,34,40,54,57,62,64,86,89,103,106,117,125,129]);
const SPECIAL=new Set([1,16,18,38,40,51,70,77,81,97,101,102]);
function scoreMove(skill,boss){return (skill.Power||0)*BattleAlgorithm.GetTypeEffectiveness(skill.Type||8,GameConfig.GetPetById(boss.petId).Type)*(skill.MustHit?1.1:1);}
let pools=[];
function candidates(boss,route){
  const id=boss.sptBoss.sptId,rule=features(boss,route),types=designMode?(rule.types||rule.sequence||[]):(COUNTERS[id]||[]),native=boss.sptBoss.native;
  const seal=boss.mapId===514?load('GameServer/Game/Battle/PuniSealBattle').GetPuniSeal({bossMapId:boss.mapId,bossParam2:boss.param2}):null;
  const enemy=init.BuildBossBattlePet(boss,GameConfig.GetPetById(boss.petId)),incoming=enemy.skills.map(id=>GameConfig.GetSkillById(id)).filter(attack);
  const eligible=skill=>attack(skill)&&(!seal?.elementOnlyTypes?.length||seal.elementOnlyTypes.includes(skill.Type||8))&&(!boss.mechanics?.onlyMustHit||skill.MustHit)&&(!boss.mechanics?.counterKillThreshold||skill.Power<=50)&&(!designMode||matches(skill,rule));
  const statusOnly=boss.mechanics?.directDamageImmune;
  const ranked=[];
  for(const row of pools){
    const all=row.moves;
    if(rule.resist&&BattleAlgorithm.GetTypeEffectiveness(rule.resist,row.pet.Type)>=1)continue;
    if(rule.clear&&!all.some(clear)||rule.boost&&!all.some(boost)||rule.restore&&!all.some(restore)||rule.status!==undefined&&!all.some(s=>inflict(s,rule.status)))continue;
    if(rule.cleanse&&([12,27].includes(id)||rule.antifreeze)&&!all.some(immune))continue;
    if((rule.alternateCategories||rule.phaseCategories||rule.breakResonance)&&(!all.some(s=>attack(s)&&s.Category===1)||!all.some(s=>attack(s)&&s.Category===2)))continue;
    if(rule.openWithTypes&&!all.some(s=>attack(s)&&rule.openWithTypes.includes(s.Type)))continue;
    if(seal?.lifeHealPerTurn&&!all.some(instant))continue;
    const offensive=all.filter(eligible).sort((a,b)=>{
      const bonus=s=>scoreMove(s,boss)+(route==='A'&&types.includes(s.Type)?400:0)+(route==='B'&&SPECIAL.has(id)&&s.Category===2?300:0)+(statusOnly&&[1,2,5].some(status=>inflict(s,status))?100000:0);
      return bonus(b)-bonus(a);
    });if(!offensive.length)continue;
    if(statusOnly&&!offensive.some(s=>[1,2,5].some(status=>inflict(s,status))))continue;
    const key=offensive[0],important=[key];
    if(rule.fast&&PetCalculator.CalculateStat(row.pet.ID,'speed',100,31,252,0)<=enemy.speed&&!(key.Priority>0))continue;
    if(rule.fast||rule.weakThird)important.push(offensive.slice().sort((a,b)=>a.Power-b.Power)[0]);
    if(rule.openWithTypes)important.push(all.find(s=>attack(s)&&rule.openWithTypes.includes(s.Type)));
    if(rule.status!==undefined)important.push(all.find(s=>inflict(s,rule.status)));
    if(rule.restore)important.push(all.find(restore));
    if(rule.cleanse&&([12,27].includes(id)||rule.antifreeze))important.push(all.find(immune));
    if(seal?.lifeHealPerTurn)important.unshift(all.find(instant));
    const weakened=(designMode?rule.lowerDefense:DEFENSE.has(id)&&route==='A')?all.find(s=>lower(s,key.Category===1?1:3)):null;
    const offense=rule.lowerOffense?all.find(s=>lower(s,0)||lower(s,2)):null;
    if(rule.lowerDefense&&!weakened||rule.lowerOffense&&!offense)continue;
    if(offense)important.push(offense);
    if(weakened)important.push(weakened);
    if(native&&boss.mechanics?.armorBreak==='both')for(const stat of[1,3])important.push(all.find(s=>lower(s,stat)));
    if(rule.clear||rule.clearIfPositive||(native||!designMode)&&(!native||!boss.alderDoor))important.push(all.find(clear));
    if(rule.boost)important.push(all.find(boost));
    const needsDual=rule.alternateCategories||rule.phaseCategories||rule.breakResonance,second=all.filter(eligible).find(s=>s.ID!==key.ID&&(needsDual?s.Category!==key.Category:s.Category!==key.Category||s.Type!==key.Type))||all.find(s=>attack(s)&&s.ID!==key.ID&&(!needsDual||s.Category!==key.Category));
    if(rule.alternateMoves||needsDual||rule.sequence||!designMode&&[11,47,65,83,87,92,98,99,108,117,120,122,125,128].includes(id))important.splice(1,0,second);
    important.push(all.find(heal));
    important.push(...(rule.noBoost?[]:[all.find(boost)]),...offensive,...all.filter(s=>!rule.noBoost||!boost(s)));
    const kit=[...new Map(important.filter(Boolean).map(s=>[s.ID,s])).values()].slice(0,4);
    if(rule.clear&&!kit.some(clear)||rule.boost&&!kit.some(boost)||rule.restore&&!kit.some(restore)||rule.status!==undefined&&!kit.some(s=>inflict(s,rule.status))||rule.lowerDefense&&!kit.includes(weakened)||rule.lowerOffense&&!kit.includes(offense))continue;
    const p=row.pet,threat=Math.max(1,...incoming.map(s=>s.Power*BattleAlgorithm.GetTypeEffectiveness(s.Type||8,p.Type)/(s.Category===1?p.Def:p.SpDef)));
    const utility=(kit.some(heal)?3000:0)+(weakened?1500:0)+(kit.some(clear)?1000:0);
    const score=(p.HP+150)*60/threat+scoreMove(key,boss)*(key.Category===1?p.Atk:p.SpAtk)/50+utility+(route==='A'&&types.includes(key.Type)?2000:0);
    const main=key.Category===1?'atk':'spAtk';const training={hp:rule.fast?6:252,atk:0,def:0,spAtk:0,spDef:0,speed:rule.fast?252:6};training[main]=252;
    ranked.push({score,id:p.ID,key:key.ID,skills:kit.map(s=>s.ID),training});
  }
  return ranked.sort((a,b)=>b.score-a.score);
}
function member(spec,index){
  const p=GameConfig.GetPetById(spec.id),level=100,dv=31,hp=PetCalculator.CalculateHP(spec.id,level,dv,spec.training.hp),stat=name=>PetCalculator.CalculateStat(spec.id,name,level,dv,spec.training[name],0);
  const result=init.BuildBattlePet(spec.id,p.DefName,level,hp,hp,stat('atk'),stat('def'),stat('spAtk'),stat('spDef'),stat('speed'),p.Type,spec.skills,1700000000+index+spec.id*10,0);
  Object.assign(result,{dv,nature:0,evHp:spec.training.hp,evAtk:spec.training.atk,evDef:spec.training.def,evSpAtk:spec.training.spAtk,evSpDef:spec.training.spDef,evSpeed:spec.training.speed});return result;
}
async function run(config,specs,route,variation){
  const seed=(config.mapId*65537+config.param2*257+config.petId+7+variation*104729)>>>0;let randomState=seed;
  Math.random=()=>((randomState=(Math.imul(randomState,1664525)+1013904223)>>>0)/4294967296);
  const roster=specs.map(member),player=roster[0],enemy=init.BuildBossBattlePet(config,GameConfig.GetPetById(config.petId));
  // UpdateBattlePet mutates the active proxy; keep the first party entry independent.
  roster[0]={...player,skills:player.skills.slice(),skillPP:player.skillPP.slice()};
  const battle={userId:1,player,enemy,turn:0,isOver:false,roundCount:0,lastHitWasCritical:false,battleType:'BOSS',bossMapId:config.mapId,bossParam2:config.param2,startTime:0};
  const rule=features(config,route);if(designMode)battle.designEvents=[];
  if(config.universeBossKey)battle.universeBoss={key:config.universeBossKey,mapId:config.mapId,region:config.param2,petId:config.petId,tier:config.universeTier,spt:config.spt};
  load('GameServer/Game/Battle/PuniSealBattle').InitPuniSeal(battle);await init.TriggerPassiveAbilities(battle.player,enemy);load('GameServer/Game/Battle/AlderSealBattle').InitAlder(battle);BattleEffectIntegration.OnBattleStart(battle);
  const manager=new BattleManager({Uid:1});manager._currentBattle=battle;manager.UpdatePlayerHPRecord();let active=0;
  const native=config.sptBoss.native,supplies={300015:99,300018:native?60:36,...(rule.cleanse?{300610:12,300611:12,300612:12,300613:12,300614:12,300615:12,300616:12}:{})},remaining={...supplies},usedItems=Object.fromEntries(Object.keys(supplies).map(id=>[id,0])),trace=[];
  const cost=()=>load('GameServer/Game/Battle/ChampionPetRuntime').ChampionPetRuntime.PPCost(battle.player)*load('GameServer/Game/Battle/AlderSealBattle').PPCostMultiplier(battle);
  const usable=id=>{const i=battle.player.skills.indexOf(id);return i>=0&&battle.player.skillPP[i]>=cost();};
  function record(extra){
    roster[active].hp=battle.player.hp;roster[active].skillPP=battle.player.skillPP.slice();manager.UpdatePlayerHPRecord();
    const metadata=designMode?{enemyLevels:[...enemy.battleLevels],ownLevels:[...battle.player.battleLevels],ownMaxHp:battle.player.maxHp,bossMaxHp:enemy.maxHp,healBlocked:!!enemy.effectStates?.healBlock,enemyFatigue:effects.HasStatus(enemy,7),ownStatusImmune:effects.IsStatusImmune(battle.player)||!!effects.Get(battle.player,'statusReflect'),mechanics:Object.fromEntries(Object.entries(battle.sptBossState||battle.universeBossState||{}).filter(([,value])=>value===null||['number','boolean','string'].includes(typeof value)))}:{};
    trace.push({turn:battle.turn,active:battle.player.id,activeCatchTime:battle.player.catchTime,hp:battle.player.hp,bossHp:enemy.hp,...metadata,...extra});
  }
  function take(id){
    const ownFrostBefore=effects.HasStatus(battle.player,5),sequence=battle.sptBossState||battle.universeBossState||{},expectedType=rule.sequence?.[(sequence.sequence||0)%rule.sequence.length],attackOrdinal=(sequence.attacks||0)+1;
    battle.player.skillPP[battle.player.skills.indexOf(id)]-=cost();const result=service.ExecuteTurn(battle,id),own=[result.firstAttack,result.secondAttack].find(a=>a?.userId===1),foe=[result.firstAttack,result.secondAttack].find(a=>a?.userId===0);
    record({skill:id,outgoing:own?.damage,missed:own?.missed,enemySkill:foe?.skillId,incoming:foe?.damage,...(designMode?{acted:own?.skillId===id,first:result.firstAttack?.userId===1,hits:own?.atkTimes||1,ownFrostBefore,expectedType,attackOrdinal}:{})});
  }
  function medicine(id){if(remaining[id]<=0)return false;if(id===300015){if(battle.player.hp>=battle.player.maxHp)return false;battle.player.hp=Math.min(battle.player.maxHp,battle.player.hp+200);}else{if(battle.player.skills.every((id,i)=>battle.player.skillPP[i]>=GameConfig.GetSkillById(id).MaxPP))return false;battle.player.skillPP=battle.player.skills.map((id,i)=>Math.min(GameConfig.GetSkillById(id).MaxPP,battle.player.skillPP[i]+20));}remaining[id]--;usedItems[id]++;const result=service.ExecuteEnemyTurn(battle);record({item:id,incoming:result.damage,enemySkill:result.skillId});return true;}
  function cure(){
    const mapping={6:300610,7:300611,8:300612,0:300613,2:300614,5:300615,1:300616};
    const status=Object.keys(mapping).map(Number).find(status=>effects.HasStatus(battle.player,status)&&remaining[mapping[status]]>0);if(status===undefined)return false;
    const item=mapping[status];remaining[item]--;usedItems[item]++;battle.player.statusDurations[status]=0;if(battle.player.status===status){battle.player.status=-1;battle.player.statusTurns=0;}battle.designEvents.push({kind:'cure',status,turn:battle.turn+1,success:true});
    const result=service.ExecuteEnemyTurn(battle);record({item,incoming:result.damage,enemySkill:result.skillId});return true;
  }
  async function swap(index){const next=roster[index],free=battle.player.hp<=0;const info={petId:next.id,nick:next.name,level:next.level,hp:next.hp,maxHp:next.maxHp,atk:next.attack,def:next.defence,spAtk:next.spAtk,spDef:next.spDef,speed:next.speed,catchTime:next.catchTime,skillArray:next.skills,skillPP:Object.fromEntries(next.skills.map((id,i)=>[id,next.skillPP[i]])),dvHp:31,dvAtk:31,dvDef:31,dvSpAtk:31,dvSpDef:31,dvSpeed:31,nature:0,evHp:next.evHp,evAtk:next.evAtk,evDef:next.evDef,evSpAtk:next.evSpAtk,evSpDef:next.evSpDef,evSpeed:next.evSpeed};manager.UpdateBattlePet(battle.player,info,GameConfig.GetPetById(next.id));active=index;const result=free?null:service.ExecuteEnemyTurn(battle);record({swap:true,free,incoming:result?.damage,enemySkill:result?.skillId});}
  let lastHit=0;
  while(!battle.isOver&&enemy.hp>0&&battle.turn<(native?1000:400)){
    if(battle.player.hp<=0){const next=roster.findIndex(p=>p.hp>0);if(next<0)break;await swap(next);continue;}
    const pet=battle.player,available=pet.skills.filter(usable).map(id=>GameConfig.GetSkillById(id));
    if(rule.relay&&(active===0||!trace.some(step=>step.mechanics?.vulnerableThrough>=step.turn+2))){const type=active===0?1:5,attacks=available.filter(skill=>attack(skill)&&skill.Type===type).sort((a,b)=>active===0?a.Power-b.Power:scoreMove(b,config)-scoreMove(a,config));if(attacks[0]){take(attacks[0].ID);continue;}}
    const tide=battle.universeBossState||{};if(rule.finishBeforeHeal&&tide.tideSkillTurn===battle.turn+1||rule.healWindow&&tide.tideOpenTurn===battle.turn+1){const finisher=available.filter(attack).sort((a,b)=>scoreMove(b,config)*(b.Category===1?pet.attack:pet.spAtk)-scoreMove(a,config)*(a.Category===1?pet.attack:pet.spAtk))[0];if(finisher){take(finisher.ID);continue;}}
    if(rule.healWindow&&!tide.tideHeals&&tide.tideSkillTurn===battle.turn+1){const prepare=available.find(skill=>skill.Category===4);if(prepare){take(prepare.ID);continue;}}
    const mechanicState=battle.sptBossState||battle.universeBossState||{},interrupt=rule.interrupt;if(interrupt&&mechanicState[interrupt.pending]===battle.turn+1){const counter=interrupt.kind==='attack'?available.filter(skill=>attack(skill)&&matches(skill,rule)).sort((a,b)=>scoreMove(b,config)-scoreMove(a,config))[0]:available.find(skill=>(interrupt.kind==='defense'?[1,3]:[0,2]).some(index=>enemy.battleLevels[index]>-6&&lower(skill,index)));if(counter){take(counter.ID);continue;}}
    if(rule.opening&&mechanicState[rule.opening]>=battle.turn+1&&(!rule.openingFrom||mechanicState[rule.openingFrom]<=battle.turn+1)&&!trace.some(step=>step.acted&&step.outgoing>0&&step.mechanics[rule.opening]>=step.turn&&(!rule.openingFrom||step.mechanics[rule.openingFrom]<=step.turn)&&(!rule.openWithTypes||!rule.openWithTypes.includes(GameConfig.GetSkillById(step.skill).Type)))){const counter=available.filter(skill=>attack(skill)&&matches(skill,rule)&&(!rule.alternateCategories||!lastHit||skill.Category!==GameConfig.GetSkillById(lastHit).Category)).sort((a,b)=>scoreMove(b,config)-scoreMove(a,config))[0];if(counter){take(counter.ID);if(trace.at(-1).outgoing>0&&!trace.at(-1).missed)lastHit=counter.ID;continue;}}
    if(rule.cleanse&&cure())continue;
    if(rule.swap&&battle.turn>0&&battle.turn%3===0&&trace.at(-1)?.swap!==true){const next=roster.findIndex((p,i)=>i!==active&&p.hp>0);if(next>=0){await swap(next);continue;}}
    const restoring=rule.restore&&pet.battleLevels.some(v=>v<0)?available.find(restore):null;if(restoring){take(restoring.ID);continue;}
    const protect=rule.cleanse&&([12,27].includes(config.sptBoss.sptId)||rule.antifreeze&&battle.designEvents.some(event=>event.kind==='cure'&&event.status===5)),immunity=protect&&!effects.IsStatusImmune(pet)&&!effects.Get(pet,'statusReflect')?available.find(immune):null;if(immunity){take(immunity.ID);continue;}
    const statusMove=rule.status!==undefined&&!effects.HasStatus(enemy,rule.status)?available.find(s=>inflict(s,rule.status)):null;if(statusMove){take(statusMove.ID);continue;}
    const lastIncoming=Math.max(40,...trace.slice(-3).map(s=>s.incoming||0));
    const lastPrepared=rule.interruptStatusChain&&trace.at(-1)?.acted&&GameConfig.GetSkillById(trace.at(-1).skill)?.Category===4,healing=!lastPrepared&&available.find(heal);
    if(pet.hp<pet.maxHp*.5||pet.hp<=lastIncoming*1.35){if(healing){take(healing.ID);continue;}if(medicine(300015))continue;}
    const clearMove=available.find(clear);if(clearMove&&enemy.battleLevels.some(v=>v>0)&&!load('GameServer/Game/Battle/AlderSealBattle').IsStatClearImmune(enemy)){take(clearMove.ID);continue;}
    const key=GameConfig.GetSkillById(specs[active].key),stat=key.Category===1?1:3;
    const debuff=(!designMode||native||rule.lowerDefense)?available.find(s=>lower(s,stat)):null;if(debuff&&enemy.battleLevels[stat]>=0&&!BossAbilityConfig.Instance.GetBossConfigByMapAndParam(config.mapId,config.param2).mechanics?.statDownImmune){take(debuff.ID);continue;}
    const lowerAttack=rule.lowerOffense?available.find(s=>[0,2].some(index=>enemy.battleLevels[index]>=0&&lower(s,index))):null;if(lowerAttack){take(lowerAttack.ID);continue;}
    const boosting=!rule.noBoost&&!lastPrepared&&available.find(boost);if(boosting&&!battle.enemy.alderState?.stealStats&&entries(boosting).some(e=>e.id===4&&[0,2].includes(e.args[0])&&pet.battleLevels[e.args[0]]<(rule.finishBeforeHeal?6:4))){take(boosting.ID);continue;}
    const seal=config.mapId===514?load('GameServer/Game/Battle/PuniSealBattle').GetPuniSeal(battle):null;
    const attacks=available.filter(attack).filter(s=>!seal?.elementOnlyTypes?.length||seal.elementOnlyTypes.includes(s.Type||8));
    if(seal?.lifeHealPerTurn){const ohko=attacks.find(instant);if(ohko){take(ohko.ID);continue;}}
    const valid=attacks.filter(s=>(!enemy.bossMechanics?.directDamageImmune||[1,2,5].some(status=>inflict(s,status)))&&(!designMode||matches(s,rule)));
    if(rule.openWithTypes&&!(mechanicState.openThrough>=battle.turn+1)){const opener=available.find(skill=>attack(skill)&&rule.openWithTypes.includes(skill.Type));if(opener){take(opener.ID);continue;}}
    if(rule.phaseCategories||rule.breakResonance){const wanted=rule.phaseCategories?rule.phaseCategories[battle.turn%rule.phaseCategories.length]:mechanicState.resonanceCount>=2?3-mechanicState.resonanceCategory:key.Category;if(wanted){const matching=valid.filter(skill=>skill.Category===wanted);if(matching.length)valid.splice(0,valid.length,...matching);else if(medicine(300018))continue;}}
    if(rule.weakThird){const third=((mechanicState.attacks||0)+1)%3===0;valid.sort((a,b)=>third?a.Power-b.Power:b.Power-a.Power);if(valid[0]){take(valid[0].ID);continue;}}
    if(rule.alternateMoves&&lastHit){const matching=valid.filter(skill=>skill.ID!==lastHit);if(matching.length)valid.splice(0,valid.length,...matching);else if(medicine(300018))continue;}
    if(rule.burst&&(battle.turn+1)%rule.burst[0]!==rule.burst[1]){const prepare=available.find(s=>s.Category===4);if(prepare){take(prepare.ID);continue;}if(medicine(300018))continue;}
    if(rule.sequence){const state=battle.sptBossState||battle.universeBossState||{},index=state.sequence||0,wanted=rule.sequence[index%rule.sequence.length],matching=valid.filter(s=>s.Type===wanted);if(matching.length)valid.splice(0,valid.length,...matching);else{const advances=rule.naturalAdvanceEvery&&(battle.turn+1)%rule.naturalAdvanceEvery===0,afterSwitch=rule.sequence[(index+Number(!!advances))%rule.sequence.length];if(!available.some(skill=>attack(skill)&&skill.Type===afterSwitch)){const next=roster.findIndex((p,i)=>i!==active&&p.hp>0&&p.skills.some((id,slot)=>p.skillPP[slot]>0&&GameConfig.GetSkillById(id).Type===afterSwitch));if(next>=0){await swap(next);continue;}}}}
    if(rule.alternateCategories&&lastHit){const previous=GameConfig.GetSkillById(lastHit).Category,matching=valid.filter(s=>s.Category!==previous);if(matching.length)valid.splice(0,valid.length,...matching);else if(medicine(300018))continue;}
    const scores=valid.map(s=>{let score=scoreMove(s,config)*(s.Category===1?pet.attack:pet.spAtk);if(enemy.bossMechanics?.onlyMustHit&&!s.MustHit)score=0;if(route==='A'&&(COUNTERS[config.sptBoss.sptId]||[]).includes(s.Type))score*=2;if(lastHit===s.ID&&valid.some(other=>other.ID!==s.ID))score*=.15;return {s,score};}).sort((a,b)=>b.score-a.score);
    if(scores[0]?.score>0){const before=enemy.hp;take(scores[0].s.ID);const actual=trace.at(-1);if(native?enemy.hp<before:actual.outgoing>0&&!actual.missed&&(!designMode||actual.acted))lastHit=scores[0].s.ID;continue;}
    if(medicine(300018))continue;
    const next=roster.findIndex((p,i)=>i!==active&&p.hp>0&&p.skillPP.some(pp=>pp>0));if(next>=0){await swap(next);continue;}break;
  }
  Math.random=originalRandom;
  const evidence=designMode&&!native?contracts.verify(rule,trace,battle.designEvents,GameConfig.GetSkillById.bind(GameConfig)):null;
  return {route,seed,won:enemy.hp<=0&&(!evidence||evidence.passed),naturalVictory:enemy.hp<=0,turns:battle.turn,bossHp:enemy.hp,specs,supplies,usedItems,party:roster.map(p=>({id:p.id,hp:p.hp,maxHp:p.maxHp})),trace,...(designMode?{requirements:rule,evidence,events:battle.designEvents}:{})};
}
(async()=>{
  ConfigLoader.Instance._configDir=path.join(app,'config');ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());await ConfigRegistry.Instance.Initialize();await load('shared/config/game/SkillEffectsConfig').SkillEffectsConfig.Instance.Load();BossAbilityConfig.Instance.Load();load('GameServer/Game/Battle/effects');
  const species=GameConfig.GetAllPets(),spawn=JSON.parse(fs.readFileSync(path.join(app,'config/data/json/map-ogres.json'))),collection=JSON.parse(fs.readFileSync(path.join(app,'config/data/json/collect-plans.json'))),signing=JSON.parse(fs.readFileSync(path.join(app,'config/data/json/daily-sign.json')));
  const available=new Set([...Object.values(spawn.maps).flatMap(m=>(m.ogres||[]).map(p=>p.petId)),...collection.plans.flatMap(p=>p.rewards),...signing.pets]),families=new Set(species.filter(p=>available.has(p.ID)).map(p=>p.PetClass));
  pools=species.filter(p=>families.has(p.PetClass)||['丽莎布布','鲁斯王','魔焰猩猩'].includes(p.DefName)).map(pet=>({pet,moves:learned(pet)})).filter(p=>p.moves.length>=4);
  const selected=definitions.bossConfigs.filter(b=>b.sptBoss&&(scope==='all'||scope.split(',').includes(b.mapId+'/'+b.param2))),results=[];
  const save=()=>{const result={scope,runtime:app,mode:designMode?'design':'candidate',bossConfigHash:crypto.createHash('sha256').update(fs.readFileSync(path.join(app,'config/data/json/boss_abilities.json'))).digest('hex'),policyHash:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),contractsHash:designMode?crypto.createHash('sha256').update(fs.readFileSync(require.resolve('./spt-boss-route-contracts.cjs'))).digest('hex'):null,complete:results.length===selected.length,encounters:results.length,expectedEncounters:selected.length,winningRoutes:results.reduce((n,r)=>n+Number(r.routeA.won)+Number(r.routeB.won),0),results};fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');return result;};
  fs.mkdirSync(path.dirname(output),{recursive:true});
  for(const raw of selected){const boss=BossAbilityConfig.Instance.GetBossConfigByMapAndParam(raw.mapId,raw.param2),routes={};
    for(const route of['A','B']){
      const rule=features(boss,route),ranked=candidates(boss,route);let best=null;
      const relayEnemySpeed=rule.relay?init.BuildBossBattlePet(boss,GameConfig.GetPetById(boss.petId)).speed:0,relayPools=rule.relay?[1,5].map(type=>ranked.filter(spec=>GameConfig.GetSkillById(spec.key).Type===type&&PetCalculator.CalculateStat(spec.id,'speed',100,31,spec.training.speed,0)>relayEnemySpeed)):null;
      for(let attempt=0;attempt<24;attempt++){
        const start=attempt%Math.max(1,Math.min(12,ranked.length)),size=rule.swap||rule.sequence?Math.min(6,ranked.length):attempt<12?1:Math.min(6,ranked.length);
        const chosen=relayPools?(relayPools.every(rows=>rows.length)?relayPools.map(rows=>rows[attempt%rows.length]):[]):ranked.slice(start,start+size),specs=chosen.map(({score,...spec})=>spec);if(!specs.length)break;
        const result=await run(boss,specs,route,attempt);if(!best||result.bossHp<best.bossHp||result.won||result.naturalVictory&&!best.naturalVictory)best=result;if(result.won)break;
      }
      routes['route'+route]=best||{route,won:false,error:'No eligible legal party'};
    }
    results.push({map:raw.mapId,region:raw.param2,id:raw.petId,sptId:raw.sptBoss.sptId,name:raw.petName,...routes});save();console.log(JSON.stringify({boss:raw.petName,map:raw.mapId,region:raw.param2,A:routes.routeA.won,B:routes.routeB.won,Aturns:routes.routeA.turns,Bturns:routes.routeB.turns}));}
  const report=save();console.log(JSON.stringify({output,encounters:report.encounters,winningRoutes:report.winningRoutes}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(()=>{Math.random=originalRandom;});
