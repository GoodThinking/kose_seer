'use strict';
// Drive the deployed spawn manager over the patched pools; temporary SQLite only, no live account.
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const app = path.resolve(process.argv[2]);
const plan = JSON.parse(fs.readFileSync(path.join(__dirname, '../compat/server-patches/evolved-encounters/evolved-additions.json'), 'utf8'));
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const {Config} = load('shared/config/ServerConfig');
const {ConfigLoader} = load('shared/config/ConfigLoader');
const {ConfigRegistry} = load('shared/config/ConfigRegistry');
const {ConfigKeys, ConfigPaths, ConfigType} = load('shared/config/ConfigDefinitions');
const {DatabaseManager} = load('DataBase/DatabaseManager');
const {PlayerData} = load('DataBase/models/PlayerData');
const {PlayerInstance} = load('GameServer/Game/Player/PlayerInstance');
const {MapSpawnManager} = load('GameServer/Game/Map/MapSpawnManager');
const {createDefaultPlayerInfo} = load('shared/models/PlayerModel');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-evolved-encounters-'));
const realRandom = Math.random;
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config'); ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'spawn.sqlite')};
  for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
  for (const key of [ConfigKeys.MAP_OGRES, ConfigKeys.BOSS_ABILITIES]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.JSON);
  await ConfigRegistry.Instance.Initialize(); await DatabaseManager.Instance.Initialize();
  const player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid: 420001, Data: new PlayerData(createDefaultPlayerInfo(420001, 'SpawnSmoke'))});
  const spawns = new MapSpawnManager(player);
  const seen = mapId => {
    const ids = new Set();
    for (let step = 0; step < 200; step++) {
      Math.random = () => step / 200;
      spawns.OnEnterMap(mapId);
      for (const ogre of spawns.GetMapOgres(mapId)) if (ogre.petId) ids.add(ogre.petId);
    }
    Math.random = realRandom;
    return ids;
  };
  const added = [...plan.restore, ...plan.dexAdditions];
  const byMap = new Map();
  for (const x of added) byMap.set(x.mapId, [...(byMap.get(x.mapId) ?? []), x.entry.petId]);
  for (const [mapId, ids] of byMap) {
    const emitted = seen(mapId);
    for (const id of ids) assert.ok(emitted.has(id), `Map ${mapId} never spawns ${id}`);
  }
  for (const r of plan.remove) assert.ok(!seen(r.mapId).has(r.petId), `Map ${r.mapId} still spawns removed ${r.petId}`);
  console.log('EVOLVED_SPAWN_SMOKE=' + JSON.stringify({maps: byMap.size, entries: added.length, removed: plan.remove.length, database: 'temporary-only'}));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  Math.random = realRandom; await DatabaseManager.Instance.Shutdown(); fs.rmSync(temporary, {recursive: true, force: true}); process.exit(process.exitCode || 0);
});
