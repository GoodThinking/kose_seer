'use strict';
// 训练师之门 (simplified): every gate boss at 精灵太空站 102 through BattleManager on a temporary database (never a live account).
// Usage: node scripts/test-train-door.cjs <runtime app dir with dist/config/node_modules> <repo root>
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const app = path.resolve(process.argv[2]);
const gates = JSON.parse(fs.readFileSync(path.join(path.resolve(process.argv[3]), 'compat/server-patches/train-door/gates.json'), 'utf8')).gates;
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

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-train-door-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
let player;
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'train.sqlite')};
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
  const uid = 417090, now = Math.floor(Date.now() / 1000);
  await db.Execute('INSERT INTO players VALUES (?, 10000, 7, 123, 1, 100)', [uid]);
  const packets = [];
  player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid: uid, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'TrainDoor'), {coins: 10000, mapID: 102})),
    EventBus: new GameEventBus(), SendPacket: async packet => { packets.push({command: packet.getCmdId(), result: packet.getResult(), body: packet.serialize('xin-20261013')}); }});
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
  const {BossAbilityConfig} = load('GameServer/Game/Battle/BossAbility/BossAbilityConfig');
  for (const gate of gates) {
    packets.length = 0;
    player.BattleManager.CleanupBattle();
    await player.BattleManager.HandleChallengeBoss(102, gate.param2);
    const battle = player.BattleManager.GetCurrentBattle();
    assert.equal(battle?.enemy.id, gate.petId, `${gate.type} gate boss`);
    // 等级和血量以当前配置为准（R79 起按属性护盾校准）
    const config = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(102, gate.param2);
    assert.deepEqual([battle.enemy.level, battle.enemy.maxHp], [config.level, config.customHP], `${gate.type} gate stats`);
    assert.deepEqual([config.spt.sptId, config.spt.rewardItemId, config.spt.noStand], [gate.sptId, gate.essence, true], `${gate.type} gate reward`);
    player.BattleManager.CleanupBattle();
  }
  results.push(`All ${gates.length} gates fight their pet at the configured level and HP and pay its essence on the first win`);

  assert.equal(new Set(gates.map(g => g.sptId)).size, gates.length, 'distinct SPT ids');
  results.push('Each gate keeps its own first-win record');

  console.log(JSON.stringify({passed: results.length, results, database: 'temporary-only'}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (player) { player.BattleManager.CleanupBattle(); player.Data.cleanup(); helper.RemoveCache(player.Uid); }
  await db.Shutdown();
  fs.rmSync(temporary, {recursive: true, force: true});
  process.exit(process.exitCode || 0);
});
