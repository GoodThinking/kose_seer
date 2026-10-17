'use strict';
// Exercise the deployed managers and SQLite persistence, never a live account.
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
const {GameConfig} = load('shared/config/game/GameConfig');
const {DatabaseManager} = load('DataBase/DatabaseManager');
const {DatabaseHelper} = load('DataBase/DatabaseHelper');
const {PlayerData} = load('DataBase/models/PlayerData');
const {PlayerInstance} = load('GameServer/Game/Player/PlayerInstance');
const {PetManager} = load('GameServer/Game/Pet/PetManager');
const {ItemManager} = load('GameServer/Game/Item/ItemManager');
const {MapSpawnManager} = load('GameServer/Game/Map/MapSpawnManager');
const {BattleManager} = load('GameServer/Game/Battle/BattleManager');
const {BattleCaptureSystem} = load('GameServer/Game/Battle/BattleCaptureSystem');
const {BossAbilityConfig} = load('GameServer/Game/Battle/BossAbility/BossAbilityConfig');
const {GameEventBus} = load('GameServer/Game/Event/GameEventBus');
const {createDefaultPetInfo} = load('shared/models/PetModel');
const {createDefaultPlayerInfo} = load('shared/models/PlayerModel');
const {PetCalculator} = load('GameServer/Game/Pet/PetCalculator');
const {PetCollectHandler} = load('GameServer/Server/Packet/Recv/Pet/PetCollectHandler');
const {ResolveEvolution} = load('GameServer/Game/Pet/SpecialEvolution');
const {SelectWildOpponent} = load('GameServer/Game/Battle/RareEncounters');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-pet-acquisition-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance, players = [], results = [];
const realNow = Date.now, realRandom = Math.random;
let clock = 1950000000, uid = 417000;
Date.now = () => clock * 1000;
function clean(player) {player.Data.cleanup(); helper.RemoveCache(player.Uid);}
async function fixture(petId = 7, level = 40, coins = 10000, items = []) {
  const id = ++uid;
  await db.Execute('INSERT INTO players VALUES (?, ?, 7, 123, 1, ?)', [id, coins, level]);
  const player = Object.create(PlayerInstance.prototype), packets = [];
  Object.assign(player, {Uid: id, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(id, 'AcquisitionSmoke'), {coins, gold: 7, allocatableExp: 123, mapID: 5})),
    EventBus: new GameEventBus(), SendPacket: async packet => {packets.push({command: packet.getCmdId(), result: packet.getResult(), body: packet.serialize('xin-20261013')});}});
  player._session = {Socket: {destroyed: false}, Player: player};
  player.PetManager = new PetManager(player); player.ItemManager = new ItemManager(player);
  player.MapSpawnManager = new MapSpawnManager(player); player.BattleManager = new BattleManager(player);
  await player.PetManager.Initialize(); await player.ItemManager.Initialize();
  const pet = Object.assign(createDefaultPetInfo(id, petId), {level, catchTime: clock - 100, isInBag: true, isDefault: true, skillArray: [10001]});
  PetCalculator.UpdatePetStats(pet);
  player.PetManager.PetData.PetList = [pet];
  player.ItemManager.ItemData.ItemList = items.map(item => ({expireTime: 0, ...item}));
  await helper.SavePetData(player.PetManager.PetData, true);
  await helper.SaveItemData(player.ItemManager.ItemData, true);
  Object.assign(player, {packets}); players.push(player);
  return player;
}
async function saved(player) {
  const [pets] = await db.Query('SELECT pet_list FROM player_pets WHERE owner_id = ?', [player.Uid]);
  const [items] = await db.Query('SELECT item_list FROM player_items WHERE owner_id = ?', [player.Uid]);
  const [wallet] = await db.Query('SELECT coins,gold,allocatable_exp FROM players WHERE user_id = ?', [player.Uid]);
  return {pets: JSON.parse(pets.pet_list), items: JSON.parse(items.item_list), wallet};
}
async function exchange(player, petId) {
  const body = Buffer.alloc(8); body.writeUInt32BE(900001); body.writeUInt32BE(petId, 4);
  await new PetCollectHandler().Handle(player.Session, {}, body);
  return player.packets.at(-1).body;
}
async function run(name, fn) {
  clock += 100;
  const first = players.length;
  try {await fn(); results.push(name);}
  finally {Math.random = realRandom; for (const player of players.slice(first)) clean(player);}
}
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config'); ConfigLoader.Instance.Reload();
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'acquisition.sqlite')};
  Config.Game.clientProtocol = 'xin-20261013';
  for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG, ConfigKeys.ITEM_CONFIG]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
  for (const key of [ConfigKeys.NATURES_CONFIG, ConfigKeys.MAP_OGRES, ConfigKeys.BOSS_ABILITIES, ConfigKeys.PET_ABILITIES, ConfigKeys.ELEMENTS_CONFIG]) if (key) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.JSON);
  await ConfigRegistry.Instance.Initialize(); await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL,pet_all_num INTEGER NOT NULL,pet_max_lev INTEGER NOT NULL)');
  const petSQL = new (load('DataBase/migrations/scripts/012_fix_all_tables').Migration012FixAllTables)().upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'));
  await db.Execute(petSQL);
  for (const sql of new (load('DataBase/migrations/scripts/006_create_items').Migration006CreateItems)().upSQLite()) await db.Execute(sql);
  await run('Neil disguise starts a level-16 battle; not a visible map replacement', async () => {
    const p = await fixture(7, 40, 10000, [{itemId:300001,count:1}]); p.Data.mapID = 21;
    Math.random = () => 0.01;
    const ogres = p.MapSpawnManager.GetMapOgres(21), slot = ogres.findIndex(o => o.petId === 33);
    assert.ok(slot >= 0, 'LiYaYu encounter must exist');
    await p.BattleManager.HandleFightNpcMonster(slot);
    const battle = p.BattleManager.GetCurrentBattle();
    assert.equal(battle?.enemy.id, 77); assert.equal(battle.enemy.level, 16);
    assert.equal(p.BattleManager._currentBattleOriginalPetId, 77, 'Neil must not drop host materials');
    assert.equal(p.MapSpawnManager.GetMapOgres(21)[slot].petId, 33);
    assert.equal(BattleCaptureSystem.BossBlocksCapture(battle), false);
    assert.deepEqual(SelectWildOpponent(10, 164, 5, 164), [164, 5], 'Do not replace shiny encounters');
    Math.random = () => 0.08;
    assert.deepEqual(SelectWildOpponent(21, 33, 15, 33), [33, 15]);
    Math.random = () => 0.01;
    await p.BattleManager.HandleCatchMonster(300001);
    const caught = (await saved(p)).pets.find(pet => pet.petId === 77);
    assert.equal(caught?.level, 16);
    assert.equal(p.BattleManager.GetCurrentBattle(), null);
  });
  await run('Native bee and Dabira requests stay catchable; lion retains its own slot', async () => {
    const p = await fixture();
    for (const [mapId, param, petId, catchable] of [[26,0,153,true],[53,0,178,true],[53,1,187,false]]) {
      p.Data.mapID = mapId;
      await p.BattleManager.HandleChallengeBoss(mapId, param);
      const battle = p.BattleManager.GetCurrentBattle();
      assert.equal(battle?.enemy.id, petId);
      assert.equal(BattleCaptureSystem.BossBlocksCapture(battle), !catchable);
      p.BattleManager.CleanupBattle();
    }
  });
  await run('Restored map pools generate Bardo, fire-crystal and crystal-rock encounters', async () => {
    const p = await fixture();
    for (const [mapId, random, petId] of [[16,0.99,133],[55,0.01,208],[55,0.99,203]]) {
      Math.random = () => random;
      p.MapSpawnManager.OnEnterMap(mapId);
      const ids = p.MapSpawnManager.GetMapOgres(mapId).filter(ogre=>ogre.petId).map(ogre=>ogre.petId);
      assert.ok(ids.includes(petId), 'Restored species must be emitted by the real spawn manager: '+petId);
    }
  });
  await run('Mechanical evolution preserves identity and normal level evolution remains valid', async () => {
    const p = await fixture(59, 38);
    const time = p.PetManager.PetData.PetList[0].catchTime;
    await p.PetManager.HandlePetEvolution(time, 1);
    assert.equal((await saved(p)).pets[0].petId, 60);
    await p.PetManager.HandlePetEvolution(time, 1);
    const pet = (await saved(p)).pets[0]; assert.equal(pet.petId, 61); assert.equal(pet.catchTime, time);
    assert.deepEqual(ResolveEvolution(7, 1), {petId: 8, itemId: 0, count: 0});
  });
  for (const [index, material, target] of [[1,400004,92],[2,400008,93],[3,400003,94]]) await run('Yoyo branch ' + index + ' consumes exactly 20 materials', async () => {
    const p = await fixture(91, 20, 10000, [{itemId: material, count: 23}]);
    await p.PetManager.HandlePetEvolution(clock - 100, index);
    const state = await saved(p); assert.equal(state.pets[0].petId, target); assert.equal(state.items[0].count, 3);
    assert.equal(p.ItemManager.GetItemCount(material), 3);
  });
  await run('Invalid branch, insufficient level and missing material never mutate pet or wallet', async () => {
    for (const [level, stock, index] of [[19,20,1],[20,19,1],[20,20,4],[20,20,0]]) {
      const p = await fixture(91, level, 10000, [{itemId:400004,count:stock}]); const before = await saved(p);
      await p.PetManager.HandlePetEvolution(clock - 100, index);
      assert.equal(p.packets.at(-1).result, 5001); assert.deepEqual(await saved(p), before);
    }
  });
  await run('Evolution persistence failure rolls back materials and keeps original pet', async () => {
    const p = await fixture(91, 20, 10000, [{itemId:400004,count:20}]); const before = await saved(p);
    await db.Execute('CREATE TRIGGER reject_evolution BEFORE UPDATE ON player_pets WHEN NEW.owner_id='+p.Uid+" BEGIN SELECT RAISE(ABORT,'forced evolution failure'); END");
    await p.PetManager.HandlePetEvolution(clock - 100, 1);
    assert.equal(p.packets.at(-1).result, 5000); assert.deepEqual(await saved(p), before);
    assert.equal(p.PetManager.PetData.PetList[0].petId, 91); assert.equal(p.ItemManager.GetItemCount(400004), 20);
    await db.Execute('DROP TRIGGER reject_evolution');
  });
  await run('Retired event catalog exchanges persist level-1 storage pets and exact coin cost', async () => {
    const catalog = ConfigLoader.Instance.LoadJson('data/json/pet-acquisition.json').exchange;
    const p = await fixture(7, 40, 30000);
    for (const id of catalog.petIds) {const response = await exchange(p, id); assert.equal(response.readUInt32BE(12), 0); assert.equal(response.readUInt32BE(0), id);}
    const state = await saved(p);
    assert.deepEqual(state.pets.slice(1).map(pet=>pet.petId), catalog.petIds);
    assert.ok(state.pets.slice(1).every(pet=>pet.level===1&&!pet.isInBag));
    assert.equal(new Set(state.pets.map(pet=>pet.catchTime)).size, state.pets.length);
    assert.deepEqual(state.wallet, {coins:30000-1000*catalog.petIds.length,gold:7,allocatable_exp:123});
  });
  await run('Concurrent exchanges cannot spend the same final 1000 coins twice', async () => {
    const p = await fixture(7, 40, 1000);
    await Promise.all([exchange(p, 378), exchange(p, 445)]);
    const state = await saved(p); assert.equal(state.wallet.coins, 0); assert.equal(state.pets.length, 2);
    assert.deepEqual(p.packets.filter(p=>p.command===2311).map(p=>p.body.readUInt32BE(12)).sort((a,b)=>a-b), [0,10016]);
  });
  await run('Unknown pet, wrong map and insufficient funds are rejected without grant', async () => {
    for (const [mapId, coins, id, code] of [[5,999,378,10016],[21,10000,378,5001],[5,10000,300,5001]]) {
      const p = await fixture(7, 40, coins); p.Data.mapID=mapId; const before=await saved(p);
      assert.equal((await exchange(p,id)).readUInt32BE(12),code); assert.deepEqual(await saved(p),before);
    }
  });
  await run('Failed exchange debit rolls back the new pet and publishes no success', async () => {
    const p = await fixture(); const before=await saved(p);
    await db.Execute('CREATE TRIGGER reject_exchange BEFORE UPDATE ON players WHEN NEW.user_id='+p.Uid+" BEGIN SELECT RAISE(ABORT,'forced exchange failure'); END");
    assert.equal((await exchange(p,378)).readUInt32BE(12),5000); assert.deepEqual(await saved(p),before);
    assert.equal(p.Data.coins,10000); assert.equal(p.PetManager.PetData.PetList.length,1);
    await db.Execute('DROP TRIGGER reject_exchange');
  });
  console.log('ACQUISITION_SMOKE=' + JSON.stringify({passed: results.length, results, database:'temporary-only'}));
})().catch(error => {console.error(error); process.exitCode=1;}).finally(async () => {
  Math.random=realRandom; Date.now=realNow; for(const player of players)clean(player);
  await db.Shutdown(); fs.rmSync(temporary,{recursive:true,force:true}); process.exit(process.exitCode||0);
});
