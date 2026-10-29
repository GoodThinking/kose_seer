'use strict';
// Isolated SQLite and the real item and balance gates; no played fixture is modified.
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
if (!process.argv[2]) throw new Error('Usage: node test-native-ore-sale.cjs <app>');
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
const { PlayerData } = load('DataBase/models/PlayerData');
const { PlayerInstance } = load('GameServer/Game/Player/PlayerInstance');
const { ItemManager } = load('GameServer/Game/Item/ItemManager');
const { createDefaultPlayerInfo } = load('shared/models/PlayerModel');
const { OreSaleHandler } = load('GameServer/Server/Packet/Recv/Item/OreSaleHandler');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-ore-sale-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
let player, originalConnection;
function request(id, count) { const b = Buffer.alloc(8); b.writeUInt32BE(id); b.writeUInt32BE(count, 4); return b; }
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config'); ConfigLoader.Instance.Reload();
  Config.Config.database = { type: 'sqlite', path: path.join(temporary, 'sale.sqlite') };
  Config.Game.clientProtocol = 'kose';
  ConfigRegistry.Instance.Register(ConfigKeys.ITEM_CONFIG, ConfigPaths[ConfigKeys.ITEM_CONFIG], ConfigType.XML);
  await ConfigRegistry.Instance.Initialize(); await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL)');
  for (const sql of new (load('DataBase/migrations/scripts/006_create_items').Migration006CreateItems)().upSQLite()) await db.Execute(sql);
  const uid = 417076, packets = [];
  await db.Execute('INSERT INTO players VALUES (?,100,0,0)', [uid]);
  player = Object.create(PlayerInstance.prototype);
  Object.assign(player, { Uid: uid, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'OreSale'), { coins: 100, gold: 0, allocatableExp: 0, mapID: 6 })),
    SendPacket: async packet => packets.push({ result: packet.getResult(), body: packet.serialize('kose') }) });
  player._session = { UserID: uid, Socket: { destroyed: false }, Player: player };
  player.ItemManager = new ItemManager(player); await player.ItemManager.Initialize();
  player.ItemManager.ItemData.AddItem(400001, 2, 0x057E40);
  await helper.SaveItemData(player.ItemManager.ItemData, true);
  const handler = new OreSaleHandler();
  const invoke = body => handler.Handle(player.Session, {}, body);
  const saved = async () => {
    const [wallet] = await db.Query('SELECT coins FROM players WHERE user_id=?', [uid]);
    const [row] = await db.Query('SELECT item_list FROM player_items WHERE owner_id=?', [uid]);
    return { coins: wallet.coins, count: JSON.parse(row.item_list).find(i => i.itemId === 400001)?.count || 0 };
  };
  for (const body of [request(400001, 0), request(400001, 3), request(400013, 1), Buffer.alloc(4)]) {
    packets.length = 0; await invoke(body); assert.equal(packets[0].result, 5001);
    assert.deepEqual(await saved(), { coins: 100, count: 2 });
  }
  originalConnection = db.WithConnection;
  let failSecondWrite = true;
  db.WithConnection = function(work) { return originalConnection.call(db, driver => {
    const proxy = new Proxy(driver, { get(target, key) {
      if (key === 'execute') return async (sql, args) => {
        if (failSecondWrite && sql.startsWith('UPDATE players SET coins')) { failSecondWrite = false; throw new Error('injected second write failure'); }
        return target.execute(sql, args);
      };
      const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
    }});
    return work(proxy);
  }); };
  packets.length = 0; await invoke(request(400001, 1)); assert.equal(packets[0].result, 5001);
  db.WithConnection = originalConnection;
  assert.deepEqual(await saved(), { coins: 100, count: 2 });
  assert.equal(player.Data.coins, 100); assert.equal(player.ItemManager.ItemData.GetItemCount(400001), 2);
  packets.length = 0; await invoke(request(400001, 1));
  assert.equal(packets[0].result, 0); assert.equal(packets[0].body.length, 0);
  assert.deepEqual(await saved(), { coins: 160, count: 1 });
  assert.equal(player.Data.coins, 160); assert.equal(player.ItemManager.ItemData.GetItemCount(400001), 1);
  let entered, release; const started = new Promise(resolve => { entered = resolve; });
  const barrier = new Promise(resolve => { release = resolve; });
  db.WithConnection = function(work) { return originalConnection.call(db, async driver => {
    const proxy = new Proxy(driver, { get(target, key) {
      if (key === 'execute') return async (sql, args) => {
        const result = await target.execute(sql, args);
        if (sql.startsWith('UPDATE player_items')) { entered(); await barrier; }
        return result;
      };
      const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
    }});
    return work(proxy);
  }); };
  packets.length = 0;
  const first = invoke(request(400001, 1)); await started;
  await invoke(request(400001, 1)); assert.equal(packets[0].result, 5001);
  release(); await first; assert.equal(packets[1].result, 0);
  db.WithConnection = originalConnection;
  assert.deepEqual(await saved(), { coins: 220, count: 0 });
  assert.equal(player.Data.coins, 220); assert.equal(player.ItemManager.ItemData.GetItemCount(400001), 0);
  console.log('Native ore sale SQLite atomicity and concurrency passed');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (originalConnection) db.WithConnection = originalConnection;
  if (player?.Data?._saveTimer) clearTimeout(player.Data._saveTimer);
  await db.Shutdown(); fs.rmSync(temporary, { recursive: true, force: true });
});
