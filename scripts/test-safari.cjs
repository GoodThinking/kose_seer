'use strict';
// 克洛斯星的湿地 and the wild-position fix: the deployed Core must have positions for every wild pool on a registered map,
// 550's pets spawn and fight through the real spawn manager and BattleManager, and the pets whose pools sit on
// unregistered maps come from the sign-in, all on a temporary database (never a live account).
// Usage: node scripts/test-safari.cjs <runtime app dir with dist/config/node_modules> <client root with assets/ and overlay/> <repo root>
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), zlib = require('node:zlib');
const app = path.resolve(process.argv[2]), client = path.resolve(process.argv[3]), repo = path.resolve(process.argv[4]);
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
const {PetCollectHandler} = load('GameServer/Server/Packet/Recv/Pet/PetCollectHandler');

// 部署的 Core 里内嵌的表
function coreTable(symbol) {
  const file = ['overlay', 'assets'].map(d => path.join(client, d, 'dll/NieoCore.swf')).find(f => fs.existsSync(f));
  const raw = fs.readFileSync(file), body = zlib.inflateSync(raw.subarray(8));
  let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const symbols = {}, binaries = {};
  while (offset < body.length) {
    const short = body.readUInt16LE(offset); offset += 2;
    let size = short & 63;
    if (size === 63) { size = body.readUInt32LE(offset); offset += 4; }
    const code = short >> 6, payload = body.subarray(offset, offset + size); offset += size;
    if (code === 76) {
      let at = 2;
      for (let i = 0; i < payload.readUInt16LE(0); i++) {
        const id = payload.readUInt16LE(at), end = payload.indexOf(0, at + 2);
        symbols[payload.subarray(at + 2, end).toString()] = id;
        at = end + 1;
      }
    } else if (code === 87) binaries[payload.readUInt16LE(0)] = payload.subarray(6);
    if (!code) break;
  }
  return binaries[symbols[symbol]].toString('utf8');
}

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-safari-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
const realRandom = Math.random, realNow = Date.now;
let player;
(async () => {
  const results = [];
  const pools = JSON.parse(fs.readFileSync(path.join(app, 'config/data/json/map-ogres.json'), 'utf8')).maps;
  const mapTable = coreTable('com.robot.core.manager.map.config.MapConfig_xmlCls');
  const ogreTable = coreTable('com.robot.core.config.xml.OgreXMLInfo_xmlClass');
  const ogreSection = ogreTable.slice(ogreTable.indexOf('<ogre>'), ogreTable.indexOf('</ogre>'));
  const spots = Object.fromEntries([...ogreSection.matchAll(/<item id="(\d+)" pList="([^"]*)"/g)].map(m => [m[1], m[2].split('|').length]));
  // 507 在这版是暗黑武斗场第五扇门，池子是官方编号的光明圣坛，同样的精灵在 9507
  const WRONG_MAP = new Set(['507']);
  let checked = 0;
  for (const [id, pool] of Object.entries(pools)) {
    const wild = pool.ogres.filter(o => o.petId > 0 && !o.isBoss && o.refreshConfig?.enabled !== false);
    if (!wild.length || !mapTable.includes(`<map id="${id}" `) || WRONG_MAP.has(id)) continue;
    assert.ok((spots[id] || 0) >= 9, `Map ${id} ${pool.name} has a wild pool but ${spots[id] || 0} client positions`);
    checked++;
  }
  assert.ok(/<map id="550" name="克洛斯星的湿地" x="200" y="1018"/.test(mapTable), '550 registered with its spawn point');
  results.push(`Every wild pool on a registered map has nine client positions (${checked} maps, 550 included)`);

  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'safari.sqlite')};
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
  const uid = 417090, now = Math.floor(Date.now() / 1000);
  await db.Execute('INSERT INTO players VALUES (?, 10000, 7, 123, 1, 100)', [uid]);
  const packets = [];
  player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid: uid, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'Wetland'), {coins: 10000, gold: 7, allocatableExp: 123, mapID: 5})),
    EventBus: new GameEventBus(), SendPacket: async packet => { packets.push({command: packet.getCmdId(), body: packet.serialize('xin-20261013')}); }});
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

  // 湿地：14 种都会刷，图鉴的 4 只能开打，等级 10–15
  const WETLAND = [812, 814, 820, 829, 414, 459, 289, 108, 281, 387, 756, 618, 646, 724];
  const seen = new Set();
  for (let step = 0; step < 100; step++) {
    Math.random = () => step / 100;
    player.MapSpawnManager.OnEnterMap(550);
    for (const ogre of player.MapSpawnManager.GetMapOgres(550)) if (ogre.petId) seen.add(ogre.originalPetId || ogre.petId);
  }
  Math.random = realRandom;
  assert.deepEqual([...seen].sort((a, b) => a - b), [...WETLAND].sort((a, b) => a - b), 'Wetland pool');
  results.push('All 14 wetland pets spawn on 550');
  player.Data.mapID = 550;
  for (const petId of [812, 814, 820, 829]) {
    let index = -1;
    for (let step = 0; step < 100 && index < 0; step++) {
      Math.random = () => step / 100;
      player.MapSpawnManager.OnEnterMap(550);
      index = player.MapSpawnManager.GetMapOgres(550).findIndex(o => o.petId === petId);
    }
    Math.random = realRandom;
    assert.ok(index >= 0, `${petId} in the spawn list`);
    player.BattleManager.CleanupBattle();
    await player.BattleManager.HandleFightNpcMonster(index);
    const battle = player.BattleManager.GetCurrentBattle();
    assert.equal(battle?.enemy.id, petId, 'wild battle against ' + petId);
    assert.ok(battle.enemy.level >= 10 && battle.enemy.level <= 15, `${petId} level ${battle.enemy.level}`);
    player.BattleManager.CleanupBattle();
  }
  results.push('Wild battles start against 汤尼熊, 琳达, 福克斯 and 罗查 at level 10-15');

  // 野怪池只在客户端没登记的地图上（进不去）的 40 只改从签到领，每个北京日领一只
  player.Data.mapID = 5;
  const additions = JSON.parse(fs.readFileSync(path.join(repo, 'compat/server-patches/safari/sign-in-additions.json'), 'utf8')).pets;
  let day = Date.parse('2031-10-23T04:00:00Z');
  for (const {petId} of additions) {
    day += 86400000;
    Date.now = () => day;
    const body = Buffer.alloc(8); body.writeUInt32BE(900001); body.writeUInt32BE(petId, 4);
    await new PetCollectHandler().Handle(player.Session, {}, body);
    const reply = packets.at(-1);
    assert.equal(reply.command, 2311);
    assert.deepEqual([reply.body.readUInt32BE(0), reply.body.readUInt32BE(12)], [petId, 0], 'sign-in claim ' + petId);
    assert.equal(player.PetManager.PetData.PetList.at(-1).petId, petId);
  }
  results.push(`All ${additions.length} pets from unregistered maps can be claimed from the lab sign-in`);

  console.log(JSON.stringify({passed: results.length, results, database: 'temporary-only'}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  Math.random = realRandom;
  Date.now = realNow;
  if (player) { player.BattleManager.CleanupBattle(); player.Data.cleanup(); helper.RemoveCache(player.Uid); }
  await db.Shutdown();
  fs.rmSync(temporary, {recursive: true, force: true});
  process.exit(process.exitCode || 0);
});
