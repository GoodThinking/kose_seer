'use strict';
// Exercise the real inventory gate and SQLite transaction in an isolated temporary database.
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
if (!process.argv[2]) throw new Error('Usage: node test-native-cloth-exchange.cjs <app>');
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
const { ExchangeClothHandler } = load('GameServer/Server/Packet/Recv/Item/ExchangeClothHandler');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-cloth-exchange-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
let player, originalConnection;
function request(id) { const b = Buffer.alloc(4); b.writeUInt32BE(id); return b; }
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config'); ConfigLoader.Instance.Reload();
  Config.Config.database = { type: 'sqlite', path: path.join(temporary, 'cloth.sqlite') };
  Config.Game.clientProtocol = 'kose';
  await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL)');
  for (const sql of new (load('DataBase/migrations/scripts/006_create_items').Migration006CreateItems)().upSQLite()) await db.Execute(sql);
  const uid = 417076, packets = [];
  await db.Execute('INSERT INTO players VALUES (?,100,7,123)', [uid]);
  player = Object.create(PlayerInstance.prototype);
  Object.assign(player, { Uid: uid, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'ClothExchange'), { coins: 100, gold: 7, allocatableExp: 123, mapID: 6 })),
    SendPacket: async packet => packets.push({ result: packet.getResult(), body: packet.serialize('kose') }) });
  player._session = { UserID: uid, Socket: { destroyed: false }, Player: player };
  player.ItemManager = new ItemManager(player); await player.ItemManager.Initialize();
  const inventory = player.ItemManager.ItemData;
  const handler = new ExchangeClothHandler();
  const invoke = body => handler.Handle(player.Session, {}, body);
  const entry = (itemId, count = 1) => ({ itemId, count, expireTime: 0x057E40 });
  const seed = async items => { inventory.ItemList = structuredClone(items); await helper.SaveItemData(inventory, true); };
  const saved = async () => {
    const [row] = await db.Query('SELECT item_list FROM player_items WHERE owner_id=?', [uid]);
    const [wallet] = await db.Query('SELECT coins,gold,allocatable_exp FROM players WHERE user_id=?', [uid]);
    return { items: JSON.parse(row.item_list), wallet };
  };
  const wallet = { coins: 100, gold: 7, allocatable_exp: 123 };
  const count = (items, id) => items.find(item => item.itemId === id)?.count || 0;
  const invokeResult = async body => { packets.length = 0; await invoke(body); assert.equal(packets.length, 1); return packets[0]; };
  await seed([entry(400051, 2), entry(400052), entry(400001, 4)]);
  for (const [id, input, outputs] of [[1, 400051, [100016, 100017, 100018, 100019]], [2, 400052, [100087, 100088, 100089, 100090, 100091]]]) {
    const before = await saved();
    const packet = await invokeResult(request(id));
    assert.equal(packet.result, 0);
    const after = await saved();
    assert.equal(count(after.items, input), count(before.items, input) - 1);
    for (const output of outputs) assert.equal(count(after.items, output), 1);
    assert.equal(count(after.items, 400001), 4); assert.deepEqual(after.wallet, wallet);
    assert.deepEqual(inventory.ItemList, after.items);
    assert.equal(player.Data.coins, 100); assert.equal(player.Data.gold, 7); assert.equal(player.Data.allocatableExp, 123);
  }
  // Existing output rejects the entire first set without consuming its remaining material.
  let before = await saved();
  assert.equal((await invokeResult(request(1))).result, 5001);
  assert.deepEqual(await saved(), before); assert.deepEqual(inventory.ItemList, before.items);
  // The second input is now exhausted.
  assert.equal((await invokeResult(request(2))).result, 5001);
  assert.deepEqual(await saved(), before);
  for (const body of [request(0), request(3), Buffer.alloc(8)]) {
    assert.equal((await invokeResult(body)).result, 5001); assert.deepEqual(await saved(), before);
  }
  await seed([entry(400051), entry(400001, 4)]); before = await saved();
  player.Data.mapID = 5;
  assert.equal((await invokeResult(request(1))).result, 5001); assert.deepEqual(await saved(), before);
  player.Data.mapID = 6;
  // A real SQLite update succeeds, then an injected failure rolls back before commit.
  await seed([entry(400051, 2), entry(400001, 4)]); before = await saved();
  originalConnection = db.WithConnection;
  let inject = true;
  db.WithConnection = function(work) { return originalConnection.call(db, driver => work(new Proxy(driver, { get(target, key) {
    if (key === 'execute') return async (sql, args) => {
      const result = await target.execute(sql, args);
      if (inject && sql.startsWith('UPDATE player_items')) { inject = false; throw new Error('injected post-write failure'); }
      return result;
    };
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  }}))); };
  assert.equal((await invokeResult(request(1))).result, 5001);
  db.WithConnection = originalConnection;
  assert.deepEqual(await saved(), before); assert.deepEqual(inventory.ItemList, before.items);
  // A pending genuine transaction holds the gate; a duplicate request is rejected.
  let entered, release; const started = new Promise(resolve => { entered = resolve; });
  const barrier = new Promise(resolve => { release = resolve; });
  db.WithConnection = function(work) { return originalConnection.call(db, driver => work(new Proxy(driver, { get(target, key) {
    if (key === 'execute') return async (sql, args) => {
      const result = await target.execute(sql, args);
      if (sql.startsWith('UPDATE player_items')) { entered(); await barrier; }
      return result;
    };
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  }}))); };
  packets.length = 0;
  const first = invoke(request(1)); await started;
  await invoke(request(1)); assert.equal(packets[0].result, 5001);
  release(); await first; assert.equal(packets[1].result, 0);
  db.WithConnection = originalConnection;
  const after = await saved();
  assert.equal(count(after.items, 400051), 1);
  for (const id of [100016, 100017, 100018, 100019]) assert.equal(count(after.items, id), 1);
  assert.equal(count(after.items, 400001), 4); assert.deepEqual(after.wallet, wallet); assert.deepEqual(inventory.ItemList, after.items);
  // A lost success reply must not turn a committed exchange into a false failure response.
  await seed([entry(400052), entry(400001, 4)]);
  const sendPacket = player.SendPacket, replyAttempts = [];
  player.SendPacket = async packet => { replyAttempts.push(packet.getResult()); throw new Error('injected lost success reply'); };
  try { await invoke(request(2)); } finally { player.SendPacket = sendPacket; }
  const committed = await saved();
  assert.deepEqual(replyAttempts, [0]);
  assert.equal(count(committed.items, 400052), 0);
  for (const id of [100087, 100088, 100089, 100090, 100091]) assert.equal(count(committed.items, id), 1);
  assert.deepEqual(committed.wallet, wallet); assert.deepEqual(inventory.ItemList, committed.items);
  console.log('Native clothing exchange SQLite atomicity and concurrency passed');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (originalConnection) db.WithConnection = originalConnection;
  if (player?.Data?._saveTimer) clearTimeout(player.Data._saveTimer);
  if (player?.ItemManager?.ItemData?._saveTimer) clearTimeout(player.ItemManager.ItemData._saveTimer);
  await db.Shutdown(); fs.rmSync(temporary, { recursive: true, force: true });
});
