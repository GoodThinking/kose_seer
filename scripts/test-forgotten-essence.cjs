'use strict';
// Real 2201/2202 handlers and player managers with disposable SQLite only.
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
if(!process.argv[2])throw new Error('Usage: node test-forgotten-essence.cjs <candidate-app>');
const app=path.resolve(process.argv[2]);process.chdir(app);const load=file=>require(path.join(app,'dist',file));
load('DataBase/loaders/DataLoader');
const {Config}=load('shared/config/ServerConfig'),{ConfigLoader}=load('shared/config/ConfigLoader'),{ConfigRegistry}=load('shared/config/ConfigRegistry');
const {GetGameConfigRegistrations}=load('shared/config/ConfigDefinitions'),{SkillEffectsConfig}=load('shared/config/game/SkillEffectsConfig');
const {DatabaseManager}=load('DataBase/DatabaseManager'),{DatabaseHelper}=load('DataBase/DatabaseHelper'),{DataCache}=load('DataBase/cache/DataCache');
const {MigrationRunner}=load('DataBase/migrations/MigrationRunner'),{AccountRepository}=load('DataBase/repositories/Player/AccountRepository');
const {PlayerRepository}=load('DataBase/repositories/Player/PlayerRepository'),{PlayerInstance}=load('GameServer/Game/Player/PlayerInstance');
const {AcceptTaskHandler}=load('GameServer/Server/Packet/Recv/Task/AcceptTaskHandler'),{CompleteTaskHandler}=load('GameServer/Server/Packet/Recv/Task/CompleteTaskHandler');
const {TaskStatus}=load('DataBase/models/TaskData'),{GameConfig}=load('shared/config/game/GameConfig');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'forgotten-essence-')),db=DatabaseManager.Instance,helper=DatabaseHelper.Instance;
const players=[],uids=[],cacheTypes=['player','item','pet','task','friend','mail'];let originalConnection;
function clearTimers(p){for(const data of [p.Data,p.ItemManager?.ItemData,p.PetManager?.PetData,p.TaskManager?.TaskData,p.FriendManager?.FriendData,p.MailManager?.MailData])clearTimeout(data?._saveTimer);}
function clearCache(id){for(const type of cacheTypes)clearTimeout(DataCache.Instance.Get(type,id)?._saveTimer);helper.RemoveCache(id);}
async function login(id){const session={Socket:{destroyed:false,write:()=>true}},p=new PlayerInstance(session,id,{});players.push(p);session.Player=p;
  p.packets=[];p.SendPacket=async packet=>p.packets.push({cmd:packet.getCmdId(),result:packet.getResult(),body:packet.serialize(p.ClientProtocol)});await p.Initialize();p.Data.mapID=339;return p;}
async function create(){const repo=new AccountRepository(),id=await repo.CreateAccount('forgotten-'+crypto.randomBytes(8).toString('hex')+'@example.invalid',crypto.createHash('md5').update('FixtureOnly').digest('hex'));uids.push(id);
  await new PlayerRepository().CreatePlayer(id,'ForgottenEssence',0x3399cc);await repo.UpdateRoleCreated(id,true);return login(id);}
