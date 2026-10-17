'use strict';
// Exercise the deployed managers and a temporary SQLite database, never a live account.
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const app = path.resolve(process.argv[2]);
const additions = JSON.parse(fs.readFileSync(path.join(__dirname, '../compat/server-patches/acquisition-expansion/wild-additions.json'), 'utf8')).additions;
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
const {PetManager} = load('GameServer/Game/Pet/PetManager');
const {ItemManager} = load('GameServer/Game/Item/ItemManager');
const {MapSpawnManager} = load('GameServer/Game/Map/MapSpawnManager');
const {BattleManager} = load('GameServer/Game/Battle/BattleManager');
const {GameEventBus} = load('GameServer/Game/Event/GameEventBus');
const {createDefaultPetInfo} = load('shared/models/PetModel');
const {createDefaultPlayerInfo} = load('shared/models/PlayerModel');
const {PetCalculator} = load('GameServer/Game/Pet/PetCalculator');
const {SptSystem} = load('GameServer/Game/Pet/SptSystem');
const {PetCollectHandler} = load('GameServer/Server/Packet/Recv/Pet/PetCollectHandler');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-acquisition-expansion-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance, players = [], results = [];
const realRandom = Math.random;
let uid = 418000;
async function fixture(coins) {
  const id = ++uid;
  await db.Execute('INSERT INTO players VALUES (?, ?, 7, 123, 1, 40)', [id, coins]);
  const player = Object.create(PlayerInstance.prototype), packets = [];
  Object.assign(player, {Uid: id, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(id, 'ExpansionSmoke'), {coins, gold: 7, allocatableExp: 123, mapID: 5})),
    EventBus: new GameEventBus(), SendPacket: async packet => {packets.push({command: packet.getCmdId(), body: packet.serialize('xin-20261013')});}});
  player._session = {Socket: {destroyed: false}, Player: player};
  player.PetManager = new PetManager(player); player.ItemManager = new ItemManager(player);
  player.MapSpawnManager = new MapSpawnManager(player); player.BattleManager = new BattleManager(player);
  await player.PetManager.Initialize(); await player.ItemManager.Initialize();
  const pet = Object.assign(createDefaultPetInfo(id, 7), {level: 40, catchTime: 1950000000, isInBag: true, isDefault: true, skillArray: [10001]});
  PetCalculator.UpdatePetStats(pet);
  player.PetManager.PetData.PetList = [pet];
  await helper.SavePetData(player.PetManager.PetData, true);
  await helper.SaveItemData(player.ItemManager.ItemData, true);
  Object.assign(player, {packets}); players.push(player);
  return player;
}
async function saved(player) {
  const [pets] = await db.Query('SELECT pet_list FROM player_pets WHERE owner_id = ?', [player.Uid]);
  const [wallet] = await db.Query('SELECT coins FROM players WHERE user_id = ?', [player.Uid]);
  return {pets: JSON.parse(pets.pet_list), coins: wallet.coins};
}
async function exchange(player, petId) {
  const body = Buffer.alloc(8); body.writeUInt32BE(900001); body.writeUInt32BE(petId, 4);
  await new PetCollectHandler().Handle(player.Session, {}, body);
  return player.packets.at(-1).body;
}
async function run(name, fn) {
  try { await fn(); results.push(name); }
  finally { Math.random = realRandom; }
}
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config'); ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'expansion.sqlite')};
  Config.Game.clientProtocol = 'xin-20261013';
  for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG, ConfigKeys.ITEM_CONFIG]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
  for (const key of [ConfigKeys.NATURES_CONFIG, ConfigKeys.MAP_OGRES, ConfigKeys.BOSS_ABILITIES, ConfigKeys.PET_ABILITIES, ConfigKeys.ELEMENTS_CONFIG]) if (key) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.JSON);
  await ConfigRegistry.Instance.Initialize(); await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL,pet_all_num INTEGER NOT NULL,pet_max_lev INTEGER NOT NULL)');
  await db.Execute(new (load('DataBase/migrations/scripts/012_fix_all_tables').Migration012FixAllTables)().upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets')));
  for (const sql of new (load('DataBase/migrations/scripts/006_create_items').Migration006CreateItems)().upSQLite()) await db.Execute(sql);
  const catalog = ConfigLoader.Instance.LoadJson('data/json/pet-acquisition.json').exchange;

  await run('The real spawn manager emits every dex-located addition on its map', async () => {
    const p = await fixture(0);
    for (const entry of additions) {
      const seen = new Set();
      for (let step = 0; step < 100; step++) {
        Math.random = () => step / 100;
        p.MapSpawnManager.OnEnterMap(entry.mapId);
        for (const ogre of p.MapSpawnManager.GetMapOgres(entry.mapId)) if (ogre.petId) seen.add(ogre.petId);
      }
      assert.ok(seen.has(entry.petId), `Map ${entry.mapId} never spawns ${entry.petId}`);
    }
  });
  await run('Every exchange pet has level-1 moves', async () => {
    const empty = catalog.petIds.filter(id => SptSystem.GetDefaultSkills(id, 1).length === 0);
    assert.deepEqual(empty, [], 'Exchange pets without level-1 moves');
  });
  await run('Every catalog pet exchanges into storage at level 1 for exactly 1000 coins', async () => {
    const p = await fixture(1000 * catalog.petIds.length + 500);
    for (const id of catalog.petIds) {
      const response = await exchange(p, id);
      assert.equal(response.readUInt32BE(12), 0, 'Exchange failed for ' + id);
      assert.equal(response.readUInt32BE(0), id);
    }
    const state = await saved(p);
    assert.deepEqual(state.pets.slice(1).map(pet => pet.petId), catalog.petIds);
    assert.ok(state.pets.slice(1).every(pet => pet.level === 1 && !pet.isInBag && pet.skillArray.length > 0));
    assert.equal(state.coins, 500);
  });
  await run('Wild-only pets and off-map requests are rejected without a grant', async () => {
    for (const [mapId, id] of [[5, 787], [5, 861], [21, 1192]]) {
      const p = await fixture(10000); p.Data.mapID = mapId; const before = await saved(p);
      assert.equal((await exchange(p, id)).readUInt32BE(12), 5001);
      assert.deepEqual(await saved(p), before);
    }
  });
  console.log('EXPANSION_SMOKE=' + JSON.stringify({passed: results.length, results, additions: additions.length, exchangePets: catalog.petIds.length, database: 'temporary-only'}));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  Math.random = realRandom; for (const player of players) { player.Data.cleanup(); helper.RemoveCache(player.Uid); }
  await db.Shutdown(); fs.rmSync(temporary, {recursive: true, force: true}); process.exit(process.exitCode || 0);
});
