'use strict';
// 巨石星 and 艾伦星 wild pets through the real spawn manager and BattleManager on a temporary database (never a live account).
// Usage: node scripts/test-spiral-galaxy.cjs <runtime app dir with dist/config/node_modules>
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const app = path.resolve(process.argv[2]);
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const {Logger, LogLevel} = load('shared/utils/Logger');
Logger.SetMinLevel(LogLevel.Error);
const {Config} = load('shared/config/ServerConfig');
const {ConfigLoader} = load('shared/config/ConfigLoader');
const {ConfigRegistry} = load('shared/config/ConfigRegistry');
const {ConfigKeys, ConfigPaths, ConfigType} = load('shared/config/ConfigDefinitions');
const {SkillEffectsConfig} = load('shared/config/game/SkillEffectsConfig');
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

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-spiral-galaxy-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
const realRandom = Math.random;
let player;
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'spiral.sqlite')};
  Config.Game.clientProtocol = 'xin-20261013';
  for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG, ConfigKeys.ITEM_CONFIG]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
  for (const key of [ConfigKeys.NATURES_CONFIG, ConfigKeys.MAP_OGRES, ConfigKeys.BOSS_ABILITIES, ConfigKeys.PET_ABILITIES, ConfigKeys.ELEMENTS_CONFIG, ConfigKeys.SKILL_EFFECTS_V2]) if (key) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.JSON);
  await ConfigRegistry.Instance.Initialize();
  await SkillEffectsConfig.Instance.Load();
  await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL,pet_all_num INTEGER NOT NULL,pet_max_lev INTEGER NOT NULL)');
  const petSQL = new (load('DataBase/migrations/scripts/012_fix_all_tables').Migration012FixAllTables)().upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'));
  await db.Execute(petSQL);
  for (const sql of new (load('DataBase/migrations/scripts/006_create_items').Migration006CreateItems)().upSQLite()) await db.Execute(sql);
  const uid = 417072, now = Math.floor(Date.now() / 1000);
  await db.Execute('INSERT INTO players VALUES (?, 10000, 7, 123, 1, 100)', [uid]);
  const packets = [];
  player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid: uid, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'SpiralGalaxy'), {coins: 10000, mapID: 925})),
    EventBus: new GameEventBus(), SendPacket: async packet => { packets.push({command: packet.getCmdId(), result: packet.getResult()}); }});
  player._session = {Socket: {destroyed: false}, Player: player};
  player.ChallengeProgressManager = {HasDefeatedSPTBoss: () => false, GetPuniLevel: () => 0};
  player.PetManager = new PetManager(player);
  player.ItemManager = new ItemManager(player);
  player.MapSpawnManager = new MapSpawnManager(player);
  player.BattleManager = new BattleManager(player);
  await player.PetManager.Initialize();
  await player.ItemManager.Initialize();
  const pet = Object.assign(createDefaultPetInfo(uid, 70), {level: 100, catchTime: now - 100, isInBag: true, isDefault: true, skillArray: [10006]});
  PetCalculator.UpdatePetStats(pet);
  player.PetManager.PetData.PetList = [pet];
  await helper.SavePetData(player.PetManager.PetData, true);
  const results = [];
  const spawns = mapId => {
    const seen = new Set();
    for (let step = 0; step < 100; step++) {
      Math.random = () => step / 100;
      player.MapSpawnManager.OnEnterMap(mapId);
      for (const ogre of player.MapSpawnManager.GetMapOgres(mapId)) if (ogre.petId) seen.add(ogre.originalPetId || ogre.petId);
    }
    Math.random = realRandom;
    return seen;
  };

  // 图鉴：吉塔 702→925、列特/凯拉 704、阿凯 706、森卡尔 708、安普 709；塔塔 29→926、沃沃尔 712、朵莉 713、努努 718
  const EXPECTED = {925: [1090, 1091], 704: [1094, 1096], 706: [1100], 708: [1112], 709: [1118],
    926: [1112, 872, 874, 1128], 712: [1135], 713: [1139], 718: [1150]};
  for (const [mapId, pets] of Object.entries(EXPECTED)) {
    const seen = spawns(+mapId);
    for (const petId of pets) assert.ok(seen.has(petId), `Map ${mapId} never spawns ${petId}`);
  }
  results.push('Every handbook pet spawns on its map');

  const ogres = JSON.parse(fs.readFileSync(path.join(app, 'config/data/json/map-ogres.json'), 'utf8')).maps;
  assert.equal(ogres['702'], undefined, 'old 巨石岛 pool moved');
  assert.equal(ogres['29'], undefined, 'old 浅滩海岛 pool moved');
  assert.deepEqual([ogres['925'].name, ogres['926'].name], ['巨石岛', '浅滩海岛']);
  results.push('702 and 29 pools now live on 925 and 926');

  for (const [mapId, petId, min, max] of [[926, 1128, 30, 35], [704, 1096, 60, 63], [718, 1150, 30, 35]]) {
    player.Data.mapID = mapId;
    let index = -1;
    for (let step = 0; step < 100 && index < 0; step++) {
      Math.random = () => step / 100;
      player.MapSpawnManager.OnEnterMap(mapId);
      index = player.MapSpawnManager.GetMapOgres(mapId).findIndex(o => o.petId === petId);
    }
    Math.random = realRandom;
    assert.ok(index >= 0, `${petId} in the spawn list of ${mapId}`);
    player.BattleManager.CleanupBattle();
    packets.length = 0;
    await player.BattleManager.HandleFightNpcMonster(index);
    const battle = player.BattleManager.GetCurrentBattle();
    assert.equal(battle?.enemy.id, petId, `wild battle against ${petId}`);
    assert.ok(battle.enemy.level >= min && battle.enemy.level <= max, `${petId} level ${battle.enemy.level}`);
    player.BattleManager.CleanupBattle();
  }
  results.push('Wild battles start against 塔塔, 凯拉 and 努努 at their levels');

  console.log(JSON.stringify({passed: results.length, results, database: 'temporary-only'}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  Math.random = realRandom;
  if (player) { player.BattleManager.CleanupBattle(); player.Data.cleanup(); helper.RemoveCache(player.Uid); }
  await db.Shutdown();
  fs.rmSync(temporary, {recursive: true, force: true});
  process.exit(process.exitCode || 0);
});
