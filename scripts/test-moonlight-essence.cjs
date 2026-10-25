'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const app=path.resolve(process.argv[2]);process.chdir(app);const load=file=>require(path.join(app,'dist',file));
load('DataBase/loaders/DataLoader');
const {Logger}=load('shared/utils');for(const key of ['Info','Debug','Warn'])Logger[key]=()=>{};
const {Config}=load('shared/config/ServerConfig'),{ConfigLoader}=load('shared/config/ConfigLoader'),{ConfigRegistry}=load('shared/config/ConfigRegistry');
const {GetGameConfigRegistrations}=load('shared/config/ConfigDefinitions');
const {DatabaseManager}=load('DataBase/DatabaseManager'),{MigrationRunner}=load('DataBase/migrations/MigrationRunner');
const {AccountRepository}=load('DataBase/repositories/Player/AccountRepository'),{PlayerRepository}=load('DataBase/repositories/Player/PlayerRepository');
const {PlayerInstance}=load('GameServer/Game/Player/PlayerInstance'),{DatabaseHelper}=load('DataBase/DatabaseHelper');
const {ReconcileMoonlightEssence:reconcile,MOONLIGHT_ESSENCE_REWARD_KEY:key}=load('GameServer/Game/Task/MoonlightEssenceReward');
const {EssenceHatching,EssenceIncubatorBusy}=load('GameServer/Game/Pet/EssenceHatching');
const db=DatabaseManager.Instance,players=[],passed=[];
const database=path.join(os.tmpdir(),'seer-moonlight-'+crypto.randomBytes(10).toString('hex')+'.sqlite');
async function instance(uid){
 const session={Socket:{destroyed:false,write:()=>true}},p=new PlayerInstance(session,uid,{});session.Player=p;p.packets=[];
 p.SendPacket=async packet=>p.packets.push({command:packet.getCmdId(),result:packet.getResult(),body:packet.serialize(p.ClientProtocol)});
 await p.Initialize();p.Data.hasNono=true;players.push(p);return p;
}
async function account(name){const uid=await new AccountRepository().CreateAccount(name+'-'+crypto.randomBytes(5).toString('hex')+'@fixture.invalid','private-fixture-hash');await new PlayerRepository().CreatePlayer(uid,name,0x3399cc);await new AccountRepository().UpdateRoleCreated(uid,true);return instance(uid);}
async function quest(p,status){p.TaskManager.TaskData.TaskList.set(91,{taskId:91,status,acceptTime:1700000000,completeTime:status===3?1700000001:0});p.TaskManager.TaskData.TaskBuffers.set(91,{xinBytes:Array.from({length:20},(_,index)=>index<3||index===3&&status===3?1:0)});await p.TaskManager.TaskData.save();}
async function snapshot(p){const [stock]=await db.Query('SELECT item_list FROM player_items WHERE owner_id=?',[p.Uid]);const [task]=await db.Query('SELECT task_list FROM player_tasks WHERE owner_id=?',[p.Uid]);const [balance]=await db.Query('SELECT coins,allocatable_exp FROM players WHERE user_id=?',[p.Uid]);return {items:JSON.parse(stock.item_list),task:JSON.parse(task.task_list)['91'],balance,receipts:await db.Query('SELECT amount FROM receiver_claims WHERE owner_id=? AND reward_key=?',[p.Uid,key])};}
const count=(items,id=400124)=>items.find(item=>item.itemId===id)?.count||0;
async function test(name,run){await run();passed.push(name);}
(async()=>{
 ConfigLoader.Instance._configDir=path.join(app,'config');Config.Config.database={type:'sqlite',path:database};ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());await ConfigRegistry.Instance.Initialize();await db.Initialize();await new MigrationRunner().RunAll();
 await test('Normal final hand-in grants one hatchable essence with its original currencies; replay and relog never grant twice',async()=>{
  const p=await account('NewMeteor');await quest(p,1);const before=await snapshot(p);await p.TaskManager.CompleteTask(91,1);assert.equal(p.packets.at(-1).result,0);
  const after=await snapshot(p);assert.equal(count(after.items),1);assert.equal(after.task.status,3);assert.equal(after.balance.coins-before.balance.coins,2000);assert.equal(after.balance.allocatable_exp-before.balance.allocatable_exp,2000);assert.equal(after.receipts.length,1);
  await p.TaskManager.CompleteTask(91,1);assert.equal(p.packets.at(-1).result,5003);assert.equal(await reconcile(p),false);await p.TaskManager.Initialize();assert.deepEqual(await snapshot(p),after);
 });
 await test('Completed legacy quests recover only the omitted essence, exactly once under concurrent calls, without rewriting quest times or currencies',async()=>{
  const p=await account('OldMeteor');await quest(p,3);const before=await snapshot(p);const results=await Promise.all(Array.from({length:8},()=>reconcile(p)));assert.equal(results.filter(Boolean).length,1);
  const after=await snapshot(p);assert.equal(count(after.items),1);assert.equal(after.receipts.length,1);assert.deepEqual(after.balance,before.balance);assert.deepEqual(after.task,before.task);assert.equal(count(p.ItemManager.ItemData.ItemList),1);
  await p.TaskManager.Initialize();assert.deepEqual(await snapshot(p),after);
 });
 await test('Unaccepted and unfinished quests cannot claim another account\'s owed essence',async()=>{
  const p=await account('NoMeteor');assert.equal(await reconcile(p),false);await quest(p,1);assert.equal(await reconcile(p),false);assert.equal(count((await snapshot(p)).items),0);assert.equal((await snapshot(p)).receipts.length,0);
 });
 await test('Failed receipt persistence rolls back inventory and leaves the same entitlement available for a real retry',async()=>{
  const p=await account('FailedMeteor');await quest(p,3);const before=await snapshot(p);await db.Execute(`CREATE TRIGGER reject_meteor_receipt BEFORE INSERT ON receiver_claims WHEN NEW.owner_id=${p.Uid} BEGIN SELECT RAISE(ABORT,'meteor receipt fixture'); END`);
  try{await assert.rejects(reconcile(p),/meteor receipt fixture/);assert.deepEqual(await snapshot(p),before);assert.equal(count(p.ItemManager.ItemData.ItemList),0);}finally{await db.Execute('DROP TRIGGER reject_meteor_receipt');}
  assert.equal(await reconcile(p),true);assert.equal(count((await snapshot(p)).items),1);
 });
 await test('An existing full essence stack does not erase the owed reward; consuming that essence makes room without rerolling or replaying currency',async()=>{
  const p=await account('FullMeteor');await quest(p,3);await p.ItemManager.GiveItem(400124,1);const before=await snapshot(p);assert.equal(await reconcile(p),false);assert.deepEqual(await snapshot(p),before);
  assert.equal(await new EssenceHatching(p).Start(400124),1800);assert.equal(await reconcile(p),true);const after=await snapshot(p);assert.equal(count(after.items),1);assert.equal(after.receipts.length,1);assert.deepEqual(after.balance,before.balance);
 });
 await test('The recovered meteor essence enters the actual hatch queue, waits, hatches into level-one Aige and cannot be claimed twice',async()=>{
  const p=await account('HatchMeteor');await quest(p,3);await reconcile(p);const hatch=new EssenceHatching(p);assert.equal(await hatch.Start(400124),1800);assert.equal(count((await snapshot(p)).items),0);
  const [job]=await db.Query('SELECT item_id,pet_id,pet_level,ready_at FROM player_essence_hatches WHERE owner_id=?',[p.Uid]);assert.equal(job.item_id,400124);assert.equal(job.pet_id,246);assert.equal(job.pet_level,1);
  const waiting=await hatch.Get();assert.equal(waiting.active,true);assert.ok(waiting.remaining>0);assert.equal(waiting.catchTime,0);await assert.rejects(hatch.Start(400124),EssenceIncubatorBusy);
  const other=await account('OtherHatch');assert.deepEqual(await new EssenceHatching(other).Get(),{active:false,remaining:0,petId:0,catchTime:0});
  await db.Execute('UPDATE player_essence_hatches SET ready_at=? WHERE owner_id=?',[Math.floor(Date.now()/1000)-1,p.Uid]);
  const result=await hatch.Get();assert.equal(result.petId,246);assert.equal(result.remaining,0);assert.ok(result.catchTime>0);const pet=p.PetManager.PetData.GetPetByCatchTime(result.catchTime);assert.equal(pet.level,1);assert.equal(pet.isInBag,false);
  const [saved]=await db.Query('SELECT pet_list FROM player_pets WHERE owner_id=?',[p.Uid]);assert.equal(JSON.parse(saved.pet_list).filter(pet=>pet.petId===246).length,1);assert.equal((await hatch.Get()).active,false);assert.equal(await reconcile(p),false);
 });
 await test('A normal reward receipt failure rolls back task completion, currencies and the essence together',async()=>{
  const p=await account('FailedNewMeteor');await quest(p,1);const before=await snapshot(p);await db.Execute(`CREATE TRIGGER reject_new_meteor BEFORE INSERT ON receiver_claims WHEN NEW.owner_id=${p.Uid} BEGIN SELECT RAISE(ABORT,'new meteor receipt fixture'); END`);
  try{await p.TaskManager.CompleteTask(91,1);assert.equal(p.packets.at(-1).result,5000);assert.deepEqual(await snapshot(p),before);assert.equal(p.TaskManager.TaskData.IsTaskCompleted(91),false);assert.equal(count(p.ItemManager.ItemData.ItemList),0);}finally{await db.Execute('DROP TRIGGER reject_new_meteor');}
 });
 console.log('MOONLIGHT_ESSENCE_SMOKE='+JSON.stringify({passed:passed.length,scenarios:passed,productionWrites:false,hatchDurationSeconds:1800}));
})().catch(error=>{console.error(error.stack);process.exitCode=1;}).finally(async()=>{for(const p of players){p.Data.cleanup();DatabaseHelper.Instance.RemoveCache(p.Uid);}await db.Shutdown();for(const suffix of ['', '-wal','-shm'])fs.rmSync(database+suffix,{force:true});process.exit(process.exitCode||0);});
