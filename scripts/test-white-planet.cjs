'use strict';
// 裂空星系 bosses on their original maps through BattleManager on a temporary database (never a live account):
// 卡修斯 at 炫彩山山脚 445, 德拉萨 at 怀特矿场 486, 迪符特 at 山神圣殿 450 (SPT ids 57/58/59 unchanged); 怀特星 484 has none.
// Usage: node scripts/test-white-planet.cjs <runtime app dir with dist/config/node_modules>
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const app = path.resolve(process.argv[2]);
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const {Logger, LogLevel} = load('shared/utils/Logger');
Logger.SetMinLevel(process.env.SIM_LOG ? LogLevel.Info : LogLevel.Error);
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
const ALERT = 80002, CHANGE_PET = 2407;

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-white-planet-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
let player;
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'white.sqlite')};
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
  const uid = 417067, now = Math.floor(Date.now() / 1000);
  await db.Execute('INSERT INTO players VALUES (?, 10000, 7, 123, 1, 100)', [uid]);
  const packets = [];
  player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid: uid, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'WhitePlanet'), {coins: 10000, mapID: 445})),
    EventBus: new GameEventBus(), SendPacket: async packet => { packets.push({command: packet.getCmdId(), result: packet.getResult(), body: packet.serialize('xin-20261013')}); }});
  player._session = {Socket: {destroyed: false}, Player: player};
  const defeated = new Set();
  player.ChallengeProgressManager = {HasDefeatedSPTBoss: id => defeated.has(id), GetPuniLevel: () => 0};
  player.PetManager = new PetManager(player);
  player.ItemManager = new ItemManager(player);
  player.MapSpawnManager = new MapSpawnManager(player);
  player.BattleManager = new BattleManager(player);
  await player.PetManager.Initialize();
  await player.ItemManager.Initialize();
  const make = (petId, catchTime, isDefault) => {
    const p = Object.assign(createDefaultPetInfo(uid, petId), {level: 100, catchTime, isInBag: true, isDefault, skillArray: [20002]});
    PetCalculator.UpdatePetStats(p);
    return p;
  };
  const pets = [make(70, now - 200, true), make(300, now - 100, false)];
  player.PetManager.PetData.PetList = pets;
  await helper.SavePetData(player.PetManager.PetData, true);
  const results = [];
  const challenge = async (mapId, param2) => {
    player.BattleManager.CleanupBattle();
    packets.length = 0;
    await player.BattleManager.HandleChallengeBoss(mapId, param2);
    return player.BattleManager.GetCurrentBattle();
  };
  const {BossAbilityConfig} = load('GameServer/Game/Battle/BossAbility/BossAbilityConfig');
  for (const [map, name, sptId] of [[445, '卡修斯', 57], [486, '德拉萨', 58], [450, '迪符特', 59]]) {
    const battle = await challenge(map, 0);
    assert.equal(battle?.enemy.name, name, `${name} at ${map}`);
    assert.equal(BossAbilityConfig.Instance.GetBossConfigByMapAndParam(map, 0).spt.sptId, sptId, `${name} keeps SPT ${sptId}`);
  }
  results.push('卡修斯 445, 德拉萨 486, 迪符特 450');

  for (const param2 of [0, 1, 2]) assert.equal(BossAbilityConfig.Instance.GetBossConfigByMapAndParam(484, param2), undefined, `484/${param2} empty`);
  results.push('怀特星 484 has no boss left');

  {
    const ogres = JSON.parse(fs.readFileSync(path.join(app, 'config/data/json/map-ogres.json'), 'utf8')).maps['445'];
    assert.deepEqual(ogres.ogres.map(o => o.petId), [766, 767, 775, 776], '多特、多雷、粉粉、灵灵');
    assert.ok(ogres.ogres.slice(2).every(o => o.minLevel === 60 && o.maxLevel === 63), '粉粉、灵灵 60–63');
  }
  results.push('粉粉、灵灵 at 445');

  console.log(JSON.stringify({passed: results.length, results, database: 'temporary-only'}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (player) { player.BattleManager.CleanupBattle(); player.Data.cleanup(); helper.RemoveCache(player.Uid); }
  await db.Shutdown();
  fs.rmSync(temporary, {recursive: true, force: true});
  process.exit(process.exitCode || 0);
});
