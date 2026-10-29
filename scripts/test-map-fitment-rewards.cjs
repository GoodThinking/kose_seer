'use strict';
// Real item registry, item manager and disposable SQLite; no natural player database.
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
if (!process.argv[2]) throw new Error('Usage: node test-map-fitment-rewards.cjs <app>');
const app = path.resolve(process.argv[2]); process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const { Config } = load('shared/config/ServerConfig');
const { ConfigLoader } = load('shared/config/ConfigLoader');
const { ConfigRegistry } = load('shared/config/ConfigRegistry');
const { GetGameConfigRegistrations } = load('shared/config/ConfigDefinitions');
const { DatabaseManager } = load('DataBase/DatabaseManager');
const { DatabaseHelper } = load('DataBase/DatabaseHelper');
const { DataCache } = load('DataBase/cache/DataCache');
const { MigrationRunner } = load('DataBase/migrations/MigrationRunner');
const { AccountRepository } = load('DataBase/repositories/Player/AccountRepository');
const { PlayerRepository } = load('DataBase/repositories/Player/PlayerRepository');
const { SkillEffectsConfig } = load('shared/config/game/SkillEffectsConfig');
const { PlayerInstance } = load('GameServer/Game/Player/PlayerInstance');
const { Grant } = load('GameServer/Game/Item/MapFitmentRewards');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(),'map-fitment-'));
const db=DatabaseManager.Instance, helper=DatabaseHelper.Instance, players=[], uids=[];
let originalConnection;
async function fixture(mapID) {
  const account = new AccountRepository();
  const id = await account.CreateAccount('fitment-'+crypto.randomBytes(8).toString('hex')+'@example.invalid',crypto.createHash('md5').update('FixtureOnly').digest('hex'));
  uids.push(id);
  await new PlayerRepository().CreatePlayer(id,'MapFitmentTest',0x3399cc);
  await account.UpdateRoleCreated(id,true);
  const session={Socket:{destroyed:false,write:()=>true}}, player=new PlayerInstance(session,id,{});
  players.push(player);
  session.Player=player; player.events=[];
  await player.Initialize();
  player.Data.mapID=mapID;
  player.EventBus.On('item:gained',event=>player.events.push(event));
  player.ItemManager.ItemData.ItemList=[{itemId:400001,count:2,expireTime:0x057E40}];
  await helper.SaveItemData(player.ItemManager.ItemData,true);
  return player;
}
async function persisted(player) {
  const [row]=await db.Query('SELECT item_list FROM player_items WHERE owner_id=?',[player.Uid]); return JSON.parse(row.item_list);
}
(async()=>{
  ConfigLoader.Instance._configDir=path.join(app,'config'); ConfigLoader.Instance.Reload();
  Config.Config.database={type:'sqlite',path:path.join(temporary,'test.sqlite')};
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());
  await ConfigRegistry.Instance.Initialize(); await SkillEffectsConfig.Instance.Load(); await db.Initialize();
  const migrations=new MigrationRunner(); await migrations.initMigrationTable(); await migrations.RunAll();
  for(const [mapID,id] of [[344,500640],[344,500641],[334,500824]]) {
    const p=await fixture(mapID), initial=await persisted(p);
    await assert.rejects(Grant(p,id,0)); await assert.rejects(Grant(p,id,2)); await assert.rejects(Grant(p,500642,1));
    assert.deepEqual(await persisted(p),initial); assert.deepEqual(p.events,[]);
    p.Data.mapID=mapID===334?344:334; await assert.rejects(Grant(p,id,1)); p.Data.mapID=mapID;
    const outcomes=await Promise.allSettled([Grant(p,id,1),Grant(p,id,1)]);
    assert.equal(outcomes.filter(result=>result.status==='fulfilled').length,1);
    const items=await persisted(p); assert.equal(items.find(item=>item.itemId===id).count,1);
    assert.equal(items.find(item=>item.itemId===400001).count,2); assert.deepEqual(p.ItemManager.ItemData.ItemList,items);
    assert.equal(p.events.length,1); assert.equal(p.events[0].itemId,id);
    await assert.rejects(Grant(p,id,1)); assert.deepEqual(await persisted(p),items);
  }
  for(const transition of ['leave-map','disconnect','replace-session']) {
    const q=await fixture(344), initial=await persisted(q), release=await q.ItemManager.ItemData.AcquireReward();
    const rejected=assert.rejects(Grant(q,500640,1));
    if(transition==='leave-map') q.Data.mapID=334;
    else if(transition==='disconnect') q.Session.Socket.destroyed=true;
    else q._session={Player:q,Socket:{destroyed:false}};
    release(); await rejected;
    assert.deepEqual(await persisted(q),initial); assert.deepEqual(q.events,[]);
  }
  const p=await fixture(344), before=await persisted(p); originalConnection=db.WithConnection; let injected=false;
  db.WithConnection=function(work){return originalConnection.call(db,driver=>work(new Proxy(driver,{get(target,key){
    if(key==='execute')return async(sql,args)=>{const result=await target.execute(sql,args);if(!injected&&sql.startsWith('UPDATE player_items SET item_list')){injected=true;throw new Error('injected failure after write');}return result;};
    const value=target[key];return typeof value==='function'?value.bind(target):value;
  }})));};
  try { await assert.rejects(Grant(p,500640,1)); } finally { db.WithConnection=originalConnection; }
  assert.equal(injected,true); assert.deepEqual(await persisted(p),before); assert.deepEqual(p.ItemManager.ItemData.ItemList,before); assert.deepEqual(p.events,[]);
  await Grant(p,500640,1); assert.equal((await persisted(p)).find(item=>item.itemId===500640).count,1);
  console.log('Map furniture transactional rewards passed');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  if(originalConnection)db.WithConnection=originalConnection;
  for(const p of players)for(const data of [p.Data,p.ItemManager?.ItemData,p.PetManager?.PetData,p.TaskManager?.TaskData,p.FriendManager?.FriendData,p.MailManager?.MailData])clearTimeout(data?._saveTimer);
  for(const id of uids){for(const type of ['player','item','pet','task','friend','mail'])clearTimeout(DataCache.Instance.Get(type,id)?._saveTimer);helper.RemoveCache(id);}
  await db.Shutdown();fs.rmSync(temporary,{recursive:true,force:true});
});
