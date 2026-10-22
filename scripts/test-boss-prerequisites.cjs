'use strict';
// Boss prerequisites through BattleManager on a temporary database (never a live account):
// 朱雀 (318/0) needs 德拉萨 (SPT 58), 卡修斯 (57) and 迪符特 (59); the refusal is an in-game alert naming the missing ones.
// Usage: node scripts/test-boss-prerequisites.cjs <runtime app dir with dist/config/node_modules>
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
const ALERT = 80002, CHALLENGE_BOSS = 2411;

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-boss-gate-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
let player;
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'gate.sqlite')};
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
  const uid = 417065, now = Math.floor(Date.now() / 1000);
  await db.Execute('INSERT INTO players VALUES (?, 10000, 7, 123, 1, 100)', [uid]);
  const packets = [];
  player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid: uid, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'BossGate'), {coins: 10000, mapID: 318})),
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
  const pet = Object.assign(createDefaultPetInfo(uid, 70), {level: 100, catchTime: now - 100, isInBag: true, isDefault: true, skillArray: [10006]});
  PetCalculator.UpdatePetStats(pet);
  player.PetManager.PetData.PetList = [pet];
  await helper.SavePetData(player.PetManager.PetData, true);
  const results = [];
  const alertText = () => {
    const alert = packets.find(p => p.command === ALERT);
    return alert && alert.body.subarray(4, 4 + alert.body.readUInt32BE(0)).toString('utf8');
  };
  const challenge = async (mapId, param2) => {
    packets.length = 0;
    player.BattleManager.CleanupBattle();
    await player.BattleManager.HandleChallengeBoss(mapId, param2);
    return {alert: alertText(), result: packets.find(p => p.command === CHALLENGE_BOSS)?.result, battle: player.BattleManager.GetCurrentBattle()};
  };

  {
    const r = await challenge(318, 0);
    assert.equal(r.alert, '必须先打败德拉萨、卡修斯、迪符特，才能挑战菲尼克斯。');
    assert.equal(r.result, 900, 'silent refusal code');
    assert.ok(!r.battle, 'no battle');
  }
  results.push('朱雀 refused before any of the three');

  defeated.add(57).add(58);
  {
    const r = await challenge(318, 0);
    assert.equal(r.alert, '必须先打败迪符特，才能挑战菲尼克斯。', 'names only the missing one');
    assert.ok(!r.battle);
  }
  results.push('Alert names only the missing bosses');

  defeated.add(59);
  {
    const r = await challenge(318, 0);
    assert.equal(r.alert, undefined, 'no alert');
    assert.equal(r.result, 0, 'challenge accepted');
    assert.equal(r.battle?.enemy.name, '菲尼克斯');
  }
  results.push('朱雀 opens after all three');

  defeated.clear();
  {
    const r = await challenge(445, 0);
    assert.equal(r.alert, undefined);
    assert.equal(r.battle?.enemy.name, '卡修斯', 'bosses without prerequisites unchanged');
  }
  results.push('Other bosses are not gated');

  console.log(JSON.stringify({passed: results.length, results, database: 'temporary-only'}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (player) { player.BattleManager.CleanupBattle(); player.Data.cleanup(); helper.RemoveCache(player.Uid); }
  await db.Shutdown();
  fs.rmSync(temporary, {recursive: true, force: true});
  process.exit(process.exitCode || 0);
});
