'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto'),os=require('node:os');
const app=path.resolve(process.argv[2]);process.chdir(app);const load=p=>require(path.join(app,'dist',p));
load('DataBase/loaders/DataLoader');
const {Logger}=load('shared/utils');for(const name of ['Info','Debug','Warn'])Logger[name]=()=>{};
const {Config}=load('shared/config/ServerConfig'),{ConfigLoader}=load('shared/config/ConfigLoader'),{ConfigRegistry}=load('shared/config/ConfigRegistry');
const {GetGameConfigRegistrations}=load('shared/config/ConfigDefinitions');
const {DatabaseManager}=load('DataBase/DatabaseManager'),{MigrationRunner}=load('DataBase/migrations/MigrationRunner');
const {AccountRepository}=load('DataBase/repositories/Player/AccountRepository');
const {PlayerInstance}=load('GameServer/Game/Player/PlayerInstance');
const {DatabaseHelper}=load('DataBase/DatabaseHelper'),{DataSaver}=load('DataBase/savers/DataSaver');
const {PetCalculator}=load('GameServer/Game/Pet/PetCalculator');
const {GameConfig,}=load('shared/config/game/GameConfig'),{SkillEffectsConfig}=load('shared/config/game/SkillEffectsConfig');
const {ElementSystem}=load('GameServer/Game/Battle/ElementSystem');
const {StarArena}=load('GameServer/Game/Battle/StarArena');
const {StarArenaHandler}=load('GameServer/Server/Packet/Recv/Battle/StarArenaHandlers');
const {ReconcilePetPP}=load('GameServer/Game/Pet/PetPP');
const {arenas}=load('GameServer/Game/Battle/StarArenaCatalog.json');
const db=DatabaseManager.Instance,players=[],results=[];
const testDatabasePath=path.join(os.tmpdir(),'seer-galaxy-arenas-'+crypto.randomBytes(12).toString('hex')+'.sqlite');
const playerTeam=[{petId:300,skills:[11000,20607,10994,20608],ev:[4,0,0,252,0,252]},{petId:216,skills:[10618,20269,10619,20268],ev:[4,252,0,0,0,252]},{petId:303,skills:[11007,20009,11004,20504],ev:[4,0,0,252,0,252]},{petId:306,skills:[11014,20506,11013,20505],ev:[4,252,0,0,0,252]},{petId:309,skills:[11023,20509,10033,20508],ev:[4,0,0,252,0,252]},{petId:70,skills:[10176,20364,10823,20363],ev:[4,252,0,0,0,252]}];
let nextCatch=1800000000;
async function player(label){
 const uid=await new AccountRepository().CreateAccount(label+'-'+Date.now()+'@arena.invalid',crypto.createHash('md5').update('ArenaSmoke1024!').digest('hex'));
 await new (load('DataBase/repositories/Player/PlayerRepository').PlayerRepository)().CreatePlayer(uid,label,0x3399cc);await new AccountRepository().UpdateRoleCreated(uid,true);
 const session={Socket:{destroyed:false,write:()=>true}},packets=[];const p=new PlayerInstance(session,uid,{});session.Player=p;
 p.SendPacket=async proto=>{packets.push({id:proto.getCmdId(),result:proto.getResult(),body:proto.serialize(p.ClientProtocol)});};
 await p.Initialize();p.Data.mapID=9508;p.Data.nick=label;p.Data.posX=480;p.Data.posY=405;players.push(p);return{p,packets};
}
async function team(p){for(const entry of playerTeam){const time=nextCatch++;assert.equal(await p.PetManager.GivePet(entry.petId,100,time),true);const pet=p.PetManager.PetData.GetPetByCatchTime(time),candidate=JSON.parse(JSON.stringify(pet));candidate.dvHp=candidate.dvAtk=candidate.dvDef=candidate.dvSpAtk=candidate.dvSpDef=candidate.dvSpeed=31;[candidate.evHp,candidate.evAtk,candidate.evDef,candidate.evSpAtk,candidate.evSpDef,candidate.evSpeed]=entry.ev;candidate.nature=0;candidate.skillArray=entry.skills;PetCalculator.UpdatePetStats(candidate);candidate.hp=candidate.maxHp;candidate.skillPP=ReconcilePetPP(candidate,true);await p.PetManager.PetData.CommitPetUpdate(pet,candidate);}}
async function request(p,operation,stage,arenaId){const body=Buffer.alloc(12);body.writeUInt32BE(operation);body.writeUInt32BE(arenaId,4);body.writeUInt32BE(stage,8);await new StarArenaHandler().Handle(p.Session,{},body);}
function expected(pet,foe,skill){if(skill.Category===4)return 0;const physical=skill.Category===1;const atk=physical?(pet.attack??pet.atk):pet.spAtk,def=physical?(foe.defence??foe.def):foe.spDef;return(skill.Power||0)*atk/Math.max(1,def)*ElementSystem.GetEffectiveness(skill.Type,foe.type||GameConfig.GetPetById(foe.petId).Type)*(skill.Accuracy||100)/100;}
function bestSkill(pet,foe){let best=0,score=-1;for(let i=0;i<pet.skills.length;i++){if(pet.skillPP[i]<=0)continue;const skill=GameConfig.GetSkillById(pet.skills[i]),value=expected(pet,foe,skill);if(value>score){best=skill.ID;score=value;}}return{best,score};}
async function challengeAll(p,packets,catalog){
 let totalActions=0,totalReplacements=0;
 for(let stage=0;stage<catalog.trainers.length;stage++){
  const firstFoe=StarArena.BuildOpponent(p.BattleManager,catalog.trainers[stage].team[0],0);
  const lead=p.PetManager.PetData.GetPetsInBag().map(pet=>({pet,score:bestSkill({...pet,skills:pet.skillArray,skillPP:pet.skillArray.map(id=>pet.skillPP[id])},firstFoe).score})).sort((a,b)=>b.score-a.score)[0];
  await p.PetManager.HandlePetDefault(lead.pet.catchTime);await request(p,1,stage,catalog.id);const manager=p.BattleManager;assert.ok(manager._currentBattle?.starArena,'Challenge should start');
  const ready=packets.findLast(packet=>packet.id===2503);assert.equal(ready.result,0);await manager.HandleReadyToFight();assert.equal(packets.at(-1).result,0);
  let count=0;
  while(manager._currentBattle&&count++<360){
   const b=manager._currentBattle,a=b.player,d=b.enemy,current=bestSkill(a,d);
   const choices=p.PetManager.PetData.GetPetsInBag().map(pet=>{const hp=manager._battlePetHPMap.get(pet.catchTime)??pet.hp;if(hp<=0)return null;const candidate={...pet,skills:pet.skillArray,skillPP:pet.skillArray.map(id=>manager._battlePetPPMap.get(pet.catchTime)?.get(id)??pet.skillPP[id]),type:GameConfig.GetPetById(pet.petId).Type};return{pet,score:bestSkill(candidate,d).score,hp};}).filter(Boolean).sort((x,y)=>y.score-x.score);
   const preferable=choices.find(choice=>choice.pet.catchTime!==a.catchTime&&choice.score>current.score*1.7);
   if(a.hp<=0||preferable){const next=a.hp<=0?choices[0]:preferable;assert.ok(next,'Legal player replacement remains');await manager.HandleChangePet(next.pet.catchTime);continue;}
   let selected=current.best;const heal=a.skills.find((id,index)=>a.skillPP[index]>0&&String(GameConfig.GetSkillById(id).SideEffect||'').split(' ').includes('43'));if(heal&&a.hp<a.maxHp*.45)selected=heal;assert.ok(selected,'Player has PP');
   const beforeIndex=b.starArena.index;await manager.HandleUseSkill(selected);if(manager._currentBattle?.starArena.index>beforeIndex)totalReplacements++;assert.equal(packets.at(-1).result,0,'Combat command rejected');
  }
  assert.ok(count<360,'Match must terminate');const progress=await StarArena.Progress(p.Uid,catalog.id);assert.equal(progress.next_stage,stage+1,catalog.name+' must win defender '+(stage+1));
  if(stage===7){assert.equal(progress.champion,0);await request(p,2,8,catalog.id);assert.equal(packets.at(-1).result,5001,'Eight wins do not grant a sixteen-player championship');}
  for(const pet of p.PetManager.PetData.GetPetsInBag()){assert.equal(pet.hp,pet.maxHp);assert.deepEqual(pet.skillPP,ReconcilePetPP(pet,true));}
  totalActions+=count;
 }
 return{arenaId:catalog.id,name:catalog.name,defenders:16,enemyPets:96,totalActions,totalReplacements};
}
async function useEarnedReward(p,id){
 const pet=p.PetManager.PetData.PetList.find(pet=>pet.petId===id);assert.ok(pet,'Only an actually awarded champion joins the team');
 const bench=p.PetManager.PetData.GetPetsInBag().find(pet=>pet.petId===70)||p.PetManager.PetData.GetPetsInBag().find(pet=>pet.petId===309);
 await p.PetManager.PetData.CommitPetUpdate(bench,{...bench,isInBag:false,isDefault:false});await p.PetManager.PetData.CommitPetUpdate(pet,{...pet,isInBag:true,isDefault:false});
}
(async()=>{
 ConfigLoader.Instance._configDir=path.join(app,'config');Config.Config.database={type:'sqlite',path:testDatabasePath};ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());await ConfigRegistry.Instance.Initialize();await SkillEffectsConfig.Instance.Load();await db.Initialize();
 const runner=new MigrationRunner();await runner.initMigrationTable();await db.Execute('INSERT INTO migrations(version,name) VALUES(28,?)',['defer_v28_for_legacy_fixture']);await runner.RunAll();await db.Execute('DELETE FROM migrations WHERE version=28');
 const legacy=await player('LegacyChampion');await db.Execute('INSERT INTO star_arena_progress(owner_id,next_stage,claimed,champion,run_id,reward_catch_time) VALUES(?,6,1,1,3,1700000123)',[legacy.p.Uid]);
 await db.Execute("CREATE TRIGGER reject_upgrade BEFORE INSERT ON migrations WHEN NEW.version=28 BEGIN SELECT RAISE(ABORT,'forced migration record failure'); END");await assert.rejects(()=>runner.RunAll());
 assert.equal((await db.Query('SELECT next_stage FROM star_arena_progress WHERE owner_id=?',[legacy.p.Uid]))[0].next_stage,6);assert.equal((await db.Query("SELECT name FROM sqlite_master WHERE name='star_arena_progress_v28'")).length,0,'Failed migration must roll back the shadow table');
 await db.Execute('DROP TRIGGER reject_upgrade');await runner.RunAll();const preserved=await StarArena.Progress(legacy.p.Uid,1);assert.deepEqual([preserved.next_stage,preserved.claimed,preserved.champion,preserved.run_id,preserved.reward_catch_time],[6,1,1,3,1700000123]);
 assert.equal((await StarArena.Progress(legacy.p.Uid,2)).next_stage,0);assert.equal((await StarArena.Progress(legacy.p.Uid,3)).claimed,0);
 const {p,packets}=await player('GalaxyArenaFlow');await team(p);
 for(const catalog of arenas){
  p.Data.mapID=catalog.mapId;await request(p,0,0,catalog.id);const reply=packets.at(-1).body;assert.equal(reply.readUInt32BE(8),catalog.id);assert.equal(reply.readUInt32BE(20),catalog.rewardPetId);
  await request(p,1,0,catalog.id===1?2:1);assert.equal(packets.at(-1).result,5001,'Map and arena mismatch rejected');
  await request(p,2,0,catalog.id);assert.equal(packets.at(-1).result,5001);await request(p,1,1,catalog.id);assert.equal(packets.at(-1).result,5001);
  await request(p,1,0,catalog.id);await p.BattleManager.HandleReadyToFight();await p.BattleManager.HandleUsePetItem(300001,p.BattleManager._currentBattle.player.catchTime);assert.equal(packets.at(-1).result,5001);await p.BattleManager.HandleCatchMonster(300001);assert.equal(packets.at(-1).result,5001);await p.BattleManager.EscapeFight();assert.equal((await StarArena.Progress(p.Uid,catalog.id)).next_stage,0);
  const otherBefore=await Promise.all(arenas.filter(a=>a.id!==catalog.id).map(a=>StarArena.Progress(p.Uid,a.id)));
  const random=Math.random;Math.random=()=>.5;try{results.push(await challengeAll(p,packets,catalog));}finally{Math.random=random;}
  const before=p.PetManager.PetData.PetList.length;await Promise.all([request(p,2,16,catalog.id),request(p,2,16,catalog.id)]);await request(p,2,16,catalog.id);
  const durable=JSON.parse((await db.Query('SELECT pet_list FROM player_pets WHERE owner_id=?',[p.Uid]))[0].pet_list),reward=durable.filter(pet=>pet.petId===catalog.rewardPetId);assert.equal(reward.length,1);assert.equal(reward[0].level,100);assert.equal(reward[0].isInBag,false);assert.equal(p.PetManager.PetData.PetList.length,before+1);
  assert.deepEqual(await Promise.all(arenas.filter(a=>a.id!==catalog.id).map(a=>StarArena.Progress(p.Uid,a.id))),otherBefore,'Other galaxies remain unchanged');
  await request(p,3,16,catalog.id);const replay=await StarArena.Progress(p.Uid,catalog.id);assert.equal(replay.next_stage,0);assert.equal(replay.claimed,1);assert.equal(replay.run_id,2);
  if(catalog.id<3)await useEarnedReward(p,catalog.rewardPetId);
 }
 const failure=await player('ArenaRollback');await team(failure.p);failure.p.Data.mapID=9510;await StarArena.Progress(failure.p.Uid,3);await db.Execute('UPDATE star_arena_progress SET next_stage=16,champion=1 WHERE owner_id=? AND arena_id=3',[failure.p.Uid]);await db.Execute(`CREATE TRIGGER reject_arena_claim BEFORE UPDATE ON star_arena_progress WHEN NEW.owner_id=${failure.p.Uid} AND NEW.claimed=1 BEGIN SELECT RAISE(ABORT,'forced championship storage failure'); END`);
 const originalCount=failure.p.PetManager.PetData.PetList.length;await request(failure.p,2,16,3);assert.equal(failure.packets.at(-1).result,5000);assert.equal(failure.p.PetManager.PetData.PetList.length,originalCount);assert.equal((await StarArena.Progress(failure.p.Uid,3)).claimed,0);assert.equal(JSON.parse((await db.Query('SELECT pet_list FROM player_pets WHERE owner_id=?',[failure.p.Uid]))[0].pet_list).length,originalCount);
 console.log(JSON.stringify({passed:true,arenas:results,totalDefenders:48,totalEnemyPets:288,migrationPreservesLegacy:true,migrationFailureRollsBack:true,independentProgressAndClaims:true,rewardIds:arenas.map(a=>a.rewardPetId),duplicateClaimsRejected:true,claimFailureRollsBack:true,database:'isolated test only'},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{for(const p of players){p.Data?.cleanup();await DataSaver.Instance.SaveUser(p.Uid);DatabaseHelper.Instance.RemoveCache(p.Uid);}await db.Shutdown();fs.rmSync(testDatabasePath,{force:true});process.exit(process.exitCode||0);});
