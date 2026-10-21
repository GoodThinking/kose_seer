'use strict';
// Exercise real login loading, strict SQLite persistence, configured growth, and native protocol fields.
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), Module = require('node:module');
const [appArgument, releaseArgument, evidenceArgument] = process.argv.slice(2);
if (!appArgument || !releaseArgument) throw Error('Usage: node test-pet-experience-normalize.cjs APP RELEASE [EVIDENCE]');
const app = path.resolve(appArgument), release = path.resolve(releaseArgument);process.chdir(app);
const load = relative => require(path.join(app,'dist',relative));
function overlay(relative) {
  const filename = path.join(app,'dist',relative), module = new Module(filename);
  module.filename = filename;module.paths = Module._nodeModulePaths(path.dirname(filename));
  module._compile(fs.readFileSync(path.join(release,'app/dist',relative),'utf8'),filename);
  module.loaded = true;require.cache[filename] = module;return module.exports;
}
load('DataBase/loaders/DataLoader');
const {Config} = load('shared/config/ServerConfig');
const {ConfigRegistry} = load('shared/config/ConfigRegistry');
const {ConfigKeys,ConfigPaths,ConfigType} = load('shared/config/ConfigDefinitions');
const {DatabaseManager} = load('DataBase/DatabaseManager');
const {DatabaseHelper} = load('DataBase/DatabaseHelper');
const {DataCache} = load('DataBase/cache/DataCache');
const {PlayerInstance} = load('GameServer/Game/Player/PlayerInstance');
const {GameEventBus} = load('GameServer/Game/Event/GameEventBus');
const {PetCalculator} = load('GameServer/Game/Pet/PetCalculator');
const {createDefaultPetInfo} = load('shared/models/PetModel');
const {GetPetExperienceFields} = overlay('GameServer/Game/Pet/PetExperienceProjection.js');
const {PetManager} = overlay('GameServer/Game/Pet/PetManager.js');
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
const dir = fs.mkdtempSync(path.join(os.tmpdir(),'pet-exp-normalize-')), uid = 497026;
const passed = [], players = [];
function pet(petId,level,exp,catchTime,extra={}) {
  const value = Object.assign(createDefaultPetInfo(uid,petId),{level,exp,catchTime,nature:3,
    dvHp:31,dvAtk:31,dvDef:31,dvSpAtk:31,dvSpDef:31,dvSpeed:31,skillArray:[],...extra});
  PetCalculator.UpdatePetStats(value);return value;
}
function player(owner) {
  DataCache.Instance.Set('player',owner,{petAllNum:0,petMaxLev:0});
  const value = Object.create(PlayerInstance.prototype);Object.defineProperty(value,'Uid',{value:owner});
  Object.defineProperty(value,'ClientProtocol',{value:'xin-20261013'});
  value.EventBus = new GameEventBus();value.packets = [];value.SendPacket = async packet => value.packets.push(packet);
  value.PetManager = new PetManager(value);players.push(value);return value;
}
const stored = async owner => JSON.parse((await db.Query('SELECT pet_list FROM player_pets WHERE owner_id=?',[owner]))[0].pet_list);
(async()=>{
  Config.Config.database = {type:'sqlite',path:path.join(dir,'experience.sqlite')};
  for (const key of [ConfigKeys.PET_CONFIG,ConfigKeys.SKILL_CONFIG,ConfigKeys.SPT_CONFIG]) ConfigRegistry.Instance.Register(key,ConfigPaths[key],ConfigType.XML);
  ConfigRegistry.Instance.Register(ConfigKeys.NATURES_CONFIG,ConfigPaths[ConfigKeys.NATURES_CONFIG],ConfigType.JSON);
  await ConfigRegistry.Instance.Initialize();await db.Initialize();
  await db.Execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY,pet_all_num INTEGER NOT NULL,pet_max_lev INTEGER NOT NULL)');
  const ddl = new (load('DataBase/migrations/scripts/012_fix_all_tables').Migration012FixAllTables)().upSQLite().find(sql=>sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'));
  await db.Execute(ddl);await db.Execute('INSERT INTO players VALUES (?,0,0),(?,0,0)',[uid,uid+1]);
  const ray = pet(70,94,13317,1900026001,{evAtk:255,evSpeed:255});
  const karu = pet(318,82,459692,1900026002,{evAtk:255,evHp:255,isInBag:false});
  const exact = pet(318,20,PetCalculator.ExpForNextLevel(20,318),1900026003);
  const below = pet(318,20,PetCalculator.ExpForNextLevel(20,318)-1,1900026004);
  const capped = pet(318,100,11060,1900026005);
  const original = [ray,karu,exact,below,capped];
  await db.Execute('INSERT INTO player_pets (owner_id,pet_list) VALUES (?,?),(?,?)',[uid,JSON.stringify(original),uid+1,JSON.stringify([karu])]);
  const current = player(uid);await current.PetManager.Initialize();
  const result = await stored(uid), recovered = result[1];
  assert.equal(recovered.level,100);assert.equal(recovered.exp,11060);assert.equal(recovered.catchTime,karu.catchTime);assert.equal(recovered.isInBag,false);
  assert.equal(recovered.dvAtk,31);assert.equal(recovered.evAtk,255);assert.equal(recovered.evHp,255);assert.ok(recovered.atk>karu.atk);assert.equal(recovered.hp,recovered.maxHp);
  passed.push('Legacy stored experience raises warehouse Karukus 82 to 100, retaining overflow, identity and training');
  assert.deepEqual(result[0],ray);assert.deepEqual(result[3],below);assert.deepEqual(result[4],capped);
  passed.push('Valid Ray, below-threshold pet and already-capped surplus remain unchanged');
  assert.equal(result[2].level,21);assert.equal(result[2].exp,0);passed.push('Exact level boundary advances once with no lost or fabricated experience');
  assert.deepEqual(current.packets,[]);passed.push('Login normalization sends no premature award or skill notifications');
  const proto = current.PetManager.GetPetProtoList([current.PetManager.GetPetByCatchTime(ray.catchTime)])[0];
  assert.equal(proto.exp,843900);assert.equal(proto.lvExp,830583);assert.equal(proto.nextLvExp,857374);
  passed.push('Native Ray protocol retains correct 13474 experience remaining');
  for (const protocol of ['xin-20261013','nieo']) {
    const max = GetPetExperienceFields(recovered,protocol);
    assert.equal(max.nextLvExp-max.exp,0);
  }
  passed.push('Both native protocol modes show zero experience remaining at level 100 without discarding saved overflow');
  await new Promise(resolve=>setTimeout(resolve,200));
  helper.RemoveCache(uid);await db.Shutdown();await db.Initialize();
  const again = player(uid);await again.PetManager.Initialize();assert.deepEqual(await stored(uid),result);
  passed.push('Reconnection and database restart are idempotent');
  assert.equal((await stored(uid+1))[0].level,82);passed.push('Unloaded accounts are not bulk rewritten');
  await db.Execute(`CREATE TRIGGER reject_normalization BEFORE UPDATE ON player_pets WHEN OLD.owner_id=${uid+1} BEGIN SELECT RAISE(ABORT,'normalization write rejected'); END`);
  const failing = player(uid+1);await assert.rejects(failing.PetManager.Initialize(),/normalization write rejected/);
  assert.equal(failing.PetManager.PetData.PetList[0].level,82);assert.equal((await stored(uid+1))[0].exp,459692);
  await db.Execute('DROP TRIGGER reject_normalization');await failing.PetManager.Initialize();
  assert.equal((await stored(uid+1))[0].level,100);passed.push('Failed persistence publishes no new level and releases mutation lock for retry');
  if (evidenceArgument) {const target=path.resolve(evidenceArgument);fs.mkdirSync(target,{recursive:true});fs.writeFileSync(path.join(target,'experience-proof.json'),JSON.stringify({passed,recovered:{level:recovered.level,exp:recovered.exp},rayRemaining:proto.nextLvExp-proto.exp},null,2)+'\n');}
  console.log(JSON.stringify({passed},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  await new Promise(resolve=>setTimeout(resolve,200));
  for (const value of players) {value.EventBus.Destroy();helper.RemoveCache(value.Uid);}await db.Shutdown();fs.rmSync(dir,{recursive:true,force:true});
});
