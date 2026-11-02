'use strict';
// Mechanism boundaries use real configured skills and the release executor.
// Action fixtures are not legal-party balance or production-player evidence.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const app=path.resolve(process.argv[2]),destination=process.argv[3]&&path.resolve(process.argv[3]);process.chdir(app);
const load=file=>require(path.join(app,'dist',file));
const {Logger,LogLevel}=load('shared/utils/Logger');Logger.SetMinLevel(LogLevel.Error);
const {ConfigLoader}=load('shared/config/ConfigLoader');
const {ConfigRegistry}=load('shared/config/ConfigRegistry');
const {GetGameConfigRegistrations}=load('shared/config/ConfigDefinitions');
const {GameConfig}=load('shared/config/game/GameConfig');
const {BossAbilityConfig}=load('GameServer/Game/Battle/BossAbility/BossAbilityConfig');
const {BattleInitService}=load('GameServer/Game/Battle/services/BattleInitService');
const {BattleTurnService}=load('GameServer/Game/Battle/services/BattleTurnService');
const {BattleTurnExecutor}=load('GameServer/Game/Battle/BattleTurnExecutor');
const {BattleEffectIntegration}=load('GameServer/Game/Battle/BattleEffectIntegration');
const {BossSpecialRules}=load('GameServer/Game/Battle/BossSpecialRules');
const {SkillEffectRuntime}=load('GameServer/Game/Battle/SkillEffectRuntime');
const rules=load('GameServer/Game/Battle/UniverseBossRules'),spt=load('GameServer/Game/Battle/SPTBossRules'),budget=load('GameServer/Game/Battle/UniverseBossBudget');
const init=new BattleInitService({Uid:7}),service=new BattleTurnService(),skills=new Map(),checks=[];
const config=JSON.parse(fs.readFileSync(path.join(app,'config/data/json/boss_abilities.json')));
const cases=config.bossConfigs.filter(b=>b.sptBoss);
function fresh(id,entry){
  const row=entry||cases.find(b=>b.sptBoss.sptId===id&&b.mapId!==514&&b.mapId!==677);assert.ok(row,'Missing '+id);
  const player=init.BuildBattlePet(303,'动作夹具',100,500,500,250,200,250,200,300,3,[10004,10030,10034,20159],1800000007,0);
  const enemy=init.BuildBossBattlePet(row,GameConfig.GetPetById(row.petId));
  const battle={userId:7,player,enemy,turn:0,roundCount:0,isOver:false,battleType:'BOSS',bossMapId:row.mapId,bossParam2:row.param2};
  if(row.universeBossKey)battle.universeBoss={key:row.universeBossKey,mapId:row.mapId,region:row.param2,petId:row.petId,tier:row.universeTier,spt:row.spt};
  load('GameServer/Game/Battle/PuniSealBattle').InitPuniSeal(battle);load('GameServer/Game/Battle/AlderSealBattle').InitAlder(battle);
  BattleEffectIntegration.OnBattleStart(battle);return battle;
}
function start(b,t=1){b.turn=t;b.roundCount=t-1;budget.beginTurn(b);rules.beginTurn(b);}
function move(type=8,category=1,predicate=()=>true){
  for(const raw of GameConfig.GetAllSkills()){if(raw.Type===type&&raw.Category===category&&raw.Power>0&&predicate(raw)){service.LoadSkillConfig(raw.ID,skills);return skills.get(raw.ID);}}
  throw Error('No configured attack '+type+'/'+category);
}
function begin(b,actor,skill){budget.beginAction(b,actor,skill);const context={acted:true,hit:true,isFirst:actor===b.player,playerRef:b.player,bossRef:b.enemy,playerBeforeLevels:[...b.player.battleLevels],bossBeforeLevels:[...b.enemy.battleLevels],playerHpBefore:b.player.hp,bossHpBefore:b.enemy.hp,statClears:[],statDecreases:[]};b.universeBudgetState.actionContext=context;rules.onAction(b,actor,skill);return context;}
function hit(b,skill,damage=100){
  const ctx=begin(b,b.player,skill);rules.beforeDirectDamage(b,b.player,b.enemy,skill);
  const actual=rules.modifyDirectDamage(b,b.player,b.enemy,skill,damage,damage);
  b.enemy.hp-=actual;rules.onDirectDamageSegment(b,b.player,b.enemy,skill,{index:0,count:1,actualDamage:actual});rules.afterDirectDamage(b,b.player,b.enemy,skill,actual);
  const result={skillId:skill.id,damage:actual,missed:false};rules.afterAction(b,b.player,b.enemy,skill,result,ctx);budget.settleReflections(b);b.universeBudgetState.actionContext=null;return actual;
}
function defense(b,skill,amount=100){return rules.modifyDirectDamage(b,b.player,b.enemy,skill,amount,amount);}
function action(b,id,actor=b.player,canAct={canAct:true},first=true){service.LoadSkillConfig(id,skills);return BattleTurnExecutor.ExecuteAttack(b,actor,actor===b.player?b.enemy:b.player,skills.get(id),actor===b.player?7:0,canAct,first);}
function check(name,fn){const random=Math.random;Math.random=()=>0.1;try{fn();}finally{Math.random=random;}checks.push(name);}
(async()=>{
  ConfigLoader.Instance._configDir=path.join(app,'config');ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());await ConfigRegistry.Instance.Initialize();
  await load('shared/config/game/SkillEffectsConfig').SkillEffectsConfig.Instance.Load();BossAbilityConfig.Instance.Load();load('GameServer/Game/Battle/effects');
  check('151-encounters-and-native-exemptions',()=>{
    assert.equal(cases.length,151);assert.equal(new Set(cases.map(b=>b.sptBoss.sptId).filter(Boolean)).size,135);
    for(const row of cases){assert.equal(row.teamChallenge,undefined);const b=fresh(null,row);assert.equal(b.enemy.sptTeamProfile,undefined);assert.equal(budget.enabled(b),!row.sptBoss.native);budget.unbind(b);}
  });
  check('ordinary-burst-and-final-hp-have-no-quota',()=>{const b=fresh(3);start(b);budget.beginAction(b,b.player,move());assert.equal(budget.damage(b,b.player,b.enemy,'direct',2100),2100);b.enemy.hp=1;assert.equal(budget.damage(b,b.player,b.enemy,'direct',100),1);budget.unbind(b);});
  check('universe-burst-uncapped-but-fraction-and-dot-budgets-retained',()=>{const b=fresh(82);start(b);budget.beginAction(b,b.player,move());assert.equal(budget.damage(b,b.player,b.enemy,'direct',5000),5000);assert.equal(budget.damage(b,b.player,b.enemy,'fraction',5000),480);assert.equal(budget.damage(b,b.player,b.enemy,'fraction',5000),0);assert.equal(budget.damage(b,b.player,b.enemy,'dot',5000),240);budget.unbind(b);});
  check('non-boss-and-pvp-unchanged',()=>{const b=fresh(3);delete b.enemy.sptBossProfile;assert.equal(budget.enabled(b),false);assert.equal(budget.damage(b,b.player,b.enemy,'direct',9999),9999);const p=fresh(3);p.isPvp=true;assert.equal(budget.enabled(p),false);});
  check('contact-poison-disabled-by-fire-and-special-bypasses',()=>{const b=fresh(1);start(b);hit(b,move(3));assert.equal(spt.state(b).contactOffThrough,2);const c=fresh(1);start(c);const r=action(c,10034);assert.equal(r.missed,false);assert.equal(c.player.statusDurations[1]||0,0);});
  check('all-layered-armor-break-routes',()=>{
    const rows=[[4,3,8],[8,7,8],[37,2,8],[39,2,8],[44,11,8],[57,2,8],[58,15,8],[59,11,8],[62,1,8],[67,3,8],[70,1,8],[78,15,8],[81,3,8]];
    for(const [id,type,other]of rows){const b=fresh(id);start(b);const before=spt.state(b).layers;hit(b,move(type));assert.ok(spt.state(b).layers<before,'Counter must remove armor '+id);const c=fresh(id);start(c);const pre=defense(c,move(other));assert.ok(pre>0&&pre<=100,'Other route remains soft '+id);}
  });
  check('multi-hit-each-segment-uses-previous-layer-count',()=>{const b=fresh(39);start(b);const skill=move(2),ctx=begin(b,b.player,skill),values=[];for(let i=0;i<3;i++){const d=defense(b,skill);values.push(d);rules.onDirectDamageSegment(b,b.player,b.enemy,skill,{index:i,count:3,actualDamage:d});}assert.deepEqual(values,[40,60,80]);assert.equal(spt.state(b).layers,0);});
  check('natural-immunity-and-miss-do-not-break-armor',()=>{const b=fresh(4);start(b);const skill=move(3);assert.equal(rules.modifyDirectDamage(b,b.player,b.enemy,skill,0,0),0);rules.afterDirectDamage(b,b.player,b.enemy,skill,0);assert.equal(spt.state(b).layers,2);const c=fresh(4);start(c);service.LoadSkillConfig(10030,skills);const old=Math.random;Math.random=()=>0.999999;try{action(c,10030,c.player,{canAct:false,reason:'sleep'});}finally{Math.random=old;}assert.equal(spt.state(c).layers,2);});
  check('flying-dodge-bounded-and-landing-open',()=>{const b=fresh(5);start(b);const old=Math.random;Math.random=()=>0;try{assert.equal(spt.checkHit(b,move(5)),false);assert.equal(spt.checkHit(b,move(5)),undefined);}finally{Math.random=old;}start(b,3);assert.equal(spt.checkHit(b,move(5)),undefined);assert.equal(defense(b,move(5)),120);});
  check('defense-drop-not-dispel-opens-rock-armor',()=>{const b=fresh(7);start(b);const skill=move(2),ctx=begin(b,b.player,skill);b.enemy.battleLevels[1]=1;ctx.bossBeforeLevels[1]=1;SkillEffectRuntime.ClearStage(b.player,b.enemy,1);assert.equal(defense(b,skill),40);ctx.bossBeforeLevels[1]=0;ctx.statClears=[];b.enemy.battleLevels[1]=-1;assert.equal(defense(b,skill),100);});
  check('ordinary-status-gates-removed-and-double-life-bounded',()=>{for(const id of[3,24,26,56]){const b=fresh(id);b.enemy.hp=0;BossSpecialRules.SettleBossHp(b,'dot');assert.equal(b.enemy.hp,b.enemy.maxHp);b.enemy.hp=0;BossSpecialRules.SettleBossHp(b,'dot');assert.equal(b.enemy.hp,0,'No third life '+id);}const b=fresh(9);b.enemy.hp=0;BossSpecialRules.SettleBossHp(b,'dot');assert.equal(b.enemy.hp,0);});
  check('ordinary-only-explicit-status-immunity-and-control-protection',()=>{const b=fresh(4);start(b);assert.equal(BossSpecialRules.IsStatusImmune(b.enemy,5),true);assert.equal(BossSpecialRules.IsStatusImmune(b.enemy,2),false);budget.lostAction(b,b.enemy,'sleep');assert.equal(budget.controlResistant(b),true);start(b,2);assert.equal(budget.controlResistant(b),true);start(b,3);assert.equal(budget.controlResistant(b),false);});
  check('repeat-skill-and-alternating-category-mechanics',()=>{const b=fresh(31);start(b);const p=move();assert.equal(hit(b,p),100);assert.equal(hit(b,p),50);assert.equal(hit(b,move(2,2)),100);const c=fresh(42);start(c);assert.equal(hit(c,p),100);assert.equal(hit(c,p),50);assert.equal(hit(c,move(2,2)),100);});
  check('finite-regeneration-budget-and-fire-suppression',()=>{const b=fresh(20);start(b);b.enemy.hp=1000;for(let t=3;t<=30;t+=3){start(b,t);rules.endTurn(b);}assert.equal(spt.state(b).heals,3);assert.equal(spt.state(b).healed,Math.floor(b.enemy.maxHp*.08)*3);const c=fresh(20);start(c,3);c.enemy.hp=1000;hit(c,move(3));rules.endTurn(c);assert.equal(spt.state(c).heals,0);});
  check('direct-executor-consumes-pp-and-returns-real-hp',()=>{const b=fresh(3);start(b);const before=b.player.hp,id=b.enemy.skills[0],pp=b.enemy.skillPP[0];const r=action(b,id,b.enemy);assert.equal(b.enemy.skillPP[0],pp-1);assert.equal(b.player.hp,before-r.damage);assert.equal(r.defenderRemainHp,b.player.hp);});
  check('universe-battery-fast-only-interrupt',()=>{const b=fresh(82);start(b);b.universeBossState.batteryTurn=1;hit(b,move());assert.equal(b.universeBossState.batteryInterrupted,1);const c=fresh(82);start(c);c.universeBossState.batteryTurn=1;c.universeBossState.batteryActed=true;hit(c,move());assert.notEqual(c.universeBossState.batteryInterrupted,1);});
  check('universe-magazine-soft-segments',()=>{const b=fresh(86);start(b);const skill=move(3);begin(b,b.player,skill);const result=[];for(let i=0;i<3;i++){const d=defense(b,skill);result.push(d);rules.onDirectDamageSegment(b,b.player,b.enemy,skill,{actualDamage:d});}assert.deepEqual(result,[40,60,80]);});
  check('universe-no-overload-or-second-phase-rearm',()=>{const b=fresh(87);start(b);hit(b,move());start(b,2);assert.equal(defense(b,move()),40);const c=fresh(117);start(c);c.enemy.hp=2000;rules.beginTurn(c);assert.equal(defense(c,move()),100);hit(c,move());start(c,2);assert.equal(defense(c,move()),100);});
  check('frost-rechecks-current-target-not-turn-start',()=>{const b=fresh(105);start(b,2);b.player.statusDurations[5]=0;assert.equal(rules.modifyDirectDamage(b,b.player,b.enemy,move(),100,100),120);const ctx=begin(b,b.enemy,move(9));ctx.hit=true;const hp=b.player.hp;rules.afterAction(b,b.enemy,b.player,{...move(9),id:13156},null,ctx);assert.equal(b.player.hp,hp);});
  check('blade-uses-last-two-complete-hit-turns',()=>{const b=fresh(119);start(b,2);hit(b,move());start(b,3);hit(b,move(2));rules.endTurn(b);assert.equal(b.universeBossState.bladeBroken,true);const c=fresh(119);start(c,1);hit(c,move());start(c,3);hit(c,move(2));rules.endTurn(c);assert.equal(c.universeBossState.bladeBroken,false);});
  check('contract-crossing-both-thresholds-declares-once',()=>{const b=fresh(115);start(b,1);b.enemy.hp=1000;rules.endTurn(b);assert.equal(b.universeBossState.contractTurn,2);assert.equal(b.universeBossState.contract30,true);assert.equal(b.universeBossState.contract60,true);assert.equal(defense(b,move()),50);hit(b,move());hit(b,move(2));assert.equal(b.universeBossState.contractActive,false);start(b,2);rules.endTurn(b);assert.notEqual(b.universeBossState.contractTurn,3);});
  check('mirror-reveal-repeats-every-third-turn',()=>{const b=fresh(122);start(b,6);assert.equal(defense(b,move()),120);start(b,9);assert.equal(defense(b,move()),120);});
  check('quicksand-clears-one-layer-not-entire-stack',()=>{const b=fresh(104);start(b);b.universeBossState.quicksandLayers=2;hit(b,move(2));assert.equal(b.universeBossState.quicksandLayers,1);});
  check('root-crown-removes-once-per-action',()=>{const b=fresh(127);start(b);const skill=move(2);begin(b,b.player,skill);for(let i=0;i<3;i++)rules.onDirectDamageSegment(b,b.player,b.enemy,skill,{actualDamage:10});assert.equal(b.universeBossState.rootCrowns,1);});
  check('temporary-stat-caps-never-lower-existing-higher-stages',()=>{const b=fresh(15);start(b);b.enemy.battleLevels[0]=5;hit(b,move());hit(b,move());assert.equal(b.enemy.battleLevels[0],5);});
  check('charge-bonuses-only-affect-the-declared-element',()=>{for(const [id,type,bonus]of[[50,3,130],[75,9,125]]){const b=fresh(id);start(b,4);spt.state(b).chargedTurn=4;assert.equal(rules.modifyDirectDamage(b,b.enemy,b.player,move(type),100,100),bonus);assert.equal(rules.modifyDirectDamage(b,b.enemy,b.player,move(8),100,100),100);}});
  check('ordinary-heals-do-not-inherit-universe-active-cooldown',()=>{const b=fresh(20);start(b);b.enemy.hp=1000;assert.equal(budget.heal(b,b.enemy,100,{active:true}),100);start(b,2);assert.equal(budget.heal(b,b.enemy,100,{active:true}),100);});
  check('negative-defense-keeps-nador-armor-off-after-window',()=>{const b=fresh(7);start(b);b.enemy.battleLevels[1]=-1;start(b,10);assert.equal(defense(b,move()),100);});
  check('clearing-temporary-negative-stage-does-not-create-positive-buff',()=>{const b=fresh(25);start(b,4);spt.state(b).chargedTurn=4;const skill=move(3),ctx=begin(b,b.enemy,skill);rules.afterAction(b,b.enemy,b.player,skill,{skillId:skill.id},ctx);assert.equal(b.enemy.battleLevels[1],-1);SkillEffectRuntime.ClearStage(b.player,b.enemy,1);start(b,6);assert.equal(b.enemy.battleLevels[1],0);});
  check('gaia-removes-only-its-own-unspent-opening-defense',()=>{const b=fresh(14);b.enemy.sptBossWeekday=3;b.enemy.battleLevels[1]=1;start(b);begin(b,b.player,move());SkillEffectRuntime.ClearStage(b.player,b.enemy,1);b.enemy.battleLevels[1]=2;start(b,4);assert.equal(b.enemy.battleLevels[1],2);});
  check('temporary-speed-at-negative-cap-never-rebounds-upward',()=>{const b=fresh(72);start(b);spt.state(b).chargedTurn=4;b.enemy.battleLevels[4]=-6;start(b,4);rules.endTurn(b);assert.equal(b.enemy.battleLevels[4],-6);});
  const report={checks:checks.length,names:checks,actionFixtures:true,legalPartyCalibration:false};if(destination)fs.writeFileSync(destination,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
