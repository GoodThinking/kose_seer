'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const app=process.argv[2]; process.chdir(app);
const load=p=>require(path.join(app,'dist',p));
load('DataBase/loaders/DataLoader');
const {Config}=load('shared/config/ServerConfig');
const {ConfigLoader}=load('shared/config/ConfigLoader');
const {ConfigRegistry}=load('shared/config/ConfigRegistry');
const {ConfigKeys,ConfigPaths,ConfigType}=load('shared/config/ConfigDefinitions');
const {DatabaseManager}=load('DataBase/DatabaseManager');
const {DatabaseHelper}=load('DataBase/DatabaseHelper');
const {DataSaver}=load('DataBase/savers/DataSaver');
const {PlayerData}=load('DataBase/models/PlayerData');
const {PlayerInstance}=load('GameServer/Game/Player/PlayerInstance');
const {ItemManager}=load('GameServer/Game/Item/ItemManager');
const {MoneyBuyProductHandler}=load('GameServer/Server/Packet/Recv/User/MoneyBuyProductHandler');
const {GameEventBus}=load('GameServer/Game/Event/GameEventBus');
const {createDefaultPlayerInfo}=load('shared/models/PlayerModel');
const {Migration006CreateItems}=load('DataBase/migrations/scripts/006_create_items');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'kose-coin-products-'));
const db=DatabaseManager.Instance,helper=DatabaseHelper.Instance,players=[],results=[];
let uid=197000;
async function buyer(vip,coins=10000){
  uid++; await db.Execute('INSERT INTO players VALUES (?, ?, 7, 1000)',[uid,coins]);
  const packets=[],player=Object.create(PlayerInstance.prototype);
  Object.assign(player,{Uid:uid,Data:new PlayerData(Object.assign(createDefaultPlayerInfo(uid,'CoinSmoke'),{coins,gold:7,allocatableExp:1000,vip})),SendPacket:async packet=>{packets.push(packet);}});
  player._session={Socket:{destroyed:false},Player:player};players.push(player);
  player.EventBus=new GameEventBus();
  player.ItemManager=new ItemManager(player);await player.ItemManager.Initialize();
  return {player,packets};
}
async function request(player,productId,count=1){const body=Buffer.alloc(6);body.writeUInt32BE(productId,0);body.writeUInt16BE(count,4);await new MoneyBuyProductHandler().Handle(player.Session,{},body);}
async function saved(player){const [wallet]=await db.Query('SELECT coins,gold,allocatable_exp FROM players WHERE user_id=?',[player.Uid]);const [row]=await db.Query('SELECT item_list FROM player_items WHERE owner_id=?',[player.Uid]);return {wallet,items:JSON.parse(row.item_list)};}
async function finish(player){player.Data.cleanup();await DataSaver.Instance.SaveUser(player.Uid);helper.RemoveCache(player.Uid);}
(async()=>{
  ConfigLoader.Instance._configDir=path.join(app,'config');ConfigLoader.Instance.Reload();
  Config.Config.database={type:'sqlite',path:path.join(temp,'smoke.sqlite')};
  ConfigRegistry.Instance.Register(ConfigKeys.ITEM_CONFIG,ConfigPaths[ConfigKeys.ITEM_CONFIG],ConfigType.XML);
  ConfigRegistry.Instance.Register(ConfigKeys.UNIQUE_ITEMS_CONFIG,ConfigPaths[ConfigKeys.UNIQUE_ITEMS_CONFIG],ConfigType.JSON);
  await ConfigRegistry.Instance.Initialize();await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL)');
  await db.Execute(new Migration006CreateItems().upSQLite()[0]);
  const catalog=ConfigLoader.Instance.LoadJson('data/json/money-products.json');assert.equal(catalog.products.length,84);
  for(const product of catalog.products)for(const vip of [0,1]){
    const {player,packets}=await buyer(vip);await request(player,product.productId);
    const packet=packets.at(-1),state=await saved(player),blocked=product.vipOnly&&!vip;
    assert.equal(packet.getCmdId(),1102);assert.equal(packet.getResult(),blocked?5001:0,product.name);
    if(blocked){assert.deepEqual(state.wallet,{coins:10000,gold:7,allocatable_exp:1000});assert.deepEqual(state.items,[]);}
    else{
      const price=vip?product.vipCoins:product.coins;
      assert.deepEqual(state.wallet,{coins:10000-price,gold:7+product.goldReward,allocatable_exp:1000});
      assert.deepEqual(state.items.map(item=>item.itemId),product.itemIds);for(const item of state.items)assert.equal(item.count,1);
      const body=packet.serialize();assert.equal(body.length,12);assert.equal(body.readUInt32BE(4),price);assert.equal(body.readUInt32BE(8),10000-price);
      assert.equal(player.Data.coins,state.wallet.coins);assert.equal(player.Data.gold,state.wallet.gold);
      const reloaded=new ItemManager(player);helper.RemoveCache(player.Uid);await reloaded.Initialize();
      for(const itemId of product.itemIds)assert.equal(reloaded.GetItemCount(itemId),1);
      await reloaded.HandleItemList(0,0,0);
      const inventoryBody=packets.at(-1).serialize();
      for(let offset=4;offset<inventoryBody.length;offset+=16)assert.ok(inventoryBody.readUInt32BE(offset+8)>0,'Purchased item must remain usable in native inventory');
      if(product.productId===200132&&vip===1)results.push({case:'silver-bundle-inventory-wire',hex:inventoryBody.toString('hex')});
      if(product.productId===200128&&vip===1)results.push({case:'silver-helmet-vip-wire',hex:body.toString('hex'),coins:state.wallet.coins,spent:price});
    }
    await finish(player);
  }
  for(const vip of [0,1]){
    const ordinary=await buyer(vip);await ordinary.player.ItemManager.HandleItemBuy(100338,1);
    const price=vip?210:420;assert.equal(ordinary.packets.at(-1).getResult(),0);
    assert.equal((await saved(ordinary.player)).wallet.coins,10000-price);assert.equal(ordinary.player.ItemManager.GetItemCount(100338),1);
    await ordinary.player.ItemManager.HandleItemList(100001,101000,2);
    assert.ok(ordinary.packets.at(-1).serialize().readUInt32BE(12)>0,'Ordinary purchase must be wearable');
    await finish(ordinary.player);
  }
  const low=await buyer(0,100);await request(low.player,200128);assert.equal(low.packets.at(-1).getResult(),10016);assert.equal((await saved(low.player)).wallet.coins,100);assert.deepEqual((await saved(low.player)).items,[]);await finish(low.player);
  const duplicate=await buyer(0);await Promise.all([request(duplicate.player,200132),request(duplicate.player,200132)]);assert.deepEqual(duplicate.packets.map(p=>p.getResult()).sort((a,b)=>a-b),[0,103203]);assert.equal((await saved(duplicate.player)).wallet.coins,8800);await finish(duplicate.player);
  const failure=await buyer(0);await db.Execute('CREATE TRIGGER reject_coin_save BEFORE UPDATE ON players WHEN NEW.user_id='+failure.player.Uid+" BEGIN SELECT RAISE(ABORT,'forced product failure'); END");await request(failure.player,200128);assert.equal(failure.packets.at(-1).getResult(),5000);assert.deepEqual((await saved(failure.player)).items,[]);assert.equal((await saved(failure.player)).wallet.coins,10000);assert.equal(failure.player.Data.coins,10000);await finish(failure.player);
  const removed=await buyer(0);for(const id of [199901,199902,199903,199904,199905])await removed.player.ItemManager.HandleItemBuy(id,1);assert.deepEqual(removed.packets.map(p=>p.getResult()),[5001,5001,5001,5001,5001]);assert.deepEqual((await saved(removed.player)).items,[]);await finish(removed.player);
  console.log('COIN_PRODUCT_SMOKE='+JSON.stringify({products:84,rolesPerProduct:2,catalogRequests:168,ordinaryEntryRequests:2,insufficientBalance:true,concurrentBundleNoDuplicate:true,failedPaymentNoGrant:true,removedSuitRejected:true,results,database:'temporary-only'}));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{for(const player of players)player.Data.cleanup();await db.Shutdown();fs.rmSync(temp,{recursive:true,force:true});process.exit(process.exitCode||0);});
