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
const {GameConfig}=load('shared/config/game/GameConfig'),{SkillEffectsConfig}=load('shared/config/game/SkillEffectsConfig');
const {ElementSystem}=load('GameServer/Game/Battle/ElementSystem');
const {StarArena}=load('GameServer/Game/Battle/StarArena');
const {StarArenaHandler}=load('GameServer/Server/Packet/Recv/Battle/StarArenaHandlers');
const {ReconcilePetPP}=load('GameServer/Game/Pet/PetPP');
const {ChampionPetRuntime:C}=load('GameServer/Game/Battle/ChampionPetRuntime');
const catalog=load('GameServer/Game/Battle/StarArenaCatalog.json');
const db=DatabaseManager.Instance,players=[],results=[];
const testDatabasePath=path.join(os.tmpdir(),"seer-star-arena-"+crypto.randomBytes(12).toString("hex")+".sqlite");
const playerTeam=[{"petId":300,"skills":[11000,20607,10994,20608],"nature":0,"ev":[4,0,0,252,0,252]},{"petId":216,"skills":[10618,20269,10619,20268],"nature":0,"ev":[4,252,0,0,0,252]},{"petId":303,"skills":[11007,20009,11004,20504],"nature":0,"ev":[4,0,0,252,0,252]},{"petId":306,"skills":[11014,20506,11013,20505],"nature":0,"ev":[4,252,0,0,0,252]},{"petId":309,"skills":[11023,20509,10033,20508],"nature":0,"ev":[4,0,0,252,0,252]},{"petId":70,"skills":[10176,20364,10823,20363],"nature":0,"ev":[4,252,0,0,0,252]}];
let nextCatch=1800000000;
async function player(label){
 const uid=await new AccountRepository().CreateAccount(label+'-'+Date.now()+'@arena.invalid',crypto.createHash('md5').update('ArenaSmoke1024!').digest('hex'));
 await new (load('DataBase/repositories/Player/PlayerRepository').PlayerRepository)().CreatePlayer(uid,label,0x3399cc);
 await new AccountRepository().UpdateRoleCreated(uid,true);
 const session={Socket:{destroyed:false,write:()=>true}},packets=[];
 const p=new PlayerInstance(session,uid,{});session.Player=p;
 p.SendPacket=async proto=>{packets.push({id:proto.getCmdId(),result:proto.getResult(),body:proto.serialize(p.ClientProtocol)});};
 await p.Initialize();p.Data.mapID=9508;p.Data.nick=label;p.Data.posX=475;p.Data.posY=395;
 players.push(p);return{p,packets};
}
async function team(p){
 for(const entry of playerTeam){
  const time=nextCatch++;assert.equal(await p.PetManager.GivePet(entry.petId,100,time),true);
  const pet=p.PetManager.PetData.GetPetByCatchTime(time),candidate=JSON.parse(JSON.stringify(pet));
  candidate.dvHp=candidate.dvAtk=candidate.dvDef=candidate.dvSpAtk=candidate.dvSpDef=candidate.dvSpeed=31;
  [candidate.evHp,candidate.evAtk,candidate.evDef,candidate.evSpAtk,candidate.evSpDef,candidate.evSpeed]=entry.ev;
  candidate.nature=0;candidate.skillArray=entry.skills;PetCalculator.UpdatePetStats(candidate);candidate.hp=candidate.maxHp;candidate.skillPP=ReconcilePetPP(candidate,true);
  await p.PetManager.PetData.CommitPetUpdate(pet,candidate);
 }
}
async function request(p,operation,stage){const body=Buffer.alloc(8);body.writeUInt32BE(operation);body.writeUInt32BE(stage,4);await new StarArenaHandler().Handle(p.Session,{},body);}
function expected(pet,foe,skill){if(skill.Category===4)return 0;const physical=skill.Category===1;const atk=physical?(pet.attack??pet.atk):pet.spAtk,def=physical?(foe.defence??foe.def):foe.spDef;return(skill.Power||0)*atk/Math.max(1,def)*ElementSystem.GetEffectiveness(skill.Type,foe.type||GameConfig.GetPetById(foe.petId).Type)*(skill.Accuracy||100)/100;}
function bestSkill(pet,foe){let best=0,score=-1;for(let i=0;i<pet.skills.length;i++){if(pet.skillPP[i]<=0)continue;const s=GameConfig.GetSkillById(pet.skills[i]),value=expected(pet,foe,s);if(value>score){best=s.ID;score=value;}}return{best,score};}
async function challengeAll(p,packets){
 let totalTurns=0,totalReplacements=0;
 assert.equal(catalog.trainers.length,16,'Requested tournament has sixteen defenders');
 for(let stage=0;stage<catalog.trainers.length;stage++){
  const firstFoe=StarArena.BuildOpponent(p.BattleManager,catalog.trainers[stage].team[0],0);
  const lead=p.PetManager.PetData.GetPetsInBag().map(pet=>({pet,score:bestSkill({...pet,skills:pet.skillArray,skillPP:pet.skillArray.map(id=>pet.skillPP[id])},firstFoe).score})).sort((a,b)=>b.score-a.score)[0];
  await p.PetManager.HandlePetDefault(lead.pet.catchTime);
  await request(p,1,stage);const manager=p.BattleManager;assert.ok(manager._currentBattle?.starArena,'Challenge should start');
  const ready=packets.findLast(packet=>packet.id===2503);assert.ok(ready&&ready.result===0,'Native ready packet must succeed');
  await manager.HandleReadyToFight();assert.equal(packets.at(-1).result,0,'Ready handshake must succeed');
  let count=0;
  while(manager._currentBattle&&count++<240){
   const b=manager._currentBattle,a=b.player,d=b.enemy;
   const current=bestSkill(a,d);
   const choices=p.PetManager.PetData.GetPetsInBag().map(pet=>{
    const hp=manager._battlePetHPMap.get(pet.catchTime)??pet.hp;if(hp<=0)return null;
    const candidate={...pet,skills:pet.skillArray,skillPP:pet.skillArray.map(id=>manager._battlePetPPMap.get(pet.catchTime)?.get(id)??pet.skillPP[id]),type:GameConfig.GetPetById(pet.petId).Type};
    return{pet,score:bestSkill(candidate,d).score,hp};
   }).filter(Boolean).sort((x,y)=>y.score-x.score);
   const preferable=choices.find(choice=>choice.pet.catchTime!==a.catchTime&&choice.score>current.score*1.7);
   if(a.hp<=0||preferable){const next=a.hp<=0?choices[0]:preferable;assert.ok(next,'Player still has a legal replacement');await manager.HandleChangePet(next.pet.catchTime);continue;}
   let selected=current.best;
   const heal=a.skills.find((id,index)=>a.skillPP[index]>0&&String(GameConfig.GetSkillById(id).SideEffect||'').split(' ').includes('43'));
   if(heal&&a.hp<a.maxHp*.45)selected=heal;
   assert.ok(selected,'Player has an available attack');
   const beforeIndex=b.starArena.index;await manager.HandleUseSkill(selected);
   if(manager._currentBattle?.starArena.index>beforeIndex)totalReplacements++;
   const last=packets.at(-1);assert.ok(last.result===0,'Combat rejected command '+last.id+': '+last.result);
  }
  assert.ok(count<240,'Arena match did not terminate');
  const progress=await StarArena.Progress(p.Uid);assert.equal(progress.next_stage,stage+1,'Player must actually win stage '+stage);
  if(stage===7){assert.equal(progress.champion,0,'Eight wins are only halfway');await request(p,2,8);assert.equal(packets.at(-1).result,5001,'Eight wins must not unlock champion reward');}
  for(const pet of p.PetManager.PetData.GetPetsInBag()){assert.equal(pet.hp,pet.maxHp);assert.deepEqual(pet.skillPP,ReconcilePetPP(pet,true));}
  totalTurns+=count;results.push({stage:stage+1,trainer:catalog.trainers[stage].name,actions:count});
 }
 return{totalTurns,totalReplacements};
}
(async()=>{
 ConfigLoader.Instance._configDir=path.join(app,'config');Config.Config.database={type:'sqlite',path:testDatabasePath};
 ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());await ConfigRegistry.Instance.Initialize();await SkillEffectsConfig.Instance.Load();await db.Initialize();await new MigrationRunner().RunAll();
 const {p,packets}=await player('ArenaFlow');await team(p);
 await request(p,2,0);assert.equal(packets.at(-1).result,5001,'No reward before championship');
 await request(p,1,1);assert.equal(packets.at(-1).result,5001,'No skipping defenders');
 await request(p,1,0);assert.ok(p.BattleManager._currentBattle?.starArena);await p.BattleManager.HandleReadyToFight();assert.equal(packets.at(-1).result,0);
 await p.BattleManager.HandleUsePetItem(300001,p.BattleManager._currentBattle.player.catchTime);assert.equal(packets.at(-1).result,5001,'No bag medicine in arena');
 await p.BattleManager.HandleCatchMonster(300001);assert.equal(packets.at(-1).result,5001,'No capture in arena');
 await p.BattleManager.EscapeFight();assert.equal((await StarArena.Progress(p.Uid)).next_stage,0,'Loss/escape retains progress');
 const random=Math.random;Math.random=()=>.5;let battles;try{battles=await challengeAll(p,packets);}finally{Math.random=random;}
 const before=p.PetManager.PetData.PetList.length;
 await Promise.all([request(p,2,catalog.trainers.length),request(p,2,catalog.trainers.length)]);
 const saved=await db.Query('SELECT pet_list FROM player_pets WHERE owner_id=?',[p.Uid]);
 const durable=JSON.parse(saved[0].pet_list);const rewards=durable.filter(pet=>pet.petId===3406);
 assert.equal(rewards.length,1);assert.equal(rewards[0].level,100);assert.equal(rewards[0].isInBag,false,'Full bag sends champion reward to storage');assert.equal(p.PetManager.PetData.PetList.length,before+1);
 assert.equal((await StarArena.Progress(p.Uid)).claimed,1);
 await request(p,2,catalog.trainers.length);assert.equal(p.PetManager.PetData.PetList.length,before+1,'Claim retries must not duplicate');
 await request(p,3,catalog.trainers.length);assert.equal((await StarArena.Progress(p.Uid)).next_stage,0);assert.equal((await StarArena.Progress(p.Uid)).run_id,2);
 assert.equal((await StarArena.Progress(p.Uid)).claimed,1,'Replay must retain one-time claim');
 const reloadRows=await db.Query('SELECT * FROM star_arena_progress WHERE owner_id=?',[p.Uid]);assert.deepEqual(reloadRows[0],await StarArena.Progress(p.Uid));
 const failure=await player('ArenaRollback');await team(failure.p);await StarArena.Progress(failure.p.Uid);
 await db.Execute('UPDATE star_arena_progress SET next_stage=?,champion=1 WHERE owner_id=?',[catalog.trainers.length,failure.p.Uid]);
 await db.Execute(`CREATE TRIGGER reject_arena_claim BEFORE UPDATE ON star_arena_progress WHEN NEW.owner_id=${failure.p.Uid} AND NEW.claimed=1 BEGIN SELECT RAISE(ABORT,'forced championship storage failure'); END`);
 const originalCount=failure.p.PetManager.PetData.PetList.length;await request(failure.p,2,catalog.trainers.length);assert.equal(failure.packets.at(-1).result,5000);assert.equal(failure.p.PetManager.PetData.PetList.length,originalCount);assert.equal((await StarArena.Progress(failure.p.Uid)).claimed,0);assert.equal(JSON.parse((await db.Query('SELECT pet_list FROM player_pets WHERE owner_id=?',[failure.p.Uid]))[0].pet_list).length,originalCount);
 console.log(JSON.stringify({passed:true,...battles,stages:results,reward:{petId:3406,level:100,durableCount:rewards.length,fullBagToStorage:true,concurrentClaimSafe:true,retrySafe:true,rollbackSafe:true},skippingRejected:true,bagItemsRejected:true,captureRejected:true,escapeRetainsProgress:true,replayRetainsClaim:true,database:'isolated test only'},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{for(const p of players){p.Data?.cleanup();await DataSaver.Instance.SaveUser(p.Uid);DatabaseHelper.Instance.RemoveCache(p.Uid);}await db.Shutdown();fs.rmSync(testDatabasePath,{force:true});process.exit(process.exitCode||0);});
