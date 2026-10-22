'use strict';
// 北斗七星殿 seals through the real packet handlers, item manager, wallet and BattleManager on a temporary database
// (never a live account). Beijing days are simulated by moving Date.now.
// Usage: node scripts/test-beidou.cjs <runtime app dir with dist/config/node_modules>
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
const {PetCollectHandler, IsCollectHandler} = load('GameServer/Server/Packet/Recv/Pet/PetCollectHandler');
const {CommandID} = load('shared/protocol/CommandID');

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-beidou-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
const realNow = Date.now;
let clock = Date.parse('2031-10-21T04:00:00Z') / 1000;
Date.now = () => clock * 1000;
const players = [];
let uid = 417080;
async function fixture(coins) {
  const id = ++uid, now = Math.floor(Date.now() / 1000);
  await db.Execute('INSERT INTO players VALUES (?, ?, 7, 123, 1, 100)', [id, coins]);
  const packets = [];
  const player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid: id, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(id, 'Beidou'), {coins, gold: 7, allocatableExp: 123, mapID: 733})),
    EventBus: new GameEventBus(), packets, SendPacket: async packet => { packets.push({command: packet.getCmdId(), result: packet.getResult(), body: packet.serialize('xin-20261013')}); }});
  player._session = {Socket: {destroyed: false}, Player: player};
  const defeated = new Set();
  player.defeated = defeated;
  player.ChallengeProgressManager = {HasDefeatedSPTBoss: sptId => defeated.has(sptId), GetPuniLevel: () => 0};
  player.PetManager = new PetManager(player);
  player.ItemManager = new ItemManager(player);
  player.MapSpawnManager = new MapSpawnManager(player);
  player.BattleManager = new BattleManager(player);
  await player.PetManager.Initialize();
  await player.ItemManager.Initialize();
  const pet = Object.assign(createDefaultPetInfo(id, 70), {level: 100, catchTime: now - 100, isInBag: true, isDefault: true, skillArray: [10006]});
  PetCalculator.UpdatePetStats(pet);
  player.PetManager.PetData.PetList = [pet];
  await helper.SavePetData(player.PetManager.PetData, true);
  players.push(player);
  return player;
}
const words = (body, count) => Array.from({length: count}, (_, i) => body.readUInt32BE(i * 4));
async function status(player) {
  const body = Buffer.alloc(4); body.writeUInt32BE(900003);
  await new IsCollectHandler().Handle(player.Session, {}, body);
  const packet = player.packets.at(-1);
  assert.equal(packet.command, CommandID.IS_COLLECT);
  const [group, ...rest] = words(packet.body, 9);
  assert.equal(group, 900003);
  return rest.slice(0, 7);
}
async function seal(player, n) {
  const body = Buffer.alloc(8); body.writeUInt32BE(900003); body.writeUInt32BE(n, 4);
  await new PetCollectHandler().Handle(player.Session, {}, body);
  const packet = player.packets.at(-1);
  assert.equal(packet.command, CommandID.PET_COLLECT);
  const [group, which, error, item, coins] = words(packet.body, 5);
  assert.deepEqual([group, which], [900003, n]);
  return {error, item, coins};
}
const ERROR = {ORDER: 1, TODAY: 2, COINS: 3, DONE: 4, WAIT: 5};
const day = () => { clock += 86400; };

(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'beidou.sqlite')};
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
  for (const sql of new (load('DataBase/migrations/scripts/021_create_receiver_claims').Migration021CreateReceiverClaims)().upSQLite()) await db.Execute(sql);
  const results = [];

  const p = await fixture(300000);
  assert.deepEqual(await status(p), [0, 0, 0, 0, 0, 0, 0]);
  assert.equal((await seal(p, 2)).error, ERROR.ORDER, '巨门 waits for 贪狼');
  assert.deepEqual(await seal(p, 1), {error: 0, item: 400315, coins: 300000});
  assert.equal((await seal(p, 1)).error, ERROR.TODAY, '贪狼 once per day');
  day();
  assert.equal((await seal(p, 1)).item, 400315, '贪狼 again the next day');
  assert.equal(p.ItemManager.GetItemCount(400315), 2);
  results.push('贪狼 gives a 火星灵精元 once per Beijing day');

  assert.deepEqual(await seal(p, 2), {error: 0, item: 0, coins: 250000});
  assert.deepEqual(await seal(p, 2), {error: 0, item: 0, coins: 200000});
  assert.equal((await seal(p, 2)).error, ERROR.TODAY, '巨门 twice per day');
  {
    const body = Buffer.alloc(8); body.writeUInt32BE(733); body.writeUInt32BE(0, 4);
    p.packets.length = 0;
    await p.BattleManager.HandleChallengeBoss(733, 0);
    const alert = p.packets.find(x => x.command === CommandID.ALERT);
    assert.equal(alert.body.subarray(4).toString('utf8'), '必须先解除巨门封印，才能挑战芙洛。');
    assert.ok(!p.BattleManager.GetCurrentBattle(), '芙洛 locked before 巨门');
  }
  day();
  assert.deepEqual(await seal(p, 2), {error: 0, item: 0, coins: 150000});
  assert.deepEqual(await seal(p, 2), {error: 0, item: 400318, coins: 100000});
  assert.equal((await seal(p, 2)).error, ERROR.DONE);
  assert.equal(p.Data.coins, 100000);
  const [stored] = await db.Query('SELECT coins FROM players WHERE user_id = ?', [p.Uid]);
  assert.equal(stored.coins, 100000, 'wallet saved with the claims');
  results.push('巨门 costs 50000 a time, twice a day, and gives the 水星灵 essence on the fourth');

  p.packets.length = 0;
  await p.BattleManager.HandleChallengeBoss(733, 0);
  const battle = p.BattleManager.GetCurrentBattle();
  assert.equal(battle?.enemy.id, 1232, '芙洛 opens after 巨门');
  assert.deepEqual([battle.enemy.level, battle.enemy.maxHp], [70, 3000]);
  p.BattleManager.CleanupBattle();
  results.push('禄存 guardian 芙洛 (70, 3000 HP) opens after 巨门');

  assert.equal((await seal(p, 4)).error, ERROR.ORDER, '文曲 waits for 禄存');
  p.defeated.add(66);
  assert.deepEqual(await seal(p, 4), {error: 0, item: 0, coins: 100000});
  clock += 71 * 3600;
  assert.equal((await seal(p, 4)).error, ERROR.WAIT, '72 hours not over');
  clock += 3600;
  assert.equal((await seal(p, 4)).item, 400336, '冰星灵 essence after 72 hours');
  assert.equal((await seal(p, 4)).error, ERROR.DONE);
  const s = await status(p);
  assert.deepEqual([s[0], s[2], s[4], s[6]], [2, 4, 1, 1]);
  results.push('文曲 gives the 冰星灵 essence 72 hours after it starts');

  const poor = await fixture(30000);
  await seal(poor, 1);
  assert.deepEqual(await seal(poor, 2), {error: ERROR.COINS, item: 0, coins: 30000});
  assert.deepEqual((await status(poor)).slice(2, 4), [0, 0], 'no unlock recorded without coins');
  results.push('Short of coins, 巨门 records nothing');

  console.log(JSON.stringify({passed: results.length, results, database: 'temporary-only'}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  Date.now = realNow;
  for (const player of players) { player.BattleManager.CleanupBattle(); player.Data.cleanup(); helper.RemoveCache(player.Uid); }
  await db.Shutdown();
  fs.rmSync(temporary, {recursive: true, force: true});
  process.exit(process.exitCode || 0);
});
