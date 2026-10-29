'use strict';
// Exercise the deployed 2701/2702 handlers against disposable SQLite only.
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
if (!process.argv[2]) throw new Error('Usage: node test-helka-capsule.cjs <app>');
const app = path.resolve(process.argv[2]); process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const { Logger, LogLevel } = load('shared/utils/Logger'); Logger.SetMinLevel(LogLevel.Error);
const { Config } = load('shared/config/ServerConfig');
const { ConfigLoader } = load('shared/config/ConfigLoader');
const { DatabaseManager } = load('DataBase/DatabaseManager');
const { DatabaseHelper } = load('DataBase/DatabaseHelper');
const { PlayerData } = load('DataBase/models/PlayerData');
const { PlayerInstance } = load('GameServer/Game/Player/PlayerInstance');
const { ItemManager } = load('GameServer/Game/Item/ItemManager');
const { createDefaultPlayerInfo } = load('shared/models/PlayerModel');
const { TalkCountHandler, TalkCateHandler } = load('GameServer/Server/Packet/Recv/NoNo/ExperienceReceiverHandlers');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-helka-capsule-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance, players = [];
const realNow = Date.now; let clock = Date.UTC(2026, 9, 27, 15, 59), uid = 420000, originalConnection;
Date.now = () => clock;
const request = Buffer.alloc(4); request.writeUInt32BE(1502);
async function createPlayer(id, mapID = 35) {
  const player = Object.create(PlayerInstance.prototype), packets = [];
  Object.assign(player, { Uid: id, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(id, 'HelkaCapsule'), { mapID })),
    SendPacket: async packet => packets.push({ command: packet.getCmdId(), result: packet.getResult(), body: packet.serialize('xin-20261013') }) });
  player._session = { Socket: { destroyed: false }, Player: player };
  player.ItemManager = new ItemManager(player); await player.ItemManager.Initialize();
  player.packets = packets; players.push(player); return player;
}
async function fixture(mapID = 35) {
  const id = ++uid; await db.Execute('INSERT INTO players VALUES (?,100,7,123)', [id]);
  const player = await createPlayer(id, mapID);
  player.ItemManager.ItemData.ItemList = [];
  await helper.SaveItemData(player.ItemManager.ItemData, true);
  return player;
}
async function invoke(player, handler) {
  const before = player.packets.length; await new handler().Handle(player.Session, {}, request);
  assert.equal(player.packets.length, before + 1); return player.packets.at(-1);
}
async function count(player) { const packet = await invoke(player, TalkCountHandler); return packet.result ? -packet.result : packet.body.readUInt32BE(0); }
async function claim(player) { return invoke(player, TalkCateHandler); }
async function inventory(player) {
  const [row] = await db.Query('SELECT item_list FROM player_items WHERE owner_id = ?', [player.Uid]);
  return JSON.parse(row.item_list);
}
async function claims(player) { return db.Query('SELECT reward_key,period_start,amount FROM receiver_claims WHERE owner_id = ?', [player.Uid]); }
const quantity = items => items.find(item => item.itemId === 300008)?.count ?? 0;
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config'); ConfigLoader.Instance.Reload();
  Config.Config.database = { type: 'sqlite', path: path.join(temporary, 'helka.sqlite') };
  Config.Game.clientProtocol = 'xin-20261013'; await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL)');
  for (const sql of new (load('DataBase/migrations/scripts/006_create_items').Migration006CreateItems)().upSQLite()) await db.Execute(sql);
  for (const sql of new (load('DataBase/migrations/scripts/021_create_receiver_claims').Migration021CreateReceiverClaims)().upSQLite()) await db.Execute(sql);

  const first = await fixture();
  assert.equal(await count(first), 0);
  const reward = await claim(first); assert.equal(reward.result, 0);
  assert.deepEqual([reward.body.readUInt32BE(4), reward.body.readUInt32BE(8), reward.body.readUInt32BE(12)], [1, 300008, 2]);
  assert.equal(quantity(await inventory(first)), 2); assert.deepEqual(first.ItemManager.ItemData.ItemList, await inventory(first));
  assert.deepEqual(await claims(first), [{ reward_key: 'helka:capsule', period_start: 0, amount: 1 }]);
  assert.equal(await count(first), 1); assert.equal((await claim(first)).result, 5002);
  clock += 3 * 86400000;
  assert.equal(await count(first), 1); assert.equal((await claim(first)).result, 5002);
  // Recreate a player and inventory from database, not the former in-memory objects.
  clearTimeout(first.ItemManager.ItemData._saveTimer);
  helper.RemoveCache(first.Uid);
  const reloaded = await createPlayer(first.Uid);
  assert.equal(await count(reloaded), 1); assert.equal((await claim(reloaded)).result, 5002);
  assert.equal(quantity(await inventory(reloaded)), 2);

  const wrongMap = await fixture(34);
  assert.equal(await count(wrongMap), -5001); assert.equal((await claim(wrongMap)).result, 5000);
  assert.equal(quantity(await inventory(wrongMap)), 0); assert.deepEqual(await claims(wrongMap), []);
  const busy = await fixture(); busy.Data.actionType = 1;
  assert.equal(await count(busy), -5001); assert.equal((await claim(busy)).result, 5000);
  assert.deepEqual(await claims(busy), []);

  const full = await fixture();
  full.ItemManager.ItemData.ItemList = [{ itemId: 300008, count: 998, expireTime: 0x057E40 }];
  await helper.SaveItemData(full.ItemManager.ItemData, true);
  assert.equal((await claim(full)).result, 5000); assert.equal(quantity(await inventory(full)), 998);
  assert.equal(await count(full), 0); assert.deepEqual(await claims(full), []);
  assert.deepEqual(full.ItemManager.ItemData.ItemList, await inventory(full));
  const edge = await fixture();
  edge.ItemManager.ItemData.ItemList = [{ itemId: 300008, count: 997, expireTime: 0x057E40 }];
  await helper.SaveItemData(edge.ItemManager.ItemData, true);
  assert.equal((await claim(edge)).result, 0); assert.equal(quantity(await inventory(edge)), 999);


  // A failure after the real inventory UPDATE must roll back both SQL writes and cache.
  const failed = await fixture(); originalConnection = db.WithConnection; let injected = false;
  db.WithConnection = function(work) { return originalConnection.call(db, driver => work(new Proxy(driver, { get(target, key) {
    if (key === 'execute') return async (sql, args) => {
      const result = await target.execute(sql, args);
      if (!injected && sql.startsWith('UPDATE player_items')) { injected = true; throw new Error('injected post-write failure'); }
      return result;
    };
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  }}))); };
  try { assert.equal((await claim(failed)).result, 5000); } finally { db.WithConnection = originalConnection; }
  assert.equal(injected, true); assert.equal(quantity(await inventory(failed)), 0); assert.deepEqual(await claims(failed), []);
  assert.deepEqual(failed.ItemManager.ItemData.ItemList, await inventory(failed));
  assert.equal((await claim(failed)).result, 0); assert.equal(quantity(await inventory(failed)), 2);

  const concurrent = await fixture();
  await Promise.all([new TalkCateHandler().Handle(concurrent.Session, {}, request), new TalkCateHandler().Handle(concurrent.Session, {}, request)]);
  assert.deepEqual(concurrent.packets.map(p => p.result).sort((a,b) => a-b), [0, 5002]);
  assert.equal(quantity(await inventory(concurrent)), 2); assert.equal((await claims(concurrent)).length, 1);

  // A committed claim with a lost reply must not send a misleading failure or grant again.
  const lost = await fixture(); const results = [];
  lost.SendPacket = async packet => { results.push(packet.getResult()); throw new Error('injected lost reply'); };
  await new TalkCateHandler().Handle(lost.Session, {}, request);
  assert.deepEqual(results, [0]); assert.equal(quantity(await inventory(lost)), 2); assert.equal((await claims(lost)).length, 1);
  lost.SendPacket = async packet => lost.packets.push({ command: packet.getCmdId(), result: packet.getResult(), body: packet.serialize('xin-20261013') });
  assert.equal((await claim(lost)).result, 5002); assert.equal(quantity(await inventory(lost)), 2);
  console.log('Helka capsule permanent receiver SQLite regression passed');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  Date.now = realNow; if (originalConnection) db.WithConnection = originalConnection;
  for (const player of players) {
    clearTimeout(player.Data?._saveTimer);
    clearTimeout(player.ItemManager?.ItemData?._saveTimer);
    helper.RemoveCache(player.Uid);
  }
  await db.Shutdown(); fs.rmSync(temporary, { recursive: true, force: true });
});
