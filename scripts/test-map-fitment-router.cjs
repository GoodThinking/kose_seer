'use strict';
// Real registered dispatcher, real player lifecycle and Socket close events; disposable SQLite, no listen or external network.
const assert=require('node:assert/strict'), fs=require('node:fs'), os=require('node:os'), path=require('node:path'), crypto=require('node:crypto');
const {Socket}=require('node:net'), {once}=require('node:events');
if(!process.argv[2])throw new Error('Usage: node test-map-fitment-router.cjs <candidate-app>');
const app=path.resolve(process.argv[2]);process.chdir(app);
const load=file=>require(path.join(app,'dist',file));
load('DataBase/loaders/DataLoader');
const {Config}=load('shared/config/ServerConfig'), {ConfigLoader}=load('shared/config/ConfigLoader');
const {ConfigRegistry}=load('shared/config/ConfigRegistry'), {GetGameConfigRegistrations}=load('shared/config/ConfigDefinitions');
const {DatabaseManager}=load('DataBase/DatabaseManager'), {MigrationRunner}=load('DataBase/migrations/MigrationRunner');
const {AccountRepository}=load('DataBase/repositories/Player/AccountRepository');
const {PlayerRepository}=load('DataBase/repositories/Player/PlayerRepository');
const {PlayerManager}=load('GameServer/Game/Player/PlayerManager'), {GameServer}=load('GameServer/GameServer');
const {SkillEffectsConfig}=load('shared/config/game/SkillEffectsConfig');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'map-fitment-router-')),db=DatabaseManager.Instance;
let server,manager;const sockets=[],players=[],intervals=[];
const originalSetInterval=global.setInterval;
global.setInterval=(...args)=>{const timer=originalSetInterval(...args);intervals.push(timer);return timer;};
function connect(port){
  const socket=new Socket();Object.defineProperty(socket,'remoteAddress',{value:'127.0.0.1'});Object.defineProperty(socket,'remotePort',{value:port});
  sockets.push(socket);server._server.emit('connection',socket);
  return server._sessionManager.GetSession(`127.0.0.1:${port}`);
}
async function close(session){
  const closed=once(session.Socket,'close');session.Socket.destroy();await closed;await Promise.all([...server._logouts]);
}
async function login(session,uid){
  const p=await manager.CreatePlayer(session,uid,'FitmentRoute');players.push(p);return p;
}
(async()=>{
  ConfigLoader.Instance._configDir=path.join(app,'config');ConfigLoader.Instance.Reload();
  Config.Config.database={type:'sqlite',path:path.join(tmp,'test.sqlite')};
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());await ConfigRegistry.Instance.Initialize();await SkillEffectsConfig.Instance.Load();await db.Initialize();
  const migrations=new MigrationRunner();await migrations.initMigrationTable();await migrations.RunAll();
  const account=new AccountRepository();
  const uid=await account.CreateAccount('fitment-'+crypto.randomBytes(8).toString('hex')+'@example.invalid',crypto.createHash('md5').update('FixtureOnly').digest('hex'));
  await new PlayerRepository().CreatePlayer(uid,'FitmentRoute',0x3399cc);await account.UpdateRoleCreated(uid,true);
  server=new GameServer();manager=PlayerManager.GetInstance();
  const first=connect(42001),player=await login(first,uid),packets=[];
  player.SendPacket=async packet=>packets.push({cmd:packet.getCmdId(),result:packet.getResult(),body:packet.serialize(player.ClientProtocol)});
  player.Data.mapID=344;const coins=player.Data.coins;
  const body=Buffer.alloc(8);body.writeUInt32BE(500640,0);body.writeUInt32BE(1,4);
  await server.ProcessPacket(first,{CmdID:10004,UserID:uid},body);
  assert.equal(manager.GetPlayer(uid),player);assert.equal(first.Player,player);
  assert.equal(packets.length,1);assert.equal(packets[0].cmd,10004);assert.equal(packets[0].result,0);
  assert.equal(packets[0].body.length,12);assert.equal(packets[0].body.readUInt32BE(0),coins);assert.equal(packets[0].body.readUInt32BE(4),500640);assert.equal(packets[0].body.readUInt32BE(8),1);
  const [saved]=await db.Query('SELECT item_list FROM player_items WHERE owner_id=?',[uid]);
  assert.equal(JSON.parse(saved.item_list).find(item=>item.itemId===500640).count,1);
  await server.ProcessPacket(first,{CmdID:10004,UserID:uid},body);
  assert.equal(packets.at(-1).result,103240);assert.equal(manager.GetPlayer(uid),player);
  await close(first);
  assert.equal(manager.GetPlayer(uid),undefined);assert.equal(first.Player,undefined);assert.equal(first.UserID,0);
  assert.equal(server._sessionManager.GetSession('127.0.0.1:42001'),undefined);
  const second=connect(42002),reloaded=await login(second,uid),responses=[];
  reloaded.SendPacket=async packet=>responses.push({cmd:packet.getCmdId(),result:packet.getResult(),body:packet.serialize(reloaded.ClientProtocol)});
  await server.ProcessPacket(second,{CmdID:10007,UserID:uid},Buffer.alloc(0));
  const listing=responses.at(-1);assert.equal(listing.cmd,10007);assert.equal(listing.result,0);
  const count=listing.body.readUInt32BE(0),found=[];
  for(let i=0;i<count;i++)found.push([listing.body.readUInt32BE(4+12*i),listing.body.readUInt32BE(8+12*i),listing.body.readUInt32BE(12+12*i)]);
  assert.deepEqual(found.find(item=>item[0]===500640),[500640,0,1]);
  const third=connect(42003),replacement=await login(third,uid);
  assert.equal(manager.GetPlayer(uid),replacement);await close(second);
  assert.equal(manager.GetPlayer(uid),replacement);assert.equal(third.Player,replacement);
  assert.equal(server._sessionManager.GetSession('127.0.0.1:42002'),undefined);
  await close(third);assert.equal(manager.GetPlayer(uid),undefined);assert.equal(third.Player,undefined);
  assert.equal(server._sessionManager.GetSession('127.0.0.1:42003'),undefined);
  console.log('Native furniture router, response, relogin and genuine player/socket lifecycle passed');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  for(const socket of sockets)if(!socket.destroyed)socket.destroy();
  if(server){await Promise.allSettled([...server._logouts]);server._registerManager.Cleanup();}
  for(const p of players)for(const data of [p.Data,p.ItemManager?.ItemData,p.PetManager?.PetData,p.TaskManager?.TaskData,p.FriendManager?.FriendData,p.MailManager?.MailData])clearTimeout(data?._saveTimer);
  for(const timer of intervals)clearInterval(timer);global.setInterval=originalSetInterval;
  await db.Shutdown();fs.rmSync(tmp,{recursive:true,force:true});
});
