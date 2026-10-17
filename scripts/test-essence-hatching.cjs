'use strict';
// Runs the release handlers, models and SQLite driver against a disposable database.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const [appArgument, releaseArgument] = process.argv.slice(2);
if (!appArgument || !releaseArgument) throw new Error('Usage: node test-essence-hatching.cjs APP RELEASE');
const app = path.resolve(appArgument), release = path.resolve(releaseArgument);
process.chdir(app);
function load(relative) {return require(path.join(app, 'dist', relative));}
function overlay(relative, dependencies = {}) {
  const filename = path.join(app, 'dist', relative);
  const module = new Module(filename);
  module.filename = filename;
  module.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = module.require.bind(module);
  module.require = request => Object.hasOwn(dependencies, request) ? dependencies[request] : originalRequire(request);
  module._compile(fs.readFileSync(path.join(release, 'app/dist', relative), 'utf8'), filename);
  return module.exports;
}
load('DataBase/loaders/DataLoader');
const {Config} = load('shared/config/ServerConfig');
const {ConfigLoader} = load('shared/config/ConfigLoader');
const {ConfigRegistry} = load('shared/config/ConfigRegistry');
const {ConfigKeys, ConfigPaths, ConfigType} = load('shared/config/ConfigDefinitions');
const {DatabaseManager} = load('DataBase/DatabaseManager');
const {DatabaseHelper} = load('DataBase/DatabaseHelper');
const {PlayerInstance} = load('GameServer/Game/Player/PlayerInstance');
const {PlayerData} = load('DataBase/models/PlayerData');
const {PetManager} = load('GameServer/Game/Pet/PetManager');
const {ItemManager} = load('GameServer/Game/Item/ItemManager');
const {GameEventBus} = load('GameServer/Game/Event/GameEventBus');
const {PetEventType} = load('GameServer/Game/Event/EventTypes');
const {PetReleaseHandler} = load('GameServer/Server/Packet/Recv/Pet/PetReleaseHandler');
const {createDefaultPetInfo} = load('shared/models/PetModel');
const {createDefaultPlayerInfo} = load('shared/models/PlayerModel');
const service = overlay('GameServer/Game/Pet/EssenceHatching.js');
const {PetHatchHandler, PetHatchGetHandler} = overlay('GameServer/Server/Packet/Recv/Pet/PetHatchHandlers.js', {'../../../../Game/Pet/EssenceHatching': service});
const {Migration024CreateEssenceHatches} = overlay('DataBase/migrations/scripts/024_create_essence_hatches.js');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-essence-hatching-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance, players = [], results = [];
const realNow = Date.now;
let clock = 1900000000, nextUid = 301700;
Date.now = () => clock * 1000;
function clean(player) {
  player.Data.cleanup();
  helper.RemoveCache(player.Uid);
}
async function playerFor(uid, superNono = false) {
  const player = Object.create(PlayerInstance.prototype);
  const packets = [], obtained = [];
  Object.assign(player, {Uid: uid, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'HatchSmoke'), {hasNono: true, superNono})),
    EventBus: new GameEventBus(), SendPacket: async packet => {packets.push({command: packet.getCmdId(), result: packet.getResult(), body: packet.serialize('xin-20261013')});}});
  player._session = {Socket: {destroyed: false}, Player: player};
  player.PetManager = new PetManager(player); player.ItemManager = new ItemManager(player);
  await player.PetManager.Initialize(); await player.ItemManager.Initialize();
  player.EventBus.On(PetEventType.PET_OBTAINED, event => {obtained.push(event);});
  Object.assign(player, {packets, obtained});
  players.push(player);
  return player;
}
async function fixture(options = {}) {
  const uid = ++nextUid;
  await db.Execute('INSERT INTO players VALUES (?, 0, 0)', [uid]);
  const player = await playerFor(uid, !!options.superNono);
  player.ItemManager.ItemData.ItemList = [{itemId: 400103, count: options.stock ?? 2, expireTime: 0}, {itemId: 300001, count: 7, expireTime: 0}];
  player.PetManager.PetData.PetList = Array.from({length: options.bagSize ?? 1}, (_, index) =>
    Object.assign(createDefaultPetInfo(uid, 7), {catchTime: clock - 100 - index, isInBag: true, isDefault: index === 0, level: 40, nick: 'ExistingPet'}));
  await helper.SaveItemData(player.ItemManager.ItemData, true);
  await helper.SavePetData(player.PetManager.PetData, true);
  await db.Execute('UPDATE players SET pet_all_num = ?, pet_max_lev = 40 WHERE user_id = ?', [player.PetManager.PetData.PetList.length, uid]);
  return player;
}
async function state(player) {
  await new PetHatchGetHandler().Handle({Player: player}, {}, Buffer.alloc(0));
  const packet = player.packets.at(-1);
  assert.equal(packet.command, 2316); assert.equal(packet.result, 0); assert.equal(packet.body.length, 16);
  return Array.from({length: 4}, (_, index) => packet.body.readUInt32BE(index * 4));
}
async function start(player, itemId = 400103) {
  const body = Buffer.alloc(4); body.writeUInt32BE(itemId);
  await new PetHatchHandler().Handle({Player: player}, {}, body);
  return player.packets.at(-1);
}
async function saved(player) {
  const [stock] = await db.Query('SELECT item_list FROM player_items WHERE owner_id = ?', [player.Uid]);
  const [pets] = await db.Query('SELECT pet_list FROM player_pets WHERE owner_id = ?', [player.Uid]);
  const jobs = await db.Query('SELECT * FROM player_essence_hatches WHERE owner_id = ?', [player.Uid]);
  return {items: JSON.parse(stock.item_list), pets: JSON.parse(pets.pet_list), jobs};
}
async function run(name, work) {
  clock += 10000;
  const before = players.length;
  try {await work(); results.push(name);}
  finally {for (const player of players.slice(before)) clean(player);}
}
(async () => {
  Config.Config.database = {type: 'sqlite', path: path.join(directory, 'hatching.sqlite')};
  Config.Game.clientProtocol = 'xin-20261013';
  for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG, ConfigKeys.ITEM_CONFIG]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
  ConfigRegistry.Instance.Register(ConfigKeys.NATURES_CONFIG, ConfigPaths[ConfigKeys.NATURES_CONFIG], ConfigType.JSON);
  await ConfigRegistry.Instance.Initialize();
  ConfigLoader.Instance._configCache.set('data/json/essence-hatching.json', JSON.parse(fs.readFileSync(path.join(release, 'app/config/data/json/essence-hatching.json'))));
  await db.Initialize();
  await db.Execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY, pet_all_num INTEGER NOT NULL, pet_max_lev INTEGER NOT NULL)');
  const petSQL = new (load('DataBase/migrations/scripts/012_fix_all_tables').Migration012FixAllTables)().upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'));
  await db.Execute(petSQL);
  for (const sql of new (load('DataBase/migrations/scripts/006_create_items').Migration006CreateItems)().upSQLite()) await db.Execute(sql);
  for (const sql of new Migration024CreateEssenceHatches().upSQLite()) await db.Execute(sql);

  await run('empty native 2316 response', async () => {const p = await fixture(); assert.deepEqual(await state(p), [0, 0, 0, 0]);});
  for (const superNono of [false, true]) await run((superNono ? 'super' : 'ordinary') + ' NoNo: 1800 seconds, early query, mature claim, repeat query', async () => {
    const p = await fixture({superNono});
    const packet = await start(p); assert.equal(packet.result, 0); assert.equal(packet.body.readUInt32BE(0), 1800);
    assert.deepEqual(await state(p), [1, 1800, 70, 0]);
    let stored = await saved(p); assert.equal(stored.items.find(i => i.itemId === 400103).count, 1); assert.equal(stored.jobs[0].ready_at, clock + 1800);
    clock += 1799; assert.deepEqual(await state(p), [1, 1, 70, 0]);
    clock++; assert.deepEqual(await state(p), [1, 0, 70, clock]);
    stored = await saved(p);
    assert.equal(stored.pets.length, 2); assert.equal(stored.jobs.length, 0); assert.equal(p.obtained.length, 1);
    const pet = stored.pets.find(pet => pet.catchTime === clock);
    assert.equal(pet.petId, 70); assert.equal(pet.level, 1); assert.equal(pet.isInBag, false);
    assert.equal(pet.hp, pet.maxHp); assert.ok(pet.hp > 0); assert.ok(pet.skillArray.every(id => pet.skillPP[id] > 0));
    assert.deepEqual(await state(p), [0, 0, 0, 0]); assert.equal((await saved(p)).pets.length, 2);
  });
  await run('relogin and database reconnect preserve absolute ready time', async () => {
    let p = await fixture(); const uid = p.Uid; await start(p); clock += 600; clean(p);
    await db.Shutdown(); await db.Initialize();
    p = await playerFor(uid);
    assert.deepEqual(await state(p), [1, 1200, 70, 0]); clock += 1200;
    assert.deepEqual(await state(p), [1, 0, 70, clock]); assert.equal((await saved(p)).pets.length, 2);
  });
  await run('concurrent starts consume one essence', async () => {
    const p = await fixture(); await Promise.all([start(p), start(p)]);
    assert.deepEqual(p.packets.map(packet => packet.result).sort(), [0, 5002]);
    const stored = await saved(p); assert.equal(stored.jobs.length, 1); assert.equal(stored.items.find(i => i.itemId === 400103).count, 1);
  });
  await run('concurrent mature queries grant one pet', async () => {
    const p = await fixture(); await start(p); clock += 1800;
    const answers = await Promise.all([new service.EssenceHatching(p).Get(), new service.EssenceHatching(p).Get()]);
    assert.equal(answers.filter(answer => answer.catchTime === clock).length, 1);
    assert.equal((await saved(p)).pets.length, 2); assert.equal(p.obtained.length, 1);
  });
  await run('last essence removed without changing other stock', async () => {
    const p = await fixture({stock: 1}); await start(p);
    const stored = await saved(p); assert.equal(stored.items.some(i => i.itemId === 400103), false);
    assert.equal(stored.items.find(i => i.itemId === 300001).count, 7);
  });
  await run('missing essence and non-essence rejected without debit', async () => {
    const p = await fixture({stock: 0});
    assert.equal((await start(p)).result, 5001); assert.equal((await start(p, 300001)).result, 5001);
    const stored = await saved(p); assert.equal(stored.jobs.length, 0); assert.equal(stored.items.find(i => i.itemId === 300001).count, 7);
  });
  await run('NoNo required for start and state', async () => {
    const p = await fixture(); p.Data.hasNono = false;
    assert.equal((await start(p)).result, 5001);
    await new PetHatchGetHandler().Handle({Player: p}, {}, Buffer.alloc(0));
    assert.equal(p.packets.at(-1).result, 5001); assert.equal((await saved(p)).jobs.length, 0);
  });
  await run('malformed wire bodies rejected before writes', async () => {
    const p = await fixture();
    await new PetHatchHandler().Handle({Player: p}, {}, Buffer.alloc(3)); assert.equal(p.packets.at(-1).result, 5001);
    await new PetHatchGetHandler().Handle({Player: p}, {}, Buffer.alloc(4)); assert.equal(p.packets.at(-1).result, 5001);
    assert.equal((await saved(p)).jobs.length, 0);
  });
  await run('failed start rolls back job and inventory', async () => {
    const p = await fixture();
    await db.Execute(`CREATE TRIGGER reject_hatch_start BEFORE UPDATE ON player_items WHEN NEW.owner_id = ${p.Uid} BEGIN SELECT RAISE(ABORT, 'forced start failure'); END`);
    assert.equal((await start(p)).result, 5000);
    const stored = await saved(p); assert.equal(stored.jobs.length, 0); assert.equal(stored.items.find(i => i.itemId === 400103).count, 2);
    assert.equal(p.ItemManager.ItemData.GetItemCount(400103), 2);
    await db.Execute('DROP TRIGGER reject_hatch_start'); assert.equal((await start(p)).result, 0);
  });
  await run('failed claim rolls back pet and job, then retries', async () => {
    const p = await fixture(); await start(p); clock += 1800;
    await db.Execute(`CREATE TRIGGER reject_hatch_claim BEFORE UPDATE ON players WHEN NEW.user_id = ${p.Uid} BEGIN SELECT RAISE(ABORT, 'forced claim failure'); END`);
    await new PetHatchGetHandler().Handle({Player: p}, {}, Buffer.alloc(0)); assert.equal(p.packets.at(-1).result, 5000);
    const stored = await saved(p); assert.equal(stored.pets.length, 1); assert.equal(stored.jobs.length, 1);
    assert.equal(p.PetManager.PetData.PetList.length, 1); assert.equal(p.obtained.length, 0);
    await db.Execute('DROP TRIGGER reject_hatch_claim'); assert.deepEqual(await state(p), [1, 0, 70, clock]);
  });
  await run('pending cached stock and pet edits survive incubation writes', async () => {
    const p = await fixture();
    p.ItemManager.ItemData.ItemList.find(item => item.itemId === 300001).count = 9;
    await start(p); assert.equal((await saved(p)).items.find(item => item.itemId === 300001).count, 9);
    p.PetManager.PetData.PetList[0].nick = 'UnsavedNickname'; clock += 1800; await state(p);
    assert.equal((await saved(p)).pets[0].nick, 'UnsavedNickname');
  });
  await run('full bag receives hatched pet in storage', async () => {
    const p = await fixture({bagSize: 6}); await start(p); clock += 1800; await state(p);
    const stored = await saved(p); assert.equal(stored.pets.length, 7); assert.equal(stored.pets.filter(pet => pet.isInBag).length, 6);
    assert.equal(stored.pets.find(pet => pet.catchTime === clock).isInBag, false);
  });
  await run('native 2304 takes committed hatch from storage into bag', async () => {
    const p = await fixture(); await start(p); clock += 1800; await state(p);
    const body = Buffer.alloc(8); body.writeUInt32BE(clock); body.writeUInt32BE(1, 4);
    await new PetReleaseHandler().Handle({Player: p}, {}, body);
    assert.equal((await saved(p)).pets.find(pet => pet.catchTime === clock).isInBag, true);
  });
  await run('identity collision preserves mature job until next second', async () => {
    const p = await fixture(); await start(p); clock += 1800;
    p.PetManager.PetData.PetList[0].catchTime = clock; await helper.SavePetData(p.PetManager.PetData, true);
    await assert.rejects(new service.EssenceHatching(p).Get(), /identity already in use/);
    assert.equal((await saved(p)).jobs.length, 1); assert.equal((await saved(p)).pets.length, 1);
    clock++; assert.deepEqual(await state(p), [1, 0, 70, clock]);
  });
  await run('incubation belongs only to its player', async () => {
    const first = await fixture(), second = await fixture(); await start(first);
    assert.deepEqual(await state(second), [0, 0, 0, 0]); assert.equal((await saved(second)).items.find(item => item.itemId === 400103).count, 2);
  });
  console.log('ESSENCE_HATCHING_SMOKE=' + JSON.stringify({database: 'disposable SQLite only', passed: results.length, cases: results}));
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(async () => {
  Date.now = realNow;
  for (const player of players) clean(player);
  await db.Shutdown(); fs.rmSync(directory, {recursive: true, force: true});
  process.exit(process.exitCode || 0);
});
