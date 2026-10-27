'use strict';
// Exercise real packet handlers, pet manager and transactions against disposable SQLite.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const app = path.resolve(process.argv[2]);
const release = path.resolve(process.argv[3]);
const evidence = process.argv[4] && path.resolve(process.argv[4]);
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
function overlay(relative) {
  const filename = path.join(app, 'dist', relative);
  const patched = new Module(filename);
  patched.filename = filename;
  patched.paths = Module._nodeModulePaths(path.dirname(filename));
  require.cache[filename] = patched;
  const source = app === release ? path.join(app, 'dist', relative) : path.join(release, 'app/dist', relative);
  patched._compile(fs.readFileSync(source, 'utf8'), filename);
  patched.loaded = true;
}
load('DataBase/loaders/DataLoader');
const { Config } = load('shared/config/ServerConfig');
const { ConfigLoader } = load('shared/config/ConfigLoader');
const { ConfigRegistry } = load('shared/config/ConfigRegistry');
const { ConfigKeys, ConfigPaths, ConfigType } = load('shared/config/ConfigDefinitions');
const { DataSaver } = load('DataBase/savers/DataSaver');
const { DatabaseManager } = load('DataBase/DatabaseManager');
const { DatabaseHelper } = load('DataBase/DatabaseHelper');
const { PlayerData } = load('DataBase/models/PlayerData');
const { PlayerInstance } = load('GameServer/Game/Player/PlayerInstance');
const { PetManager } = load('GameServer/Game/Pet/PetManager');
const { GameEventBus } = load('GameServer/Game/Event/GameEventBus');
const { createDefaultPlayerInfo } = load('shared/models/PlayerModel');
overlay('GameServer/Game/Pet/PermanentPetExchange.js');
overlay('GameServer/Server/Packet/Recv/Pet/PetCollectHandler.js');
const { PetCollectHandler, IsCollectHandler } = load('GameServer/Server/Packet/Recv/Pet/PetCollectHandler');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-daily-sign-'));
const db = DatabaseManager.Instance;
const helper = DatabaseHelper.Instance;
const players = [];
const passed = [];
const realNow = Date.now;
let clock = Date.parse('2031-10-21T04:00:00Z') / 1000;
let uid = 970000;
Date.now = () => clock * 1000;
const catalog = JSON.parse(fs.readFileSync(path.join(app, 'config/data/json/pet-acquisition.json'), 'utf8'));
const dailyPet = catalog.exchange.petIds[0];
assert.ok(Number.isInteger(dailyPet), 'Daily sign whitelist must contain a pet');
const period = () => Math.floor((clock + 28800) / 86400) * 86400 - 28800;
async function fixture(mapID = 105) {
  const id = ++uid;
  await db.Execute('INSERT INTO players VALUES (?, 10000, 7, 123, 0, 0)', [id]);
  const player = Object.create(PlayerInstance.prototype);
  Object.defineProperty(player, 'Uid', { value: id });
  Object.defineProperty(player, 'ClientProtocol', { value: 'xin-20261013' });
  player.Data = new PlayerData(Object.assign(createDefaultPlayerInfo(id, 'DailySignSmoke'),
    { coins: 10000, gold: 7, allocatableExp: 123, mapID }));
  player.EventBus = new GameEventBus();
  player.packets = [];
  player.SendPacket = async packet => {
    player.packets.push({ command: packet.getCmdId(), result: packet.getResult(), body: packet.serialize('xin-20261013') });
  };
  player._session = { Socket: { destroyed: false }, Player: player };
  player.PetManager = new PetManager(player);
  await player.PetManager.Initialize();
  await helper.SavePetData(player.PetManager.PetData, true);
  players.push(player);
  return player;
}
async function status(player, group = 900001) {
  const body = Buffer.alloc(4); body.writeUInt32BE(group);
  await new IsCollectHandler().Handle(player.Session, {}, body);
  const packet = player.packets.at(-1);
  assert.equal(packet.command, 2313);
  return packet.body;
}
async function claim(player, petId = dailyPet) {
  const body = Buffer.alloc(8); body.writeUInt32BE(900001); body.writeUInt32BE(petId, 4);
  await new PetCollectHandler().Handle(player.Session, {}, body);
  const packet = player.packets.at(-1);
  assert.equal(packet.command, 2311);
  return packet.body.readUInt32BE(12);
}
async function saved(player) {
  const [row] = await db.Query('SELECT pet_list FROM player_pets WHERE owner_id = ?', [player.Uid]);
  const [wallet] = await db.Query('SELECT coins,gold,allocatable_exp,pet_all_num,pet_max_lev FROM players WHERE user_id = ?', [player.Uid]);
  const claims = await db.Query('SELECT reward_key,period_start,amount FROM receiver_claims WHERE owner_id = ?', [player.Uid]);
  return { pets: JSON.parse(row.pet_list), wallet, claims };
}
function decoded(body) {
  assert.equal(body.length, 12, 'Daily status must include total days');
  return [0, 4, 8].map(offset => body.readUInt32BE(offset));
}
async function run(name, scenario) {
  await scenario();
  passed.push(name);
}
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config'); ConfigLoader.Instance.Reload();
  Config.Config.database = { type: 'sqlite', path: path.join(temporary, 'sign.sqlite') };
  Config.Game.clientProtocol = 'xin-20261013';
  for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG]) {
    ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
  }
  ConfigRegistry.Instance.Register(ConfigKeys.NATURES_CONFIG, ConfigPaths[ConfigKeys.NATURES_CONFIG], ConfigType.JSON);
  ConfigRegistry.Instance.Register(ConfigKeys.PET_ABILITIES, ConfigPaths[ConfigKeys.PET_ABILITIES], ConfigType.JSON);
  await ConfigRegistry.Instance.Initialize();
  await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL,pet_all_num INTEGER NOT NULL,pet_max_lev INTEGER NOT NULL)');
  const petSQL = new (load('DataBase/migrations/scripts/012_fix_all_tables').Migration012FixAllTables)().upSQLite()
    .find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'));
  await db.Execute(petSQL);
  for (const sql of new (load('DataBase/migrations/scripts/021_create_receiver_claims').Migration021CreateReceiverClaims)().upSQLite()) await db.Execute(sql);
  await run('Existing daily record reports claimed and total without granting another pet', async () => {
    const p = await fixture();
    await db.Execute('INSERT INTO receiver_claims VALUES (?, ?, ?, ?, 1)', [p.Uid, 'signin:pet', period(), clock]);
    const before = await saved(p);
    assert.deepEqual(decoded(await status(p)), [900001, 1, 1]);
    assert.deepEqual(await saved(p), before);
    const other = await fixture();
    assert.deepEqual(decoded(await status(other)), [900001, 0, 0]);
  });
  await run('Global toolbar can claim from map 105, persist one warehouse pet, then report authoritative status', async () => {
    const p = await fixture();
    assert.equal(await claim(p), 0);
    const state = await saved(p);
    assert.deepEqual(state.pets.map(pet => [pet.petId, pet.level, pet.isInBag]), [[dailyPet, 1, false]]);
    assert.deepEqual(state.wallet, { coins: 10000, gold: 7, allocatable_exp: 123, pet_all_num: 1, pet_max_lev: 1 });
    assert.equal(state.claims.length, 1);
    const body = await status(p);
    assert.deepEqual(decoded(body), [900001, 1, 1]);
    if (evidence) {
      fs.mkdirSync(evidence, { recursive: true });
      fs.writeFileSync(path.join(evidence, 'claimed-status.bin'), body);
    }
    assert.equal(await claim(p), 5002);
    assert.deepEqual(await saved(p), state);
  });
  await run('Concurrent daily claims grant exactly once', async () => {
    const p = await fixture(30);
    await Promise.all([claim(p, dailyPet), claim(p, dailyPet)]);
    assert.deepEqual(p.packets.filter(packet => packet.command === 2311).map(packet => packet.body.readUInt32BE(12)).sort((a, b) => a - b), [0, 5002]);
    const state = await saved(p);
    assert.equal(state.pets.length, 1);
    assert.equal(state.claims.length, 1);
    assert.deepEqual(decoded(await status(p)), [900001, 1, 1]);
  });
  await run('Failed claim insert rolls back pet and wallet, leaves status unclaimed, and permits retry', async () => {
    const p = await fixture();
    const before = await saved(p);
    await db.Execute(`CREATE TRIGGER reject_daily_sign BEFORE INSERT ON receiver_claims WHEN NEW.owner_id=${p.Uid} BEGIN SELECT RAISE(ABORT,'forced claim failure'); END`);
    assert.equal(await claim(p), 5000);
    assert.deepEqual(await saved(p), before);
    assert.equal(p.PetManager.PetData.PetList.length, 0);
    assert.equal(p.Data.coins, 10000);
    assert.deepEqual(decoded(await status(p)), [900001, 0, 0]);
    await db.Execute('DROP TRIGGER reject_daily_sign');
    assert.equal(await claim(p), 0);
    assert.deepEqual(decoded(await status(p)), [900001, 1, 1]);
  });
  await run('Shanghai midnight resets today flag while retaining cumulative sign-in days', async () => {
    clock = Date.parse('2031-10-21T15:59:59Z') / 1000;
    const p = await fixture();
    assert.equal(await claim(p), 0);
    clock += 2;
    const available = await status(p);
    assert.deepEqual(decoded(available), [900001, 0, 1]);
    if (evidence) fs.writeFileSync(path.join(evidence, 'available-status.bin'), available);
    assert.equal(await claim(p), 0);
    assert.deepEqual(decoded(await status(p)), [900001, 1, 2]);
    assert.equal((await saved(p)).pets.length, 2);
  });
  await run('Every removed claim rejects without consuming daily eligibility or changing assets', async () => {
    const p = await fixture();
    const before = await saved(p);
    const policies = ['boss-routes.json','ordinary-routes.json'].map(name => require('../compat/server-patches/pet-acquisition/' + name));
    const ids = policies.flatMap(policy => policy.routes.map(route => route.petId));
    assert.equal(new Set(ids).size,538);
    for (const id of ids.filter(id => !catalog.exchange.petIds.includes(id))) assert.equal(await claim(p,id),5001,'Removed claim ' + id);
    assert.deepEqual(await saved(p), before);
    assert.deepEqual(decoded(await status(p)), [900001, 0, 0]);
    assert.equal(await claim(p), 0);
  });
  await run('Invalid catalog pet and destroyed or replaced sessions remain rejected', async () => {
    for (const kind of ['pet', 'destroyed', 'replaced']) {
      const p = await fixture();
      if (kind === 'destroyed') p.Session.Socket.destroyed = true;
      const before = await saved(p);
      const unlock = kind === 'replaced' ? await p.PetManager.PetData.AcquireMutation() : null;
      const pending = claim(p, kind === 'pet' ? 0 : dailyPet);
      if (unlock) { p.Session.Player = {}; unlock(); }
      assert.equal(await pending, 5001);
      assert.deepEqual(await saved(p), before);
    }
  });
  await run('Legacy collection group keeps its existing eight-byte status protocol', async () => {
    const p = await fixture();
    assert.deepEqual(await status(p, 1), Buffer.from([0, 0, 0, 1, 0, 0, 0, 0]));
    await db.Execute('INSERT INTO player_collect_claims VALUES (?, 1)', [p.Uid]);
    assert.deepEqual(await status(p, 1), Buffer.from([0, 0, 0, 1, 0, 0, 0, 1]));
  });
  const result = { passed: passed.length, scenarios: passed, database: 'temporary-only', liveWrites: false };
  if (evidence) fs.writeFileSync(path.join(evidence, 'server-smoke.json'), JSON.stringify(result, null, 2) + '\n');
  console.log('DAILY_SIGN_SMOKE=' + JSON.stringify(result));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  Date.now = realNow;
  for (const player of players) { player.Data.cleanup(); helper.RemoveCache(player.Uid); player.EventBus.Destroy(); }
  await new Promise(resolve => setTimeout(resolve, 300));
  await DataSaver.Instance.WaitForSaves();
  await db.WithConnection(async () => {});
  await db.Shutdown();
  fs.rmSync(temporary, { recursive: true, force: true });
});
