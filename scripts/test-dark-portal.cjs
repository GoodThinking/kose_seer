'use strict';
// 暗黑门 doors 9–10 through the real packet handlers and BattleManager on a temporary database (never a live account).
// Usage: node scripts/test-dark-portal.cjs <runtime app dir with dist/config/node_modules>
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
const {OpenDarkPortalHandler, FightDarkPortalHandler} = load('GameServer/Server/Packet/Recv/Battle/DarkPortalHandler');
const {CommandID} = load('shared/protocol/CommandID');

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-dark-portal-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
let player;
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'dark.sqlite')};
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
  const uid = 417075, now = Math.floor(Date.now() / 1000);
  await db.Execute('INSERT INTO players VALUES (?, 10000, 7, 123, 1, 100)', [uid]);
  const packets = [];
  player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid: uid, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'DarkPortal'), {coins: 10000, mapID: 110, superNono: 1})),
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
  const open = async door => {
    packets.length = 0;
    const body = Buffer.alloc(4); body.writeUInt32BE(door);
    await new OpenDarkPortalHandler().Handle(player.Session, {}, body);
    const packet = packets.find(p => p.command === CommandID.OPEN_DARKPORTAL);
    return {result: packet.result, petId: packet.result ? 0 : packet.body.readUInt32BE(0)};
  };

  const {BossAbilityConfig} = load('GameServer/Game/Battle/BossAbility/BossAbilityConfig');
  const DOOR10 = [[54, 1182, 400304], [55, 1185, 400305], [56, 1187, 400306]];
  for (const [door, petId, essence] of DOOR10) {
    assert.deepEqual(await open(door), {result: 0, petId}, `door slot ${door}`);
    const config = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(110, 1000 + door);
    assert.equal(config.spt.rewardItemId, essence, `slot ${door} essence`);
  }
  results.push('Door 10 slots 54–56 open 鳞甲魔鱼, 艾斯德克, 狂狮迪卡 with their essences');

  assert.deepEqual(await open(48), {result: 0, petId: 779}, 'door 9 unchanged');
  assert.equal((await open(60)).result, 5001, 'door 11 still has no bosses');
  results.push('Door 9 unchanged; door 11 still closed');

  await open(55);
  packets.length = 0;
  await new FightDarkPortalHandler().Handle(player.Session, {}, Buffer.alloc(0));
  const battle = player.BattleManager.GetCurrentBattle();
  assert.equal(battle?.enemy.id, 1185, 'fight 艾斯德克');
  assert.equal(battle.enemy.level, 80);
  assert.equal(battle.enemy.maxHp, 8000);
  player.BattleManager.CleanupBattle();
  results.push('Door 10 fight starts at level 80 with 8000 HP');

  console.log(JSON.stringify({passed: results.length, results, database: 'temporary-only'}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (player) { player.BattleManager.CleanupBattle(); player.Data.cleanup(); helper.RemoveCache(player.Uid); }
  await db.Shutdown();
  fs.rmSync(temporary, {recursive: true, force: true});
  process.exit(process.exitCode || 0);
});
