'use strict';
// Drive the deployed spawn manager with seeded randomness; temporary SQLite only, no live account.
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
const {PlayerData} = load('DataBase/models/PlayerData');
const {PlayerInstance} = load('GameServer/Game/Player/PlayerInstance');
const {MapSpawnManager} = load('GameServer/Game/Map/MapSpawnManager');
const {createDefaultPlayerInfo} = load('shared/models/PlayerModel');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-wild-refresh-'));
const realRandom = Math.random, results = [];
const seeded = seed => () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const manager = () => {
  const player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid: 421001, Data: new PlayerData(createDefaultPlayerInfo(421001, 'RefreshSmoke'))});
  return new MapSpawnManager(player);
};
const visible = spawns => spawns._ogres.map(o => [o.slot, o.petId, o.shiny]);
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config'); ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'refresh.sqlite')};
  for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
  for (const key of [ConfigKeys.MAP_OGRES, ConfigKeys.BOSS_ABILITIES]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.JSON);
  await ConfigRegistry.Instance.Initialize(); await DatabaseManager.Instance.Initialize();

  // 1. Fighting one of several ogres redraws the whole pool from the configured map.
  const spawns = manager(), fresh = manager();
  Math.random = seeded(7); spawns.OnEnterMap(494);
  assert.ok(spawns._ogres.length >= 2, 'Need several ogres on 麦兹星');
  Math.random = seeded(99); spawns.OnBattleEnd(spawns._ogres[0].slot);
  Math.random = seeded(99); fresh._currentMapId = 494; const expected = fresh.GenerateOgres(494).map(o => [o.slot, o.petId, o.shiny]);
  assert.deepEqual(visible(spawns), expected, 'The pool was not redrawn after the battle');
  results.push('A finished wild battle redraws the pool');

  // 2. Station bosses keep the injector damage when an ordinary ogre battle ends.
  const ids = Object.keys(ConfigLoader.Instance.LoadJson('data/json/map-ogres.json').maps).map(Number);
  let found = null;
  for (const mapId of ids) {
    const probe = manager();
    Math.random = seeded(mapId); probe.OnEnterMap(mapId);
    if (probe._bosses.length && probe._ogres.length >= 2) { found = {mapId, probe}; break; }
  }
  if (found) {
    const {mapId, probe} = found, region = probe._bosses[0].region;
    const hit = probe.HitBoss(mapId, region, 20);
    probe.OnBattleEnd(probe._ogres[0].slot);
    assert.equal(probe.GetMapBosses(mapId).find(b => b.region === region).hp, hit.hp, 'Boss HP reset by an ordinary battle');
    results.push(`Station boss HP survives an ordinary battle (map ${mapId})`);
  } else results.push('No map with both station bosses and ogres; boss check skipped');

  // 3. Clearing the last ogre still re-enters the map as before.
  const last = manager();
  Math.random = seeded(3); last.OnEnterMap(494);
  last._ogres = last._ogres.slice(0, 1);
  Math.random = seeded(5); last.OnBattleEnd(last._ogres[0].slot);
  assert.ok(last._ogres.length >= 1 && last._enterTime > 0, 'Empty map was not refreshed');
  results.push('Clearing the last ogre re-enters the map');
  console.log('WILD_REFRESH_SMOKE=' + JSON.stringify({passed: results.length, results, database: 'temporary-only'}));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  Math.random = realRandom; await DatabaseManager.Instance.Shutdown(); fs.rmSync(temporary, {recursive: true, force: true}); process.exit(process.exitCode || 0);
});
