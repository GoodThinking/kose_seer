'use strict';
// Exercise the deployed handlers and a temporary SQLite database, never a live account.
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const app = path.resolve(process.argv[2]);
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const {Config} = load('shared/config/ServerConfig');
const {ConfigLoader} = load('shared/config/ConfigLoader');
const {ConfigRegistry} = load('shared/config/ConfigRegistry');
const {ConfigKeys, ConfigPaths, ConfigType} = load('shared/config/ConfigDefinitions');
const {DatabaseManager} = load('DataBase/DatabaseManager');
const {DatabaseHelper} = load('DataBase/DatabaseHelper');
const {PlayerData} = load('DataBase/models/PlayerData');
const {PlayerInstance} = load('GameServer/Game/Player/PlayerInstance');
const {ItemManager} = load('GameServer/Game/Item/ItemManager');
const {GameEventBus} = load('GameServer/Game/Event/GameEventBus');
const {createDefaultPlayerInfo} = load('shared/models/PlayerModel');
const {TalkCountHandler, TalkCateHandler} = load('GameServer/Server/Packet/Recv/NoNo/ExperienceReceiverHandlers');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-gacha-ticket-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance, players = [], results = [];
const realNow = Date.now;
let clock = 1950000000, uid = 419000;
Date.now = () => clock * 1000;
async function fixture(mapID = 103) {
  const id = ++uid;
  await db.Execute('INSERT INTO players VALUES (?, 1000, 0, 0, 1, 1)', [id]);
  const player = Object.create(PlayerInstance.prototype), packets = [];
  Object.assign(player, {Uid: id, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(id, 'GachaSmoke'), {mapID})),
    EventBus: new GameEventBus(), SendPacket: async packet => {packets.push({command: packet.getCmdId(), result: packet.getResult(), body: packet.serialize('xin-20261013')});}});
  player._session = {Socket: {destroyed: false}, Player: player};
  player.ItemManager = new ItemManager(player);
  await player.ItemManager.Initialize();
  player.ItemManager.ItemData.ItemList = [];
  await helper.SaveItemData(player.ItemManager.ItemData, true);
  Object.assign(player, {packets}); players.push(player);
  return player;
}
const body = type => { const b = Buffer.alloc(4); b.writeUInt32BE(type); return b; };
async function count(player) {
  await new TalkCountHandler().Handle(player.Session, {}, body(2051));
  const packet = player.packets.at(-1);
  return packet.result ? -packet.result : packet.body.readUInt32BE(0);
}
async function claim(player) {
  await new TalkCateHandler().Handle(player.Session, {}, body(2051));
  return player.packets.at(-1);
}
async function tickets(player) {
  const [row] = await db.Query('SELECT item_list FROM player_items WHERE owner_id = ?', [player.Uid]);
  return JSON.parse(row.item_list).find(item => item.itemId === 400501)?.count ?? 0;
}
async function run(name, fn) { clock += 86400; await fn(); results.push(name); }
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config'); ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'gacha.sqlite')};
  Config.Game.clientProtocol = 'xin-20261013';
  ConfigRegistry.Instance.Register(ConfigKeys.ITEM_CONFIG, ConfigPaths[ConfigKeys.ITEM_CONFIG], ConfigType.XML);
  await ConfigRegistry.Instance.Initialize(); await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL,pet_all_num INTEGER NOT NULL,pet_max_lev INTEGER NOT NULL)');
  for (const sql of new (load('DataBase/migrations/scripts/006_create_items').Migration006CreateItems)().upSQLite()) await db.Execute(sql);
  for (const sql of new (load('DataBase/migrations/scripts/021_create_receiver_claims').Migration021CreateReceiverClaims)().upSQLite()) await db.Execute(sql);

  await run('First claim of the day stores two tickets and reports the day as used', async () => {
    const p = await fixture();
    assert.equal(await count(p), 0);
    const reward = await claim(p);
    assert.equal(reward.result, 0);
    assert.deepEqual([reward.body.readUInt32BE(4), reward.body.readUInt32BE(8), reward.body.readUInt32BE(12)], [1, 400501, 2]);
    assert.equal(await tickets(p), 2);
    assert.equal(await count(p), 1);
    assert.equal((await claim(p)).result, 5002);
    assert.equal(await tickets(p), 2);
  });
  await run('The next Beijing day allows one more claim', async () => {
    const p = await fixture();
    assert.equal((await claim(p)).result, 0);
    clock += 86400;
    assert.equal(await count(p), 0);
    assert.equal((await claim(p)).result, 0);
    assert.equal(await tickets(p), 4);
  });
  await run('Claims away from the observation deck are rejected without a grant', async () => {
    const p = await fixture(5);
    assert.equal(await count(p), -5001);
    assert.equal((await claim(p)).result, 5000);
    assert.equal(await tickets(p), 0);
  });
  await run('Concurrent claims grant the tickets once', async () => {
    const p = await fixture();
    await Promise.all([claim(p), claim(p)]);
    assert.deepEqual(p.packets.filter(x => x.command === 2702).map(x => x.result).sort((a, b) => a - b), [0, 5002]);
    assert.equal(await tickets(p), 2);
  });
  await run('A failed inventory write rolls back the daily claim', async () => {
    const p = await fixture();
    await db.Execute('CREATE TRIGGER reject_tickets BEFORE UPDATE ON player_items WHEN NEW.owner_id=' + p.Uid + " BEGIN SELECT RAISE(ABORT,'forced ticket failure'); END");
    assert.equal((await claim(p)).result, 5000);
    await db.Execute('DROP TRIGGER reject_tickets');
    assert.equal(await tickets(p), 0);
    assert.equal(await count(p), 0);
  });
  console.log('GACHA_TICKET_SMOKE=' + JSON.stringify({passed: results.length, results, database: 'temporary-only'}));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  Date.now = realNow; for (const player of players) { player.Data.cleanup(); helper.RemoveCache(player.Uid); }
  await db.Shutdown(); fs.rmSync(temporary, {recursive: true, force: true}); process.exit(process.exitCode || 0);
});
