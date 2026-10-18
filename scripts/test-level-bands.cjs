'use strict';
// Read the patched pools through the deployed config loader and spawn manager; temporary SQLite only.
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const app = path.resolve(process.argv[2]);
const plan = JSON.parse(fs.readFileSync(path.join(__dirname, '../compat/server-patches/level-bands/level-bands.json'), 'utf8'));
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const {Config} = load('shared/config/ServerConfig');
const {ConfigLoader} = load('shared/config/ConfigLoader');
const {ConfigRegistry} = load('shared/config/ConfigRegistry');
const {ConfigKeys, ConfigPaths, ConfigType} = load('shared/config/ConfigDefinitions');
const {GameConfig} = load('shared/config/game/GameConfig');
const {DatabaseManager} = load('DataBase/DatabaseManager');
const {PlayerData} = load('DataBase/models/PlayerData');
const {PlayerInstance} = load('GameServer/Game/Player/PlayerInstance');
const {MapSpawnManager} = load('GameServer/Game/Map/MapSpawnManager');
const {createDefaultPlayerInfo} = load('shared/models/PlayerModel');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-level-bands-'));
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config'); ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'bands.sqlite')};
  for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
  for (const key of [ConfigKeys.MAP_OGRES, ConfigKeys.BOSS_ABILITIES]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.JSON);
  await ConfigRegistry.Instance.Initialize(); await DatabaseManager.Instance.Initialize();
  const player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid: 422001, Data: new PlayerData(createDefaultPlayerInfo(422001, 'BandSmoke'))});
  const spawns = new MapSpawnManager(player);
  let checked = 0;
  for (const band of plan.bands) {
    for (const mapId of Object.keys(band.maps).map(Number)) {
      const ogres = GameConfig.GetMapConfigById(mapId).ogres;
      for (const ogre of ogres) {
        assert.ok(band.min <= ogre.minLevel && ogre.minLevel <= ogre.maxLevel && ogre.maxLevel <= band.max,
          `${band.name} map ${mapId} pet ${ogre.petId} level ${ogre.minLevel}-${ogre.maxLevel}`);
        checked++;
      }
      spawns.OnEnterMap(mapId);
      assert.ok(spawns.GetMapOgres(mapId).some(o => o.petId), `Map ${mapId} spawns nothing`);
    }
  }
  console.log('LEVEL_BANDS_SMOKE=' + JSON.stringify({bands: plan.bands.length, entries: checked, database: 'temporary-only'}));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await DatabaseManager.Instance.Shutdown(); fs.rmSync(temporary, {recursive: true, force: true}); process.exit(process.exitCode || 0);
});
