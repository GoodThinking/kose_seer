'use strict';
// Real 2701/2702 handlers and disposable SQLite; all accounts are test-only.
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
if(!process.argv[2])throw new Error('Usage: node test-map-day-gifts.cjs <candidate-app>');
const app=path.resolve(process.argv[2]);process.chdir(app);const load=file=>require(path.join(app,'dist',file));
load('DataBase/loaders/DataLoader');
const {Config}=load('shared/config/ServerConfig'),{ConfigLoader}=load('shared/config/ConfigLoader'),{ConfigRegistry}=load('shared/config/ConfigRegistry');
const {GetGameConfigRegistrations}=load('shared/config/ConfigDefinitions'),{SkillEffectsConfig}=load('shared/config/game/SkillEffectsConfig');
const {DatabaseManager}=load('DataBase/DatabaseManager'),{DatabaseHelper}=load('DataBase/DatabaseHelper'),{DataCache}=load('DataBase/cache/DataCache');
const {MigrationRunner}=load('DataBase/migrations/MigrationRunner'),{AccountRepository}=load('DataBase/repositories/Player/AccountRepository');
const {PlayerRepository}=load('DataBase/repositories/Player/PlayerRepository'),{PlayerInstance}=load('GameServer/Game/Player/PlayerInstance');
const {TalkCountHandler,TalkCateHandler}=load('GameServer/Server/Packet/Recv/NoNo/ExperienceReceiverHandlers');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'map-day-gifts-')),db=DatabaseManager.Instance,helper=DatabaseHelper.Instance;
const players=[],uids=[],cacheTypes=['player','item','pet','task','friend','mail'];let originalConnection;
const realNow=Date.now;let now=Date.UTC(2026,9,27,15,59,59,500);Date.now=()=>now;
const countHandler=new TalkCountHandler(),claimHandler=new TalkCateHandler();
function clearTimers(p){for(const data of [p.Data,p.ItemManager?.ItemData,p.PetManager?.PetData,p.TaskManager?.TaskData,p.FriendManager?.FriendData,p.MailManager?.MailData])clearTimeout(data?._saveTimer);}
function clearCache(id){for(const type of cacheTypes)clearTimeout(DataCache.Instance.Get(type,id)?._saveTimer);helper.RemoveCache(id);}
async function create(mapId){
  const account=new AccountRepository(),id=await account.CreateAccount('gift-'+crypto.randomBytes(8).toString('hex')+'@example.invalid',crypto.createHash('md5').update('FixtureOnly').digest('hex'));uids.push(id);
  await new PlayerRepository().CreatePlayer(id,'MapDayGift',0x3399cc);await account.UpdateRoleCreated(id,true);
  return login(id,mapId);
}
async function login(id,mapId){
  const session={Socket:{destroyed:false,write:()=>true}},player=new PlayerInstance(session,id,{});players.push(player);session.Player=player;
  player.packets=[];player.SendPacket=async packet=>player.packets.push({cmd:packet.getCmdId(),result:packet.getResult(),body:packet.serialize()});
  await player.Initialize();player.Data.mapID=mapId;return player;
}
const body=type=>{const b=Buffer.alloc(4);b.writeUInt32BE(type);return b;};
async function request(player,handler,type){const before=player.packets.length;await handler.Handle(player.Session,{},body(type));assert.equal(player.packets.length,before+1);return player.packets.at(-1);}
async function count(player,type){const p=await request(player,countHandler,type);assert.equal(p.cmd,2701);assert.equal(p.result,0);assert.equal(p.body.length,4);return p.body.readUInt32BE(0);}
async function claim(player,type,item){const p=await request(player,claimHandler,type);assert.equal(p.cmd,2702);assert.equal(p.result,0);assert.equal(p.body.length,16);assert.equal(p.body.readUInt32BE(4),1);assert.equal(p.body.readUInt32BE(8),item);assert.equal(p.body.readUInt32BE(12),1);}
async function stored(player){const [row]=await db.Query('SELECT item_list FROM player_items WHERE owner_id=?',[player.Uid]);return JSON.parse(row.item_list);}
async function amount(player,id){return (await stored(player)).find(item=>item.itemId===id)?.count||0;}
(async()=>{
  ConfigLoader.Instance._configDir=path.join(app,'config');ConfigLoader.Instance.Reload();Config.Config.database={type:'sqlite',path:path.join(tmp,'test.sqlite')};
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());await ConfigRegistry.Instance.Initialize();await SkillEffectsConfig.Instance.Load();await db.Initialize();
  const migrations=new MigrationRunner();await migrations.initMigrationTable();await migrations.RunAll();
  const p=await create(334);
  for(const [type,item] of [[20,300002],[21,300012]]){assert.equal(await count(p,type),0);await claim(p,type,item);assert.equal(await count(p,type),1);assert.notEqual((await request(p,claimHandler,type)).result,0);}
  for(let i=0;i<4;i++)await claim(p,22,300003);
  const concurrent=await Promise.all([claimHandler.Handle(p.Session,{},body(22)),claimHandler.Handle(p.Session,{},body(22))]);
  const pair=p.packets.slice(-2);assert.equal(pair.filter(packet=>packet.result===0).length,1);assert.equal(await count(p,22),5);
  assert.equal(await amount(p,300003),5);assert.notEqual((await request(p,claimHandler,22)).result,0);
  p.Data.mapID=339;assert.notEqual((await request(p,countHandler,20)).result,0);
  for(const [type,item] of [[24,300002],[25,300012]]){assert.equal(await count(p,type),0);await claim(p,type,item);assert.equal(await count(p,type),1);}
  for(const flags of [[false,true,3],[true,false,3],[true,true,1]]){[p.Data.superNono,p.Data.hasNono,p.Data.nonoState]=flags;assert.notEqual((await request(p,countHandler,2059)).result,0);assert.notEqual((await request(p,claimHandler,2059)).result,0);}
  Object.assign(p.Data,{superNono:true,hasNono:true,nonoState:3});
  for(const [type,item] of [[2059,300003],[2060,300013]]){assert.equal(await count(p,type),0);await claim(p,type,item);assert.equal(await count(p,type),1);}
  const five=await create(339);Object.assign(five.Data,{superNono:true,hasNono:true,nonoState:3});
  for(const [type,item] of [[24,300002],[25,300012],[2059,300003],[2060,300013]]) {
    for(let i=0;i<5;i++)await claim(five,type,item);
    assert.equal(await count(five,type),5);assert.notEqual((await request(five,claimHandler,type)).result,0);
  }
  const beforeReload=await stored(p);await helper.SaveUser(p.Uid);clearTimers(p);clearCache(p.Uid);
  const q=await login(p.Uid,339);assert.deepEqual(await stored(q),beforeReload);assert.equal(await count(q,24),1);assert.equal(await count(q,2059),1);
  const beforeDay=Math.floor(Date.UTC(2026,9,26,16)/1000),afterDay=Math.floor(Date.UTC(2026,9,27,16)/1000);
  let rows=await db.Query('SELECT period_start,amount FROM receiver_claims WHERE owner_id=? AND reward_key=?',[q.Uid,'map-gift:24']);assert.deepEqual(rows.map(r=>[r.period_start,r.amount]),[[beforeDay,1]]);
  now=Date.UTC(2026,9,27,16,0,0,100);assert.equal(await count(q,24),0);await claim(q,24,300002);assert.equal(await count(q,24),1);
  rows=await db.Query('SELECT period_start,amount FROM receiver_claims WHERE owner_id=? AND reward_key=? ORDER BY period_start',[q.Uid,'map-gift:24']);assert.deepEqual(rows.map(r=>[r.period_start,r.amount]),[[beforeDay,1],[afterDay,1]]);
  const failure=await create(334),snapshot=await stored(failure);originalConnection=db.WithConnection;let injected=false;
  db.WithConnection=function(work){return originalConnection.call(db,driver=>work(new Proxy(driver,{get(target,key){
    if(key==='execute')return async(sql,args)=>{const result=await target.execute(sql,args);if(!injected&&sql.startsWith('UPDATE player_items SET item_list')){injected=true;throw new Error('injected post-write failure');}return result;};
    const value=target[key];return typeof value==='function'?value.bind(target):value;
  }})));};
  try{assert.notEqual((await request(failure,claimHandler,20)).result,0);}finally{db.WithConnection=originalConnection;}
  assert.equal(injected,true);assert.deepEqual(await stored(failure),snapshot);assert.equal(await count(failure,20),0);await claim(failure,20,300002);
  for(const transition of ['map','disconnect','session']){
    const r=await create(339),before=await stored(r),release=await r.ItemManager.ItemData.AcquireReward(),session=r.Session,n=r.packets.length;
    const pending=claimHandler.Handle(session,{},body(24));
    if(transition==='map')r.Data.mapID=334;else if(transition==='disconnect')session.Socket.destroyed=true;else r._session={Player:r,Socket:{destroyed:false}};
    release();await pending;assert.deepEqual(await stored(r),before);assert.equal((await db.Query('SELECT amount FROM receiver_claims WHERE owner_id=? AND reward_key=?',[r.Uid,'map-gift:24'])).length,0);
    if(transition!=='map')assert.equal(r.packets.length,n);
  }
  const maxed=await create(334);const data=maxed.ItemManager.ItemData;data.ItemList=[{itemId:300002,count:9999,expireTime:0x057E40}];await helper.SaveItemData(data,true);
  assert.notEqual((await request(maxed,claimHandler,20)).result,0);assert.equal(await count(maxed,20),0);
  const delivery=await create(334),savedSend=delivery.SendPacket;delivery.SendPacket=async()=>{throw new Error('injected reply loss');};
  await claimHandler.Handle(delivery.Session,{},body(20));delivery.SendPacket=savedSend;assert.equal(await count(delivery,20),1);assert.equal(await amount(delivery,300002),1);
  assert.notEqual((await request(delivery,claimHandler,20)).result,0);
  const crossing=await create(334);now=Date.UTC(2026,9,28,15,59,59,900);const crossingBefore=await stored(crossing);originalConnection=db.WithConnection;let shifted=false;
  db.WithConnection=function(work){return originalConnection.call(db,driver=>work(new Proxy(driver,{get(target,key){
    if(key==='execute')return async(sql,args)=>{const result=await target.execute(sql,args);if(!shifted&&sql.startsWith('UPDATE player_items SET item_list')){shifted=true;now=Date.UTC(2026,9,28,16,0,0,100);}return result;};
    const value=target[key];return typeof value==='function'?value.bind(target):value;
  }})));};
  try{assert.notEqual((await request(crossing,claimHandler,20)).result,0);}finally{db.WithConnection=originalConnection;}
  assert.equal(shifted,true);assert.deepEqual(await stored(crossing),crossingBefore);assert.equal((await db.Query('SELECT amount FROM receiver_claims WHERE owner_id=? AND reward_key=?',[crossing.Uid,'map-gift:20'])).length,0);
  assert.equal(await count(crossing,20),0);await claim(crossing,20,300002);assert.equal(await count(crossing,20),1);
  console.log('Map day gifts: native 2701/2702, limits, reconnect, midnight, rollback and session boundaries passed');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  Date.now=realNow;if(originalConnection)db.WithConnection=originalConnection;
  for(const p of players)clearTimers(p);for(const id of uids)clearCache(id);
  await db.Shutdown();fs.rmSync(tmp,{recursive:true,force:true});
});
