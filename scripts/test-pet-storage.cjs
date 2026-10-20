'use strict';
// Use real grant/takeout handlers and a temporary SQLite database, never a live account.
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
const {GameEventBus} = load('GameServer/Game/Event/GameEventBus');
const {createDefaultPetInfo} = load('shared/models/PetModel');
const {createDefaultPlayerInfo} = load('shared/models/PlayerModel');
const {PetCalculator} = load('GameServer/Game/Pet/PetCalculator');
const {GrantFreshTowerStarter} = load('GameServer/Game/Battle/FreshTower');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-pet-storage-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance, players = [];
const realNow = Date.now;
let clock = 1950000000, uid = 419000;
Date.now = () => clock * 1000;
async function fixture(count) {
  clock += 100;
  const id = ++uid, packets = [];
  await db.Execute('INSERT INTO players VALUES (?,10000,0,0,0,0)', [id]);
  const player = Object.create(PlayerInstance.prototype);
  Object.assign(player, {Uid:id, Data:new PlayerData(createDefaultPlayerInfo(id, 'StorageSmoke')), EventBus:new GameEventBus(),
    SendPacket:async packet => packets.push({command:packet.getCmdId(), result:packet.getResult(), body:packet.serialize()})});
  player._session = {Socket:{destroyed:false}, Player:player};
  player.PetManager = new PetManager(player);
  await player.PetManager.Initialize();
  const ids = [216,70,261,309,303].slice(0,count);
  ids.push(12);
  player.PetManager.PetData.PetList = ids.map((petId,index) => {
    const pet = Object.assign(createDefaultPetInfo(id,petId), {level:5,catchTime:clock-20+index,
      isInBag:index<count,isDefault:count>0 && index===0,skillArray:[10001]});
    PetCalculator.UpdatePetStats(pet);
    return pet;
  });
  await helper.SavePetData(player.PetManager.PetData,true);
  players.push(player);
  return Object.assign(player,{packets});
}
async function saved(player) {
  const [row] = await db.Query('SELECT pet_list FROM player_pets WHERE owner_id=?',[player.Uid]);
  return JSON.parse(row.pet_list);
}
(async () => {
  ConfigLoader.Instance._configDir = path.join(app,'config'); ConfigLoader.Instance.Reload();
  Config.Config.database = {type:'sqlite',path:path.join(temporary,'storage.sqlite')};
  Config.Game.clientProtocol = 'kose';
  for (const key of [ConfigKeys.PET_CONFIG,ConfigKeys.SKILL_CONFIG,ConfigKeys.SPT_CONFIG]) ConfigRegistry.Instance.Register(key,ConfigPaths[key],ConfigType.XML);
  for (const key of [ConfigKeys.NATURES_CONFIG,ConfigKeys.PET_ABILITIES,ConfigKeys.ELEMENTS_CONFIG]) if(key) ConfigRegistry.Instance.Register(key,ConfigPaths[key],ConfigType.JSON);
  await ConfigRegistry.Instance.Initialize(); await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL,pet_all_num INTEGER NOT NULL,pet_max_lev INTEGER NOT NULL)');
  const petSQL = new (load('DataBase/migrations/scripts/012_fix_all_tables').Migration012FixAllTables)().upSQLite().find(sql=>sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'));
  await db.Execute(petSQL);
  const player = await fixture(5), manager = player.PetManager;
  await GrantFreshTowerStarter(player);
  assert.equal(manager.PetData.GetPetsInBag().length,5,'Tower reward must not silently occupy the visible empty bag slot');
  for(const id of [1,4,7]) assert.equal(manager.PetData.GetPet(id).isInBag,false);
  const stored = manager.PetData.GetPet(12);
  await manager.HandlePetTakeOut(stored.catchTime);
  assert.equal(player.packets.at(-1).command,2304);
  assert.equal(player.packets.at(-1).result,0,'Taking a stored pet into the sixth slot must succeed');
  assert.equal(player.packets.at(-1).body.readUInt32BE(8),1);
  assert.equal((await saved(player)).find(p=>p.catchTime===stored.catchTime).isInBag,true);
  const blocked = manager.PetData.GetPet(7);
  await manager.HandlePetTakeOut(blocked.catchTime);
  assert.equal(player.packets.at(-1).result,5001,'A genuinely full six-pet bag must still reject takeout');
  assert.equal((await saved(player)).find(p=>p.catchTime===blocked.catchTime).isInBag,false);
  console.log('PASS tower rewards preserve the sixth slot; takeout persists; full-bag guard remains');
  const before = (await saved(player)).map(p=>p.catchTime).sort();
  await GrantFreshTowerStarter(player);
  assert.deepEqual((await saved(player)).map(p=>p.catchTime).sort(),before,'Repeated tower completion must not duplicate rewards');
  const empty = await fixture(0);
  await GrantFreshTowerStarter(empty);
  assert.equal(empty.PetManager.PetData.GetPetsInBag().length,0);
  assert.equal(empty.PetManager.PetData.PetList.some(p=>p.isDefault),false,'Stored rewards must not become the default fighter');
  const first = empty.PetManager.PetData.GetPet(1);
  await empty.PetManager.HandlePetTakeOut(first.catchTime);
  assert.equal(empty.packets.at(-1).result,0);
  assert.equal(empty.packets.at(-1).body.readUInt32BE(4),first.catchTime);
  console.log('PASS repeated rewards remain unique; first takeout becomes default');
  const normal = await fixture(0);
  assert.equal(await normal.PetManager.GivePet(7,5,clock+20),true);
  const regular = (await saved(normal)).find(p=>p.petId===7);
  assert.equal(regular.isInBag,true); assert.equal(regular.isDefault,true);
  console.log('PASS ordinary grants keep existing bag placement');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  Date.now=realNow;
  for(const player of players){player.Data.cleanup();helper.RemoveCache(player.Uid);}
  await db.Shutdown(); fs.rmSync(temporary,{recursive:true,force:true}); process.exit(process.exitCode||0);
});
