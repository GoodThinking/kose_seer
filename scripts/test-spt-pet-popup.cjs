'use strict';
// Exercise persisted first-win rewards through the real battle settlement and native reward packet.
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const app = path.resolve(process.argv[2]);
const evidence = process.argv[3] && path.resolve(process.argv[3]);
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const { Logger } = load('shared/utils');
for (const name of ['Info', 'Debug', 'Warn']) Logger[name] = () => {};
const { Config } = load('shared/config/ServerConfig');
const { ConfigLoader } = load('shared/config/ConfigLoader');
const { ConfigRegistry } = load('shared/config/ConfigRegistry');
const { GetGameConfigRegistrations } = load('shared/config/ConfigDefinitions');
const { DatabaseManager } = load('DataBase/DatabaseManager');
const { MigrationRunner } = load('DataBase/migrations/MigrationRunner');
const { DataSaver } = load('DataBase/savers/DataSaver');
const { AccountRepository } = load('DataBase/repositories/Player/AccountRepository');
const { PlayerRepository } = load('DataBase/repositories/Player/PlayerRepository');
const { PlayerInstance } = load('GameServer/Game/Player/PlayerInstance');
const db = DatabaseManager.Instance;
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'seer-spt-popup-'));
const players = [], results = [];
let identity = 1830000000;
async function account(name, count) {
  const uid = await new AccountRepository().CreateAccount(name + crypto.randomBytes(5).toString('hex') + '@popup.invalid', crypto.createHash('md5').update('PopupFixtureOnly!').digest('hex'));
  await new PlayerRepository().CreatePlayer(uid, name, 0x3399cc);
  await new AccountRepository().UpdateRoleCreated(uid, true);
  const session = { Socket: { destroyed: false, write: () => true } }, packets = [];
  const player = new PlayerInstance(session, uid, {}); session.Player = player;
  player.SendPacket = async packet => packets.push({ command: packet.getCmdId(), result: packet.getResult(), body: packet.serialize(player.ClientProtocol) });
  await player.Initialize(); players.push(player);
  player.Data.mapID = 12;
  while (player.PetManager.GetPetsInBag().length < count) assert.equal(await player.PetManager.GivePet(303, 100, identity++), true);
  return { player, packets };
}
async function victory(context, map = 12, param = 0) {
  const manager = context.player.BattleManager;
  context.player.Data.mapID = map;
  await manager.HandleChallengeBoss(map, param);
  const battle = manager.GetCurrentBattle();
  assert.ok(battle, 'Boss battle must actually start');
  await manager.HandleReadyToFight();
  battle.enemy.hp = 0;
  await manager.HandleFightOver(context.player.Uid, 0);
  await new Promise(resolve => setTimeout(resolve, 1400));
}
function rewards(context, from = 0) {
  return context.packets.slice(from).filter(packet => packet.command === 8004 && packet.body.length >= 16).map(packet => ({
    petId: packet.body.readUInt32BE(4), catchTime: packet.body.readUInt32BE(8), itemCount: packet.body.readUInt32BE(12),
  }));
}
async function stored(player) { return JSON.parse((await db.Query('SELECT pet_list FROM player_pets WHERE owner_id=?', [player.Uid]))[0].pet_list); }
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  Config.Config.database = { type: 'sqlite', path: path.join(temporary, 'test.sqlite') };
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations()); await ConfigRegistry.Instance.Initialize();
  await load('shared/config/game/SkillEffectsConfig').SkillEffectsConfig.Instance.Load();
  await db.Initialize(); await new MigrationRunner().RunAll();
  for (const count of [1, 6]) {
    const context = await account('Popup' + count, count), p = context.player;
    await victory(context);
    const notice = rewards(context).find(reward => reward.petId === 46);
    assert.ok(notice, 'Persisted SPT pet must be announced in the native reward packet');
    const pet = (await stored(p)).find(pet => pet.catchTime === notice.catchTime);
    assert.equal(pet.petId, 46); assert.equal(pet.isInBag, count < 6);
    assert.equal(p.ChallengeProgressManager.HasDefeatedSPTBoss(1), true);
    if (count < 6) {
      await p.PetManager.HandlePetTakeOut(notice.catchTime);
      assert.equal(context.packets.at(-1).command, 2304);
      assert.equal(context.packets.at(-1).result, 0, 'Native obtain confirmation must succeed for an already granted bag pet');
    }
    const before = context.packets.length;
    await victory(context);
    assert.deepEqual(rewards(context, before), [], 'Repeat victory must not announce another pet');
    assert.equal((await stored(p)).filter(pet => pet.petId === 46).length, 1, 'Repeat victory must not grant another pet');
    results.push({ bagBefore: count, petId: notice.petId, destination: pet.isInBag ? 'bag' : 'storage', duplicateGrant: false });
  }
  const context = await account('Partial', 6), p = context.player;
  assert.equal(await p.ItemManager.GiveItem(400051, 1), true);
  await victory(context, 22, 0);
  const notice = rewards(context).find(reward => reward.petId === 4149);
  assert.ok(notice, 'A later essence inventory failure must not hide an already committed pet');
  assert.equal((await stored(p)).find(pet => pet.catchTime === notice.catchTime).petId, 4149);
  results.push({ partialItemFailure: true, committedPetAnnounced: notice.petId });
  const report = { results, scope: 'isolated SQLite; real boss entry, settlement, native 8004 and bag confirmation; UI checked separately' };
  if (evidence) fs.writeFileSync(evidence, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error.stack); process.exitCode = 1; }).finally(async () => {
  for (const p of players) { p.BattleManager.CleanupBattle(); await p.OnLogout(); }
  await new Promise(resolve => setTimeout(resolve, 300));
  await DataSaver.Instance.WaitForSaves(); await db.Shutdown();
  fs.rmSync(temporary, { recursive: true, force: true });
  process.exit(process.exitCode || 0);
});
