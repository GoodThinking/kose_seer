'use strict';
// Exercise the real purchase handlers against an isolated SQLite database.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const assert = require('node:assert/strict');
const app = path.resolve(process.argv[2]);
process.chdir(app);
const load = p => require(path.join(app, 'dist', p));
load('DataBase/loaders/DataLoader');
const {Config} = load('shared/config/ServerConfig');
const {ConfigLoader} = load('shared/config/ConfigLoader');
const {ConfigRegistry} = load('shared/config/ConfigRegistry');
const {ConfigKeys, ConfigPaths, ConfigType} = load('shared/config/ConfigDefinitions');
const {DatabaseManager} = load('DataBase/DatabaseManager');
const {DatabaseHelper} = load('DataBase/DatabaseHelper');
const {DataSaver} = load('DataBase/savers/DataSaver');
const {DataCache} = load('DataBase/cache/DataCache');
const {PlayerData} = load('DataBase/models/PlayerData');
const {PlayerInstance} = load('GameServer/Game/Player/PlayerInstance');
const {ItemManager} = load('GameServer/Game/Item/ItemManager');
const {MoneyBuyProductHandler} = load('GameServer/Server/Packet/Recv/User/MoneyBuyProductHandler');
const {GameEventBus} = load('GameServer/Game/Event/GameEventBus');
const {createDefaultPlayerInfo} = load('shared/models/PlayerModel');
const {Migration006CreateItems} = load('DataBase/migrations/scripts/006_create_items');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-consumable-prices-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance, players = [];
let uid = 197500, passed = 0;
async function buyer(vip, coins) {
  uid++;
  await db.Execute('INSERT INTO players(user_id,coins,gold,allocatable_exp) VALUES(?,?,7,1000)', [uid, coins]);
  const packets = [], player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid: uid, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'PriceSmoke'), {coins, gold: 7, allocatableExp: 1000, vip})), SendPacket: async packet => packets.push(packet)});
  DataCache.Instance.Set('player', uid, player.Data);
  player._session = {Socket: {destroyed: false}, Player: player};
  player.EventBus = new GameEventBus();
  player.ItemManager = new ItemManager(player);
  await player.ItemManager.Initialize();
  players.push(player);
  return {player, packets};
}
async function finish(player) {
  player.Data.cleanup();
  await DataSaver.Instance.SaveUser(player.Uid);
  helper.RemoveCache(player.Uid);
}
async function inventory(player) {
  const [row] = await db.Query('SELECT item_list FROM player_items WHERE owner_id=?', [player.Uid]);
  return JSON.parse(row.item_list);
}
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temp, 'smoke.sqlite')};
  ConfigRegistry.Instance.Register(ConfigKeys.ITEM_CONFIG, ConfigPaths[ConfigKeys.ITEM_CONFIG], ConfigType.XML);
  ConfigRegistry.Instance.Register(ConfigKeys.UNIQUE_ITEMS_CONFIG, ConfigPaths[ConfigKeys.UNIQUE_ITEMS_CONFIG], ConfigType.JSON);
  await ConfigRegistry.Instance.Initialize();
  await db.Initialize();
  await db.Execute("CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL,clothes TEXT NOT NULL DEFAULT '[]')");
  await db.Execute(new Migration006CreateItems().upSQLite()[0]);
  for (const vip of [0, 1]) {
    for (const [itemId, affordableCount] of [[300024, 20], [300025, 20], [300052, 8], [300054, 8]]) {
      const {player, packets} = await buyer(vip, 4000);
      await player.ItemManager.HandleItemBuy(itemId, affordableCount);
      assert.equal(packets.at(-1).getResult(), 0);
      assert.equal(player.Data.coins, 0);
      assert.equal((await inventory(player)).find(item => item.itemId === itemId).count, affordableCount);
      const before = await inventory(player);
      await player.ItemManager.HandleItemBuy(itemId, 1);
      assert.equal(packets.at(-1).getResult(), 10016);
      assert.equal(player.Data.coins, 0);
      assert.deepEqual(await inventory(player), before);
      await finish(player);
      const [wallet] = await db.Query('SELECT coins,gold,allocatable_exp FROM players WHERE user_id=?', [player.Uid]);
      assert.deepEqual(wallet, {coins: 0, gold: 7, allocatable_exp: 1000});
      passed++;
    }
    for (const ordinary of [false, true]) {
      const {player, packets} = await buyer(vip, 10000);
      if (ordinary) await player.ItemManager.HandleItemBuy(300700, 1);
      else {
        const body = Buffer.alloc(6); body.writeUInt32BE(200133); body.writeUInt16BE(1, 4);
        await new MoneyBuyProductHandler().Handle(player.Session, {}, body);
      }
      assert.equal(packets.at(-1).getResult(), 0);
      assert.equal(player.Data.coins, 0);
      assert.equal((await inventory(player)).find(item => item.itemId === 300700).count, 1);
      await finish(player);
      passed++;
    }
  }
  console.log('CONSUMABLE_PRICE_SMOKE=' + JSON.stringify({passed, randomItemsFit4000Budget: true, insufficientFundsPreservesInventory: true, ordinaryAndProductRoutesAgree: true, database: 'temporary-only'}));
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(async () => {
  for (const player of players) player.Data.cleanup();
  await db.Shutdown();
  fs.rmSync(temp, {recursive: true, force: true});
  process.exit(process.exitCode || 0);
});
