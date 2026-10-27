'use strict';
// Real handlers and an isolated SQLite database; no production account or game data.
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
if (!process.argv[2]) throw Error('Usage: node test-puni-settlement.cjs <app>');
const app = path.resolve(process.argv[2]); process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const {Logger} = load('shared/utils');
for (const name of ['Info','Debug','Warn']) Logger[name] = () => {};
const {Config} = load('shared/config/ServerConfig');
const {ConfigLoader} = load('shared/config/ConfigLoader');
const {ConfigRegistry} = load('shared/config/ConfigRegistry');
const {GetGameConfigRegistrations} = load('shared/config/ConfigDefinitions');
const {DatabaseManager} = load('DataBase/DatabaseManager');
const {DatabaseHelper} = load('DataBase/DatabaseHelper');
const {MigrationRunner} = load('DataBase/migrations/MigrationRunner');
const {DataSaver} = load('DataBase/savers/DataSaver');
const {DataCache} = load('DataBase/cache/DataCache');
const {DataConfigRegistry} = load('DataBase/config/DataConfig');
const {ChallengeProgressDataAccessor} = load('DataBase/accessors/ChallengeProgressDataAccessor');
const {AccountRepository} = load('DataBase/repositories/Player/AccountRepository');
const {PlayerRepository} = load('DataBase/repositories/Player/PlayerRepository');
const {PlayerInstance} = load('GameServer/Game/Player/PlayerInstance');
const {ChallengeBossHandler} = load('GameServer/Server/Packet/Recv/Battle/ChallengeBossHandler');
const {createDefaultPetInfo} = load('shared/models/PetModel');
const {PetCalculator} = load('GameServer/Game/Pet/PetCalculator');
const {ReconcilePetPP} = load('GameServer/Game/Pet/PetPP');
const db = DatabaseManager.Instance, dir = fs.mkdtempSync(path.join(os.tmpdir(), 'puni-settlement-'));
const timers = [], players = [], originalSetInterval = global.setInterval;
global.setInterval = (...args) => { const timer = originalSetInterval(...args); timers.push(timer); return timer; };
async function main() {
  ConfigLoader.Instance._configDir = path.join(app, 'config'); ConfigLoader.Instance.Reload();
  Config.Config.database = {type:'sqlite', path:path.join(dir, 'game.sqlite')}; Config.Game.clientProtocol = 'xin-20261013';
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations()); await ConfigRegistry.Instance.Initialize();
  await load('shared/config/game/SkillEffectsConfig').SkillEffectsConfig.Instance.Load();
  await db.Initialize(); await new MigrationRunner().RunAll();
  const uid = await new AccountRepository().CreateAccount(crypto.randomBytes(8).toString('hex')+'@smoke.invalid', crypto.createHash('md5').update('isolated').digest('hex'));
  await new PlayerRepository().CreatePlayer(uid, 'PuniTest', 0x3399cc);
  await new AccountRepository().UpdateRoleCreated(uid, true);
  async function login() {
    const session = {Socket:{destroyed:false, write:()=>true}};
    const player = new PlayerInstance(session, uid, {}); session.Player = player; player.packets=[];
    player.SendPacket = async packet => player.packets.push({command:packet.getCmdId(), result:packet.getResult(), body:packet.serialize('xin-20261013')});
    await player.Initialize(); players.push(player); return player;
  }
  let player = await login();
  const now = Math.floor(Date.now()/1000);
  const pets = Array.from({length:6}, (_, index) => {
    const pet = Object.assign(createDefaultPetInfo(uid, 70), {level:100, obtainLevel:100, catchTime:now-100-index, isInBag:true, isDefault:index===0, dvHp:31,dvAtk:31,dvDef:31,dvSpAtk:31,dvSpDef:31,dvSpeed:31,evHp:255,evSpeed:255,nature:0,skillArray:[10037]});
    PetCalculator.UpdatePetStats(pet); pet.skillPP = ReconcilePetPP(pet); return pet;
  });
  player.PetManager.PetData.PetList=pets; await DatabaseHelper.Instance.SavePetData(player.PetManager.PetData, true);
  const handler = new ChallengeBossHandler();
  async function challenge(door) {
    player.Data.mapID=108; player.packets.length=0;
    const body=Buffer.alloc(4); body.writeUInt32BE(door); await handler.Handle(player._session, {}, body);
    return {packet:player.packets.find(p=>p.command===2411), battle:player.BattleManager.GetCurrentBattle()};
  }
  let r=await challenge(2); assert.equal(r.packet.result,11027); assert.ok(!r.battle);
  r=await challenge(1); assert.equal(r.packet.result,0); assert.equal(r.battle.bossMapId,514);
  await player.BattleManager.HandleReadyToFight();
  // Accelerate this settlement regression; combat attributes are deliberately boosted.
  r.battle.player.hp = r.battle.player.maxHp = 100000;
  r.battle.player.attack = 10000;
  for (let i=0; i<100 && player.BattleManager.GetCurrentBattle()===r.battle; i++) {
    if (r.battle.player.hp<=0 || !r.battle.player.skillPP[0]) {
      const next=player.PetManager.GetPetsInBag().find(pet=>pet.hp>0 && pet.catchTime!==r.battle.player.catchTime && pet.skillPP[0]>0);
      if (!next) break;
      await player.BattleManager.HandleChangePet(next.catchTime);
    } else await player.BattleManager.HandleUseSkill(10037);
  }
  assert.ok(r.battle.enemy.hp<=0, 'Actual first-seal combat must end in victory');
  assert.equal(player.ItemManager.GetItemCount(400651),1,'First victory grants void fragment');
  assert.equal(player.ChallengeProgressManager.GetPuniLevel(),1,'First victory unlocks seal two');
  await player.OnLogout();
  await new Promise(resolve=>setTimeout(resolve,300));
  await DataSaver.Instance.WaitForSaves();
  ChallengeProgressDataAccessor.Instance.RemoveCache(uid);
  for (const type of DataConfigRegistry.Instance.GetAllTypes()) DataCache.Instance.Remove?.(type, uid);
  const [row]=await db.Query('SELECT max_puni_lv FROM player_challenge_progress WHERE user_id=?',[uid]);
  const [items]=await db.Query('SELECT item_list FROM player_items WHERE owner_id=?',[uid]);
  assert.equal(row.max_puni_lv,1); assert.ok(JSON.parse(items.item_list).some(item=>item.itemId===400651&&item.count===1));
  player=await login(); assert.equal(player.ChallengeProgressManager.GetPuniLevel(),1); assert.equal(player.ItemManager.GetItemCount(400651),1);
  r=await challenge(2); assert.equal(r.packet.result,0); assert.equal(r.battle.bossParam2,2);
  console.log(JSON.stringify({firstSeal:'real turns with boosted test combat attributes',fragment:400651,progress:1,relogin:true,secondSeal:'opened',database:'isolated SQLite'}));
}
(async()=>{try {await main();} finally {for (const player of players) {if (player.BattleManager?.GetCurrentBattle()) player.BattleManager.CleanupBattle(); await player.OnLogout(); ChallengeProgressDataAccessor.Instance.RemoveCache(player.Uid);} for (const timer of timers) clearInterval(timer); await new Promise(resolve=>setTimeout(resolve,300)); await DataSaver.Instance.WaitForSaves(); await db.Shutdown(); global.setInterval=originalSetInterval; fs.rmSync(dir,{recursive:true,force:true});}})().catch(error=>{console.error(error);process.exitCode=1;});
