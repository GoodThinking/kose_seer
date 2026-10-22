'use strict';
// The laboratory daily sign-in hands out each pet added with the downloaded battle files, through the real
// packet handler on a temporary database (never a live account). One claim per simulated Beijing day.
// Usage: node scripts/test-pet-resources.cjs <runtime app dir with dist/config/node_modules> <release manifest.json>
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const app = path.resolve(process.argv[2]);
const manifest = JSON.parse(fs.readFileSync(path.resolve(process.argv[3]), 'utf8'));
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const {Logger, LogLevel} = load('shared/utils/Logger');
Logger.SetMinLevel(LogLevel.Error);
const {Config} = load('shared/config/ServerConfig');
const {ConfigLoader} = load('shared/config/ConfigLoader');
const {ConfigRegistry} = load('shared/config/ConfigRegistry');
const {ConfigKeys, ConfigPaths, ConfigType} = load('shared/config/ConfigDefinitions');
const {DatabaseManager} = load('DataBase/DatabaseManager');
const {DatabaseHelper} = load('DataBase/DatabaseHelper');
const {PlayerData} = load('DataBase/models/PlayerData');
const {PlayerInstance} = load('GameServer/Game/Player/PlayerInstance');
const {PetManager} = load('GameServer/Game/Pet/PetManager');
const {GameEventBus} = load('GameServer/Game/Event/GameEventBus');
const {createDefaultPlayerInfo} = load('shared/models/PlayerModel');
const {PetCollectHandler} = load('GameServer/Server/Packet/Recv/Pet/PetCollectHandler');

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-pet-resources-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
const realNow = Date.now;
let clock = Date.parse('2031-10-21T04:00:00Z') / 1000;
Date.now = () => clock * 1000;
let player;
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'pool.sqlite')};
  Config.Game.clientProtocol = 'xin-20261013';
  for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
  for (const key of [ConfigKeys.NATURES_CONFIG, ConfigKeys.PET_ABILITIES]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.JSON);
  await ConfigRegistry.Instance.Initialize();
  await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL,pet_all_num INTEGER NOT NULL,pet_max_lev INTEGER NOT NULL)');
  const petSQL = new (load('DataBase/migrations/scripts/012_fix_all_tables').Migration012FixAllTables)().upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'));
  await db.Execute(petSQL);
  for (const sql of new (load('DataBase/migrations/scripts/021_create_receiver_claims').Migration021CreateReceiverClaims)().upSQLite()) await db.Execute(sql);

  const uid = 971001;
  await db.Execute('INSERT INTO players VALUES (?, 10000, 7, 123, 0, 0)', [uid]);
  player = Object.create(PlayerInstance.prototype);
  Object.defineProperty(player, 'Uid', {value: uid});
  Object.defineProperty(player, 'ClientProtocol', {value: 'xin-20261013'});
  player.Data = new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'PoolSmoke'), {coins: 10000, gold: 7, allocatableExp: 123, mapID: 5}));
  player.EventBus = new GameEventBus();
  player.packets = [];
  player.SendPacket = async packet => { player.packets.push({command: packet.getCmdId(), body: packet.serialize('xin-20261013')}); };
  player._session = {Socket: {destroyed: false}, Player: player};
  player.PetManager = new PetManager(player);
  await player.PetManager.Initialize();
  await helper.SavePetData(player.PetManager.PetData, true);
  const claim = async petId => {
    const body = Buffer.alloc(8); body.writeUInt32BE(900001); body.writeUInt32BE(petId, 4);
    await new PetCollectHandler().Handle(player.Session, {}, body);
    const packet = player.packets.at(-1);
    assert.equal(packet.command, 2311);
    return {petId: packet.body.readUInt32BE(0), error: packet.body.readUInt32BE(12)};
  };
  const results = [];

  const pool = JSON.parse(fs.readFileSync(path.join(app, 'config/data/json/pet-acquisition.json'), 'utf8')).exchange.petIds;
  assert.equal(pool.length, manifest.poolPets, 'Pool size matches the release');
  assert.ok(manifest.addedPoolPets.every(id => pool.includes(id)), 'Every added pet is whitelisted');
  results.push(`Whitelist holds ${pool.length} pets`);

  for (const petId of manifest.addedPoolPets) {
    clock += 86400;
    const before = player.PetManager.PetData.PetList.length;
    assert.deepEqual(await claim(petId), {petId, error: 0}, 'Claim succeeds: ' + petId);
    const pet = player.PetManager.PetData.PetList.at(-1);
    assert.equal(player.PetManager.PetData.PetList.length, before + 1, 'One pet stored: ' + petId);
    assert.equal(pet.petId, petId);
    assert.equal(pet.level, 1);
    assert.equal(pet.isInBag, false, 'Stored in the warehouse');
    assert.ok(pet.skillArray.filter(Boolean).length > 0, 'Level 1 pet has a move: ' + petId);
  }
  results.push(`All ${manifest.addedPoolPets.length} added pets claimed at level 1 with moves`);

  clock += 86400;
  const outside = 1094; // 列特: wild at 熔岩大地, not in the pool
  assert.ok(!pool.includes(outside));
  const count = player.PetManager.PetData.PetList.length;
  assert.equal((await claim(outside)).error, 5001, 'Pets outside the pool are refused');
  assert.equal(player.PetManager.PetData.PetList.length, count);
  results.push('Pets outside the pool are refused');

  console.log(JSON.stringify({passed: results.length, results, database: 'temporary-only'}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  Date.now = realNow;
  if (player) { player.Data.cleanup(); helper.RemoveCache(player.Uid); player.EventBus.Destroy(); }
  await db.Shutdown();
  fs.rmSync(temporary, {recursive: true, force: true});
  process.exit(process.exitCode || 0);
});
