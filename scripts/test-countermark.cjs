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
const CM = load('GameServer/Game/Pet/Countermarks');
const {SelectWildOpponent} = load('GameServer/Game/Battle/RareEncounters');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-countermark-'));
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance, players = [], results = [];
const realNow = Date.now, realRandom = Math.random;
let clock = 1950000000, uid = 417000;
Date.now = () => clock * 1000;
function clean(player) {player.Data.cleanup(); helper.RemoveCache(player.Uid);}
async function fixture(petId = 7, level = 40, coins = 10000, items = []) {
  const id = ++uid;
  await db.Execute('INSERT INTO players VALUES (?, ?, 7, 123, 1, ?)', [id, coins, level]);
  const player = Object.create(PlayerInstance.prototype), packets = [];
  Object.assign(player, {Uid: id, Data: new PlayerData(Object.assign(createDefaultPlayerInfo(id, 'CountermarkSmoke'), {coins, gold: 7, allocatableExp: 123, mapID: 5})),
    EventBus: new GameEventBus(), SendPacket: async packet => {packets.push({command: packet.getCmdId(), result: packet.getResult(), body: packet.serialize('xin-20261013')});}});
  player._session = {Socket: {destroyed: false}, Player: player};
  player.PetManager = new PetManager(player); player.ItemManager = new ItemManager(player);
  player.MapSpawnManager = new MapSpawnManager(player); player.BattleManager = new BattleManager(player);
  await player.PetManager.Initialize(); await player.ItemManager.Initialize();
  const pet = Object.assign(createDefaultPetInfo(id, petId), {level, catchTime: clock - 100, isInBag: true, isDefault: true, skillArray: [10001]});
  PetCalculator.UpdatePetStats(pet);
  pet.hp=pet.maxHp;
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

  await run('purchase concurrency and limit include equipment', async () => {
    const p=await fixture(7,100); const outcomes=await Promise.allSettled([CM.Operate(p,1,0,10001,0),CM.Operate(p,1,0,10001,0)]);
    assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1); assert.equal(p.Data.coins,9000);
    await CM.Operate(p,2,p.PetManager.PetData.PetList[0].catchTime,10001,0);
    await assert.rejects(CM.Operate(p,1,0,10001,0)); assert.equal(p.Data.coins,9000);
  });
  await run('stats, replacement, uninstall and reload retain inventory',async()=>{
    const p=await fixture(7,100),pet=p.PetManager.PetData.PetList[0],base=PetCalculator.CalculateStatsFromPet(pet);
    await CM.Operate(p,1,0,10001,0);await CM.Operate(p,1,0,10002,0);await CM.Operate(p,2,pet.catchTime,10001,0);
    let current=p.PetManager.PetData.PetList[0];assert.equal(PetCalculator.CalculateStatsFromPet(current).atk,base.atk+5);
    PetCalculator.UpdatePetStats(current);PetCalculator.UpdatePetStats(current);assert.equal(current.atk,base.atk+5);
    const init=new (load('GameServer/Game/Battle/services/BattleInitService').BattleInitService)(p);
    const battlePet=init.BuildPlayerBattlePet({pet:current,config:{},type:0,skills:[10001]});assert.equal(battlePet.attack,base.atk+5);
    assert.equal(init.BuildPlayerBattlePet({pet:current,config:{},type:0,skills:[10001]}).attack,base.atk+5);
    await CM.Operate(p,2,pet.catchTime,10002,0);current=p.PetManager.PetData.PetList[0];assert.equal(current.atk,base.atk);assert.equal(current.def,base.def+5);
    await CM.Operate(p,3,pet.catchTime,0,0);assert.equal(p.PetManager.PetData.PetList[0].def,base.def);
    await CM.Operate(p,2,pet.catchTime,10001,0);const state=await saved(p);
    assert.equal(state.pets[0].countermarks.ability,10001);assert.equal(state.wallet.coins,8000);
    helper.RemoveCache(p.Uid);const reloaded=new PetManager(p);await reloaded.Initialize();assert.equal(reloaded.PetData.PetList[0].countermarks.ability,10001);
    assert.match(await CM.Snapshot(p),/id="10002" count="1"/);
    assert.equal(PetCalculator.CalculateStatsFromPet({...current,level:99}).atk,PetCalculator.CalculateStatsFromPet({...current,level:99,countermarks:{ability:0,skill:0}}).atk);
  });
  await run('insufficient funds, failed transaction, ownership, slot, battle and minimum level',async()=>{
    const p=await fixture(7,100,500),time=p.PetManager.PetData.PetList[0].catchTime;
    await assert.rejects(CM.Operate(p,1,0,10001,0));assert.equal(p.Data.coins,500);
    p.Data.coins=10000;await db.Execute('UPDATE players SET coins=10000 WHERE user_id=?',[p.Uid]);
    await db.Execute("CREATE TRIGGER reject_countermark BEFORE UPDATE ON players BEGIN SELECT RAISE(ABORT,'synthetic wallet failure'); END");
    await assert.rejects(CM.Operate(p,1,0,10001,0));assert.equal((await db.Query('SELECT * FROM player_countermarks WHERE owner_id=?',[p.Uid])).length,0);assert.equal(p.Data.coins,10000);
    await db.Execute('DROP TRIGGER reject_countermark');await CM.Operate(p,1,0,10001,0);
    await assert.rejects(CM.Operate(p,2,time+1,10001,0));await assert.rejects(CM.Operate(p,2,time,10001,1));
    p.PetManager.PetData.PetList[0].level=99;await assert.rejects(CM.Operate(p,2,time,10001,0));
    p.BattleManager._currentBattle={};await assert.rejects(CM.Operate(p,1,0,10002,0));await CM.Operate(p,0,0,0,0);
  });
  await run('skill modifiers isolated by actor and move, disabled below 100',async()=>{
    const skill={id:10001,power:40,priority:0};const p={petId:7,level:100,countermarks:{skill:20001}};
    assert.equal(CM.Skill(p,skill).priority,1);assert.equal(skill.priority,0);assert.equal(CM.Skill({...p,countermarks:{skill:0}},skill).priority,0);
    assert.equal(CM.Skill({...p,level:99},skill).priority,0);assert.equal(CM.Skill(p,{...skill,id:10008}).priority,0);
    assert.equal(CM.Skill({...p,countermarks:{skill:20002}},{id:10008,power:40,priority:1}).power,55);
  });
  await run('HP never healed by equip cycles and cross-pet ownership',async()=>{
    const p=await fixture(7,100),pet=p.PetManager.PetData.PetList[0],hp=pet.maxHp;
    await CM.Operate(p,1,0,10006,0);pet.hp=17;pet.skillPP={10001:3};
    await CM.Operate(p,2,pet.catchTime,10006,0);assert.equal(pet.hp,17);assert.equal(pet.maxHp,hp+10);assert.equal(pet.skillPP[10001],3);
    for(let i=0;i<3;i++){await CM.Operate(p,3,pet.catchTime,0,0);await CM.Operate(p,2,pet.catchTime,10006,0);assert.equal(pet.hp,17);}
    const other={...pet,catchTime:pet.catchTime+1,countermarks:{ability:0,skill:0}};p.PetManager.PetData.PetList.push(other);
    await assert.rejects(CM.Operate(p,2,other.catchTime,10006,0));assert.equal(other.countermarks.ability,0);
    pet.hp=0;await CM.Operate(p,3,pet.catchTime,0,0);assert.equal(pet.hp,0);await CM.Operate(p,2,pet.catchTime,10006,0);assert.equal(pet.hp,0);
  });
  await run('PvP creation, switches and actual executor keep per-actor skills',async()=>{
    const a=await fixture(7,100),b=await fixture(7,100);const pa=a.PetManager.PetData.PetList[0],pb=b.PetManager.PetData.PetList[0];
    await CM.Operate(a,1,0,20001,0);await CM.Operate(a,2,pa.catchTime,20001,1);
    const service=a.BattleManager._pvpService;service._initService=new (load('GameServer/Game/Battle/services/BattleInitService').BattleInitService)(a);
    const battle=await service.CreateBattle(a,b);assert(battle);assert.equal(battle.player.countermarks.skill,20001);assert.equal(battle.enemy.countermarks.skill,0);
    const exec=load('GameServer/Game/Battle/BattleTurnExecutor').BattleTurnExecutor;
    const core=load('GameServer/Game/Battle/BattleCore').BattleCore;
    const old=core.CalculateDamage,seen=[];core.CalculateDamage=(attacker,defender,skill,...rest)=>{seen.push({pet:attacker,skill});return old.call(core,attacker,defender,skill,...rest);};
    try {new (load('GameServer/Game/Battle/services/BattleTurnService').BattleTurnService)().ExecuteTurn(battle,10001,10001);}finally{core.CalculateDamage=old;}
    assert(seen.some(x=>x.pet===battle.player&&x.skill.priority===1));assert(seen.some(x=>x.pet===battle.enemy&&x.skill.priority===0));
    await CM.Operate(a,1,0,20002,0);await CM.Operate(a,2,pa.catchTime,20002,1);pa.skillArray=[10008];pb.skillArray=[10008];
    const powered=await service.CreateBattle(a,b),seenPower=[];core.CalculateDamage=(attacker,defender,skill,...rest)=>{seenPower.push({pet:attacker,skill});return old.call(core,attacker,defender,skill,...rest);};
    try {new (load('GameServer/Game/Battle/services/BattleTurnService').BattleTurnService)().ExecuteTurn(powered,10008,10008);}finally{core.CalculateDamage=old;}
    assert(seenPower.some(x=>x.pet===powered.player&&x.skill.power===55));assert(seenPower.some(x=>x.pet===powered.enemy&&x.skill.power===40));assert.equal(GameConfig.GetSkillById(10008).Power,40);
    await CM.Operate(a,2,pa.catchTime,20001,1);
    a.BattleManager.UpdateBattlePet(battle.player,pb,GameConfig.GetPetById(pb.petId));assert.equal(battle.player.countermarks.skill,0);
    pa.level=99;a.BattleManager.UpdateBattlePet(battle.player,pa,GameConfig.GetPetById(pa.petId));assert.equal(CM.Skill(battle.player,{id:10001,power:40,priority:0}).priority,0);
    pa.level=100;a.BattleManager.UpdateBattlePet(battle.player,pa,GameConfig.GetPetById(pa.petId));assert.equal(CM.Skill(battle.player,{id:10001,power:40,priority:0}).priority,1);
  });
  await run('dirty battle HP PP rewards survive equipment transaction and reload',async()=>{
    const p=await fixture(7,100),pet=p.PetManager.PetData.PetList[0];await CM.Operate(p,1,0,10001,0);
    pet.hp=21;pet.skillPP={10001:7};p.Data.coins+=123;p.Data.gold+=9;p.Data.allocatableExp+=17;
    await CM.Operate(p,2,pet.catchTime,10001,0);await helper.SavePetData(p.PetManager.PetData,true);
    const state=await saved(p);assert.equal(state.pets[0].hp,21);assert.equal(state.pets[0].skillPP[10001],7);assert.equal(state.pets[0].countermarks.ability,10001);
    assert.deepEqual(state.wallet,{coins:9123,gold:16,allocatable_exp:140});
  });
  await run('countermark transactions and battle starts are mutually excluded',async()=>{
    const p=await fixture(7,100);p.BattleManager._battleActionsInProgress=1;await assert.rejects(CM.Operate(p,1,0,10001,0));p.BattleManager._battleActionsInProgress=0;
    const original=db.WithConnection;let attempted=false,started=false;
    db.WithConnection=async function(work){return original.call(this,async d=>{const proxy=new Proxy(d,{get(target,key){if(key==='query')return async(sql,args)=>{if(!attempted&&sql.startsWith('SELECT coins,gold')){attempted=true;await p.BattleManager.RunBattleAction(2401,async()=>{started=true;});}return target.query(sql,args);};const value=target[key];return typeof value==='function'?value.bind(target):value;}});return work(proxy);});};
    try{await CM.Operate(p,1,0,10001,0);}finally{db.WithConnection=original;}
    assert(attempted);assert.equal(started,false);assert.equal(p.Data.coins,9000);
  });
  await run('wire length and full XML response',async()=>{
    const p=await fixture(7,100);const b=Buffer.alloc(20);b.writeUInt32BE(900002);await new PetCollectHandler().Handle(p.Session,{},b);
    const r=p.packets.at(-1).body;assert.equal(r.readUInt32BE(0),900002);assert.equal(r.readUInt32BE(4),0);assert.match(r.subarray(8).toString(),/^<countermarks/);
    await new PetCollectHandler().Handle(p.Session,{},b.subarray(0,8));assert.equal(p.packets.at(-1).body.readUInt32BE(4),5001);
    await new PetCollectHandler().Handle(p.Session,{},b.subarray(0,4));assert.equal(p.packets.at(-1).body.readUInt32BE(4),5001);
  });
  console.log(JSON.stringify({passed:results.length,results}));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{for(const p of players)clean(p);Date.now=realNow;Math.random=realRandom;await db.Shutdown();fs.rmSync(temporary,{recursive:true,force:true});process.exit(process.exitCode||0);});