const accepted=Buffer.alloc(4);accepted.writeUInt32BE(134);const completion=Buffer.alloc(8);completion.writeUInt32BE(134);
async function accept(p){const before=p.packets.length;await new AcceptTaskHandler().Handle(p.Session,{},accepted);assert.equal(p.packets.length,before+1);return p.packets.at(-1);}
async function complete(p){const before=p.packets.length;await new CompleteTaskHandler().Handle(p.Session,{},completion);assert.equal(p.packets.length,before+1);return p.packets.at(-1);}
async function state(p){const [task]=await db.Query('SELECT task_list,task_buffers FROM player_tasks WHERE owner_id=?',[p.Uid]);const [items]=await db.Query('SELECT item_list FROM player_items WHERE owner_id=?',[p.Uid]);return {task:JSON.parse(task.task_list)[134],buffers:JSON.parse(task.task_buffers),items:JSON.parse(items.item_list)};}
function itemCount(s,id){return s.items.find(item=>item.itemId===id)?.count||0;}
function assertReward(packet){assert.equal(packet.cmd,2202);assert.equal(packet.result,0);const b=packet.body;assert.equal(b.readUInt32BE(0),134);const n=b.readUInt32BE(12),items=[];for(let i=0;i<n;i++)items.push([b.readUInt32BE(16+8*i),b.readUInt32BE(20+8*i)]);assert.deepEqual(items,[[400131,1]]);}
async function consume(p){assert.equal(p.ItemManager.ConsumeItem(400131,1),true);await helper.SaveItemData(p.ItemManager.ItemData,true);}
(async()=>{
  ConfigLoader.Instance._configDir=path.join(app,'config');ConfigLoader.Instance.Reload();Config.Config.database={type:'sqlite',path:path.join(tmp,'test.sqlite')};
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());await ConfigRegistry.Instance.Initialize();await SkillEffectsConfig.Instance.Load();await db.Initialize();
  const migrations=new MigrationRunner();await migrations.initMigrationTable();await migrations.RunAll();
  const essence=GameConfig.GetItemById(400131);assert.equal(essence.Max,1);assert.equal(essence.BreedMonID,381);assert.equal(essence.BreedMonLv,1);
  const p=await create();assert.equal((await accept(p)).result,0);assert.equal((await state(p)).task.status,TaskStatus.ACCEPTED);
  await helper.SaveUser(p.Uid);clearTimers(p);clearCache(p.Uid);const reloaded=await login(p.Uid);
  assert.equal(reloaded.TaskManager.TaskData.GetTask(134).status,TaskStatus.ACCEPTED);assertReward(await complete(reloaded));
  let final=await state(reloaded);assert.equal(final.task.status,TaskStatus.COMPLETED);assert.equal(itemCount(final,400131),1);
  assert.notEqual((await complete(reloaded)).result,0);await consume(reloaded);assert.equal(itemCount(await state(reloaded),400131),0);
  assert.notEqual((await complete(reloaded)).result,0);assert.notEqual((await accept(reloaded)).result,0);assert.equal((await state(reloaded)).task.status,TaskStatus.COMPLETED);
  await helper.SaveUser(reloaded.Uid);clearTimers(reloaded);clearCache(reloaded.Uid);const afterConsume=await login(reloaded.Uid);
  assert.equal(afterConsume.TaskManager.TaskData.GetTask(134).status,TaskStatus.COMPLETED);assert.equal(itemCount(await state(afterConsume),400131),0);
  assert.notEqual((await complete(afterConsume)).result,0);assert.notEqual((await accept(afterConsume)).result,0);assert.equal(itemCount(await state(afterConsume),400131),0);
  const concurrent=await create();assert.equal((await accept(concurrent)).result,0);
  await Promise.all([new CompleteTaskHandler().Handle(concurrent.Session,{},completion),new CompleteTaskHandler().Handle(concurrent.Session,{},completion)]);
  assert.equal(concurrent.packets.slice(-2).filter(packet=>packet.result===0).length,1);final=await state(concurrent);assert.equal(final.task.status,TaskStatus.COMPLETED);assert.equal(itemCount(final,400131),1);
  const owned=await create();owned.ItemManager.ItemData.ItemList=[{itemId:400131,count:1,expireTime:0x057E40},{itemId:400001,count:2,expireTime:0x057E40}];await helper.SaveItemData(owned.ItemManager.ItemData,true);
  assert.equal((await accept(owned)).result,0);const beforeOwned=await state(owned);assert.notEqual((await complete(owned)).result,0);
  assert.deepEqual(await state(owned),beforeOwned);assert.equal(owned.TaskManager.TaskData.GetTask(134).status,TaskStatus.ACCEPTED);
  await consume(owned);assertReward(await complete(owned));final=await state(owned);assert.equal(itemCount(final,400131),1);assert.equal(itemCount(final,400001),2);
  const failure=await create();assert.equal((await accept(failure)).result,0);const before=await state(failure);originalConnection=db.WithConnection;let injected=false;
  db.WithConnection=function(work){return originalConnection.call(db,driver=>work(new Proxy(driver,{get(target,key){
    if(key==='execute')return async(sql,args)=>{const result=await target.execute(sql,args);if(!injected&&sql.startsWith('UPDATE player_items SET item_list')){injected=true;throw new Error('injected post-write failure');}return result;};
    const value=target[key];return typeof value==='function'?value.bind(target):value;
  }})));};
  try{assert.notEqual((await complete(failure)).result,0);}finally{db.WithConnection=originalConnection;}
  assert.equal(injected,true);assert.deepEqual(await state(failure),before);assert.equal(failure.TaskManager.TaskData.GetTask(134).status,TaskStatus.ACCEPTED);
  assertReward(await complete(failure));assert.equal(itemCount(await state(failure),400131),1);
  console.log('Task134 essence acceptance, relogin, quota, rollback and one-time completion passed');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  if(originalConnection)db.WithConnection=originalConnection;for(const p of players)clearTimers(p);for(const id of uids)clearCache(id);
  await db.Shutdown();fs.rmSync(tmp,{recursive:true,force:true});
});
