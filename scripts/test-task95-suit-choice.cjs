'use strict';
// Exercise real 2202 decoding, task completion and reward persistence in disposable SQLite.
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
if (!process.argv[2]) throw new Error('Usage: node test-task95-suit-choice.cjs <app>');
const app = path.resolve(process.argv[2]); process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const { Logger, LogLevel } = load('shared/utils/Logger'); Logger.SetMinLevel(LogLevel.Error);
const { Config } = load('shared/config/ServerConfig');
const { ConfigLoader } = load('shared/config/ConfigLoader');
const { ConfigRegistry } = load('shared/config/ConfigRegistry');
const { ConfigKeys, ConfigPaths, ConfigType } = load('shared/config/ConfigDefinitions');
const { DatabaseManager } = load('DataBase/DatabaseManager');
const { DatabaseHelper } = load('DataBase/DatabaseHelper');
const { DataCache } = load('DataBase/cache/DataCache');
const { PlayerData } = load('DataBase/models/PlayerData');
const { TaskData, TaskStatus } = load('DataBase/models/TaskData');
const { PlayerInstance } = load('GameServer/Game/Player/PlayerInstance');
const { ItemManager } = load('GameServer/Game/Item/ItemManager');
const { TaskManager } = load('GameServer/Game/Task/TaskManager');
const { GameEventBus } = load('GameServer/Game/Event/GameEventBus');
const { CompleteTaskHandler } = load('GameServer/Server/Packet/Recv/Task/CompleteTaskHandler');
const { createDefaultPlayerInfo } = load('shared/models/PlayerModel');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-task95-choice-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance, players = [];
let uid = 421000, originalConnection;
const SUITS = [[100346,100347,100348,100349],[100350,100351,100352,100353]];
const body = choice => { const bytes = Buffer.alloc(8); bytes.writeUInt32BE(95,0); bytes.writeUInt32BE(choice,4); return bytes; };
async function fixture() {
  const id = ++uid, now = Math.floor(Date.now()/1000);
  await db.Execute('INSERT INTO players VALUES (?,100,7,123)', [id]);
  const task = { taskId:95,status:TaskStatus.ACCEPTED,acceptTime:now,completeTime:0 };
  const buffers = { 95: { xinBytes:[1,1,1,1,1,1,1,0] } };
  await db.Execute('INSERT INTO player_tasks VALUES (?,?,?)', [id, JSON.stringify({95:task}), JSON.stringify(buffers)]);
  const player = Object.create(PlayerInstance.prototype), packets = [];
  Object.assign(player, { Uid:id, Data:new PlayerData(Object.assign(createDefaultPlayerInfo(id,'Task95Choice'),{coins:100,gold:7,allocatableExp:123})), EventBus:new GameEventBus(),
    SendPacket:async packet => packets.push({result:packet.getResult(),body:packet.serialize('xin-20261013')}) });
  player._session = { Socket:{destroyed:false}, Player:player };
  player.events=[]; player.EventBus.On('item:gained',event=>player.events.push(event));
  player.ItemManager = new ItemManager(player); await player.ItemManager.Initialize();
  player.ItemManager.ItemData.ItemList = []; await helper.SaveItemData(player.ItemManager.ItemData,true);
  const [row] = await db.Query('SELECT owner_id,task_list,task_buffers FROM player_tasks WHERE owner_id=?',[id]);
  player.TaskManager = new TaskManager(player); player.TaskManager.TaskData = TaskData.FromRow(row);
  player.packets = packets; players.push(player); return player;
}
async function complete(player, choice) {
  const n = player.packets.length; await new CompleteTaskHandler().Handle(player.Session,{},body(choice));
  assert.equal(player.packets.length,n+1); return player.packets.at(-1);
}
async function state(player) {
  const [wallet] = await db.Query('SELECT coins,gold,allocatable_exp FROM players WHERE user_id=?',[player.Uid]);
  const [tasks] = await db.Query('SELECT task_list,task_buffers FROM player_tasks WHERE owner_id=?',[player.Uid]);
  const [inventory] = await db.Query('SELECT item_list FROM player_items WHERE owner_id=?',[player.Uid]);
  return {wallet,task:JSON.parse(tasks.task_list)[95],buffers:JSON.parse(tasks.task_buffers),items:JSON.parse(inventory.item_list)};
}
function responseItems(packet) {
  const b=packet.body, count=b.readUInt32BE(12), items=[];
  for(let i=0;i<count;i++) items.push({itemId:b.readUInt32BE(16+8*i),count:b.readUInt32BE(20+8*i)});
  return items;
}
const suitItems = items => items.filter(x => x.itemId>=100346 && x.itemId<=100353).map(x => x.itemId).sort((a,b)=>a-b);
(async()=>{
  ConfigLoader.Instance._configDir=path.join(app,'config'); ConfigLoader.Instance.Reload();
  Config.Config.database={type:'sqlite',path:path.join(tmp,'task95.sqlite')}; Config.Game.clientProtocol='xin-20261013';
  ConfigRegistry.Instance.Register(ConfigKeys.ITEM_CONFIG,ConfigPaths[ConfigKeys.ITEM_CONFIG],ConfigType.XML);
  await ConfigRegistry.Instance.Initialize(); await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL)');
  await db.Execute("CREATE TABLE player_tasks(owner_id INTEGER PRIMARY KEY,task_list TEXT NOT NULL DEFAULT '{}',task_buffers TEXT NOT NULL DEFAULT '{}')");
  for(const sql of new (load('DataBase/migrations/scripts/006_create_items').Migration006CreateItems)().upSQLite()) await db.Execute(sql);

  const a=await fixture(), b=await fixture();
  const pa=await complete(a,1), pb=await complete(b,2);
  const sa=await state(a), sb=await state(b);
  const invalids=[];
  for(const value of [0,3,0xffffffff]) {
    const p=await fixture(), before=await state(p), packet=await complete(p,value);
    invalids.push({value,before,packet,after:await state(p)});
  }
  console.log('Task95 baseline',JSON.stringify({choice1:{result:pa.result,state:sa,reply:responseItems(pa)},choice2:{result:pb.result,state:sb,reply:responseItems(pb)},invalids}));
  assert.equal(pa.result,0,'choice 1 must complete'); assert.equal(pb.result,0,'choice 2 must complete');
  for(const {value,before,packet,after} of invalids) { assert.notEqual(packet.result,0,`invalid ${value}`); assert.deepEqual(after,before); }
  for(const [p,s,packet] of [[a,sa,pa],[b,sb,pb]]) {
    assert.deepEqual(s.wallet,{coins:2100,gold:7,allocatable_exp:4123}); assert.equal(s.task.status,TaskStatus.COMPLETED);
    assert.deepEqual(s.buffers['95'].xinBytes,[1,1,1,1,1,1,1,1]); assert.deepEqual(p.TaskManager.TaskData.GetTaskBuffer(95).xinBytes,s.buffers['95'].xinBytes);
    assert.equal(s.items.filter(x=>x.itemId>=100346 && x.itemId<=100353).length,4);
    assert.ok(s.items.filter(x=>x.itemId>=100346 && x.itemId<=100353).every(x=>x.count===1));
    assert.deepEqual(suitItems(responseItems(packet)),suitItems(s.items));
    assert.deepEqual(suitItems(p.events),suitItems(s.items)); assert.ok(p.events.every(event=>event.count===1 && event.source==='task_reward'));
    assert.deepEqual(p.ItemManager.ItemData.ItemList,s.items); assert.equal(p.Data.allocatableExp,4123);
  }
  // Original panel mc0/type 1 shows 刺蜂; mc1/type 2 shows 锡蝶.
  assert.deepEqual(suitItems(sa.items),SUITS[0]); assert.deepEqual(suitItems(sb.items),SUITS[1]);
  assert.notEqual((await complete(a,1)).result,0); assert.deepEqual(await state(a),sa);
  assert.notEqual((await complete(b,2)).result,0); assert.deepEqual(await state(b),sb);
  const concurrent=await fixture(), handler=new CompleteTaskHandler();
  await Promise.all([handler.Handle(concurrent.Session,{},body(1)),handler.Handle(concurrent.Session,{},body(2))]);
  assert.equal(concurrent.packets.length,2); assert.equal(concurrent.packets.filter(packet=>packet.result===0).length,1);
  const cs=await state(concurrent), winning=concurrent.packets.find(packet=>packet.result===0);
  assert.deepEqual(cs.wallet,{coins:2100,gold:7,allocatable_exp:4123}); assert.equal(cs.task.status,TaskStatus.COMPLETED);
  assert.deepEqual(suitItems(cs.items),suitItems(responseItems(winning))); assert.equal(suitItems(cs.items).length,4);
  assert.deepEqual(suitItems(concurrent.events),suitItems(cs.items));

  const failed=await fixture(), before=await state(failed); originalConnection=db.WithConnection; let injected=false;
  db.WithConnection=function(work){return originalConnection.call(db,driver=>work(new Proxy(driver,{get(target,key){
    if(key==='execute')return async(sql,args)=>{const result=await target.execute(sql,args); if(!injected && sql.startsWith('UPDATE players SET coins')){injected=true;throw new Error('injected post-write failure');} return result;};
    const value=target[key]; return typeof value==='function'?value.bind(target):value;
  }})));};
  try{assert.notEqual((await complete(failed,1)).result,0);}finally{db.WithConnection=originalConnection;}
  assert.equal(injected,true); assert.deepEqual(await state(failed),before); assert.deepEqual(failed.ItemManager.ItemData.ItemList,before.items);
  assert.deepEqual(failed.events,[]);
  assert.equal(failed.Data.allocatableExp,123); assert.equal(failed.TaskManager.TaskData.GetTask(95).status,TaskStatus.ACCEPTED);
  assert.equal((await complete(failed,1)).result,0); assert.equal((await state(failed)).wallet.allocatable_exp,4123);
  console.log('Task95 2202 suit selection SQLite regression passed');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  if(originalConnection)db.WithConnection=originalConnection;
  for(const p of players){for(const data of [p.Data,p.ItemManager?.ItemData,p.TaskManager?.TaskData,DataCache.Instance.Get('player',p.Uid)]) clearTimeout(data?._saveTimer);helper.RemoveCache(p.Uid);}
  await db.Shutdown();fs.rmSync(tmp,{recursive:true,force:true});
});
