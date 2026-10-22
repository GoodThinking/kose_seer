'use strict';
// 光明圣坛 (map 9507) through BattleManager on a temporary database (never a live account): 布莱克 is a level-70,
// 2000-HP boss that moves first with attack +1, and the duel is one pet only (no switching; a faint loses the fight).
// Usage: node scripts/test-bright-altar.cjs <runtime app dir with dist/config/node_modules>
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

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-bright-altar-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
let player;
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'altar.sqlite')};
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
  const uid = 417066, now = Math.floor(Date.now() / 1000);
  await db.Execute('INSERT INTO players VALUES (?, 10000, 7, 123, 1, 100)', [uid]);
  const packets = [];
  player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid: uid, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'BrightAltar'), {coins: 10000, mapID: 9507})),
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
  const alertText = () => {
    const alert = packets.find(p => p.command === ALERT);
    return alert && alert.body.subarray(4, 4 + alert.body.readUInt32BE(0)).toString('utf8');
  };
  const overs = [];
  player.BattleManager.HandleFightOver = async (winner, reason) => { overs.push([winner, reason]); };
  const start = async () => {
    player.BattleManager.CleanupBattle();
    await player.BattleManager.HandleChallengeBoss(9507, 0);
    const battle = player.BattleManager.GetCurrentBattle();
    assert.ok(battle, 'battle starts');
    await player.BattleManager.HandleReadyToFight();
    packets.length = 0;
    overs.length = 0;
    return battle;
  };

  // 布莱克：70级、2000血、攻击天生强化一级、必定先出招
  {
    const battle = await start();
    const boss = battle.enemy;
    assert.deepEqual([boss.name, boss.level, boss.maxHp], ['布莱克', 70, 2000]);
    assert.deepEqual(boss.skills, [12112, 21090, 21089, 12114], '双重暗影、暗夜守护、深黑恐惧、斗志复燃');
    assert.equal(boss.battleLevels[0], 1, 'attack +1 at the start');
    battle.player.speed = 9999;
    const r = player.BattleManager._turnService.ExecuteTurn(battle, 20002);
    assert.equal(r.firstAttack.userId, 0, 'moves first even against a faster pet');
  }
  results.push('布莱克 level 70, 2000 HP, attack +1, always first');

  // 一对一：不能主动换精灵
  {
    const battle = await start();
    await player.BattleManager.HandleChangePet(pets[1].catchTime);
    assert.equal(alertText(), '布莱克只接受一对一的决斗，不能更换精灵！');
    assert.equal(packets.find(p => p.command === CHANGE_PET)?.result, 900, 'silent refusal code');
    assert.equal(battle.player.catchTime, pets[0].catchTime, 'still the first pet');
  }
  results.push('No switching in the duel');

  // 一对一：出战精灵倒下即失败，即使背包里还有健康的精灵
  {
    const battle = await start();
    battle.player.hp = 0;
    assert.equal(await player.BattleManager.CheckPlayerPetDeath(), true);
    assert.deepEqual(overs, [[0, 0]], 'the fight is lost');
  }
  results.push('A faint loses the duel');

  // 斯普林特、缪斯两条补上 abilities 后，整张表都能登记
  {
    const {BossAbilityConfig} = load('GameServer/Game/Battle/BossAbility/BossAbilityConfig');
    for (const [map, param2, name] of [[495, 0, '斯普林特'], [932, 0, '缪斯'], [9507, 0, '布莱克']])
      assert.equal(BossAbilityConfig.Instance.GetBossConfigByMapAndParam(map, param2)?.petName, name, `${map}/${param2}`);
  }
  results.push('Every boss entry loads');

  // 光明圣坛野怪
  {
    const ogres = JSON.parse(fs.readFileSync(path.join(app, 'config/data/json/map-ogres.json'), 'utf8')).maps['9507'];
    assert.deepEqual([ogres.name, ...ogres.ogres.map(o => o.petId)], ['光明圣坛', 859, 805], '毛球、吉嘟');
  }
  results.push('光明圣坛 wild pets');

  console.log(JSON.stringify({passed: results.length, results, database: 'temporary-only'}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (player) { delete player.BattleManager.HandleFightOver; player.BattleManager.CleanupBattle(); player.Data.cleanup(); helper.RemoveCache(player.Uid); }
  await db.Shutdown();
  fs.rmSync(temporary, {recursive: true, force: true});
  process.exit(process.exitCode || 0);
});
