'use strict';
// Drive real boss battles through BattleManager packets on a temporary database (never a live account).
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
const {PetManager} = load('GameServer/Game/Pet/PetManager');
const {ItemManager} = load('GameServer/Game/Item/ItemManager');
const {MapSpawnManager} = load('GameServer/Game/Map/MapSpawnManager');
const {BattleManager} = load('GameServer/Game/Battle/BattleManager');
const {BattleCaptureSystem} = load('GameServer/Game/Battle/BattleCaptureSystem');
const {GameEventBus} = load('GameServer/Game/Event/GameEventBus');
const {createDefaultPetInfo} = load('shared/models/PetModel');
const {createDefaultPlayerInfo} = load('shared/models/PlayerModel');
const {PetCalculator} = load('GameServer/Game/Pet/PetCalculator');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-boss-e2e-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
let player;
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'boss.sqlite')};
  Config.Game.clientProtocol = 'xin-20261013';
  for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG, ConfigKeys.ITEM_CONFIG]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
  for (const key of [ConfigKeys.NATURES_CONFIG, ConfigKeys.MAP_OGRES, ConfigKeys.BOSS_ABILITIES, ConfigKeys.PET_ABILITIES, ConfigKeys.ELEMENTS_CONFIG, ConfigKeys.SKILL_EFFECTS_V2]) if (key) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.JSON);
  await ConfigRegistry.Instance.Initialize();
  await load('shared/config/game/SkillEffectsConfig').SkillEffectsConfig.Instance.Load();
  await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL,pet_all_num INTEGER NOT NULL,pet_max_lev INTEGER NOT NULL)');
  const petSQL = new (load('DataBase/migrations/scripts/012_fix_all_tables').Migration012FixAllTables)().upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'));
  await db.Execute(petSQL);
  for (const sql of new (load('DataBase/migrations/scripts/006_create_items').Migration006CreateItems)().upSQLite()) await db.Execute(sql);
  const uid = 417063, now = Math.floor(Date.now() / 1000);
  await db.Execute('INSERT INTO players VALUES (?, 10000, 7, 123, 1, 75)', [uid]);
  const packets = [];
  player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid: uid, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'BossSmoke'), {coins: 10000, mapID: 53})),
    EventBus: new GameEventBus(), SendPacket: async packet => {packets.push({command: packet.getCmdId(), result: packet.getResult(), body: packet.serialize('xin-20261013')});}});
  player._session = {Socket: {destroyed: false}, Player: player};
  player.PetManager = new PetManager(player);
  player.ItemManager = new ItemManager(player);
  player.MapSpawnManager = new MapSpawnManager(player);
  player.BattleManager = new BattleManager(player);
  await player.PetManager.Initialize();
  await player.ItemManager.Initialize();
  const pet = Object.assign(createDefaultPetInfo(uid, 139), {level: 50, catchTime: now - 100, isInBag: true, isDefault: true, skillArray: [10036]});
  PetCalculator.UpdatePetStats(pet);
  player.PetManager.PetData.PetList = [pet];
  await helper.SavePetData(player.PetManager.PetData, true);
  const results = [];
  // 同生共死 through the real packet flow: blocked on 哈莫雷特, still effective on 雷纳多 (classic).
  for (const [mapId, param, immune] of [[57, 0, true], [49, 0, false]]) {
    pet.hp = 1;
    player.Data.mapID = mapId;
    await player.BattleManager.HandleChallengeBoss(mapId, param);
    const battle = player.BattleManager.GetCurrentBattle();
    if (!process.env.BASELINE) assert.ok(battle?.enemy.bossMechanics, 'Boss battle must carry boss rules');
    await player.BattleManager.HandleReadyToFight();
    battle.player.hp = 1;
    battle.player.speed = 9999;
    const before = battle.enemy.hp;
    await player.BattleManager.HandleUseSkill(10036);
    assert.ok(packets.some(packet => packet.command === 2505), 'Turn result packet must be sent');
    const dealt = before - battle.enemy.hp;
    if (immune) assert.equal(dealt, 0, '哈莫雷特 must ignore 同生共死');
    else assert.ok(dealt > 1000, '雷纳多 must take 同生共死 damage');
    results.push({mapId, param, enemy: battle.enemy.name, dealt});
    player.BattleManager.CleanupBattle();
    packets.length = 0;
  }
  console.log('BOSS_E2E_SMOKE=' + JSON.stringify({results, database: 'temporary-only'}));
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(async () => {
  if (player) {player.BattleManager.CleanupBattle(); player.Data.cleanup(); helper.RemoveCache(player.Uid);}
  await db.Shutdown();
  fs.rmSync(temporary, {recursive: true, force: true});
  process.exit(process.exitCode || 0);
});
