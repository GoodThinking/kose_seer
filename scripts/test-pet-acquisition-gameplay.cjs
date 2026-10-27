'use strict';
// Exercise assembled battle and hatching handlers against isolated SQLite only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
assert.ok(process.argv[2], 'Usage: node test-pet-acquisition-gameplay.cjs <assembled-app> [--evidence path]');
assert.ok(process.argv.length === 3 || (process.argv.length === 5 && process.argv[3] === '--evidence' && process.argv[4]), 'Invalid arguments');
const app = path.resolve(process.argv[2]);
const evidence = process.argv[4] && path.resolve(process.argv[4]);
const routes = require('../compat/server-patches/pet-acquisition/boss-routes.json').newBosses;
assert.equal(routes.length, 37);
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
const { DatabaseHelper } = load('DataBase/DatabaseHelper');
const { MigrationRunner } = load('DataBase/migrations/MigrationRunner');
const { DataSaver } = load('DataBase/savers/DataSaver');
const { DataCache } = load('DataBase/cache/DataCache');
const { DataConfigRegistry } = load('DataBase/config/DataConfig');
const { ChallengeProgressDataAccessor } = load('DataBase/accessors/ChallengeProgressDataAccessor');
const { AccountRepository } = load('DataBase/repositories/Player/AccountRepository');
const { PlayerRepository } = load('DataBase/repositories/Player/PlayerRepository');
const { PlayerInstance } = load('GameServer/Game/Player/PlayerInstance');
const { createDefaultPetInfo } = load('shared/models/PetModel');
const { PetCalculator } = load('GameServer/Game/Pet/PetCalculator');
const { ReconcilePetPP } = load('GameServer/Game/Pet/PetPP');
const { PetHatchHandler, PetHatchGetHandler } = load('GameServer/Server/Packet/Recv/Pet/PetHatchHandlers');
const { CommandID } = load('shared/protocol/CommandID');
const db = DatabaseManager.Instance;
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pet-gameplay-'));
const players = [], intervals = [], failures = [];
const result = { database: 'isolated SQLite', entryEstablishment: [], actualBattles: [], hatching: null, failures };
// Decode the KOSE map-user tail using native UserInfo.setForPeoleInfo widths.
// A wrong logo width clears diving clothes when map entry replaces actorInfo.
const { SeerMapUserInfoProto } = load('shared/proto/common/SeerMapUserInfoProto');
const mapUsers = [[100024,100025,100026], [100001]].map((ids, index) => {
  const user = new SeerMapUserInfoProto();
  Object.assign(user, { teamLogoBg: 1, teamLogoIcon: 2, teamLogoColor: 3, teamTxtColor: 4, teamLogoWord: 'TEAM', curTitle: 91 + index });
  user.setClothes(ids.map(id => ({ id, level: 1 })));
  return user.serialize('kose');
});
const mapUserBytes = Buffer.concat(mapUsers);
let mapUserOffset = 0;
for (const [index, expected] of [[100024,100025,100026], [100001]].entries()) {
  mapUserOffset += 124;
  assert.deepEqual(Array.from({length:4}, (_, i) => mapUserBytes.readInt16BE(mapUserOffset + i * 2)), [1,2,3,4]);
  mapUserOffset += 8;
  assert.equal(mapUserBytes.toString('utf8', mapUserOffset, mapUserOffset + 4), 'TEAM');
  mapUserOffset += 4;
  const count = mapUserBytes.readUInt32BE(mapUserOffset); mapUserOffset += 4;
  const clothes = [];
  for (let i = 0; i < count; i++) {
    clothes.push(mapUserBytes.readUInt32BE(mapUserOffset)); mapUserOffset += 8;
  }
  assert.deepEqual(clothes, expected);
  assert.equal(mapUserBytes.readUInt32BE(mapUserOffset), 91 + index); mapUserOffset += 4;
}
assert.equal(mapUserOffset, mapUserBytes.length);
result.mapUserProtocol = { divingClothesRetained: true, consecutiveRecordsAligned: true };
const originalNow = Date.now, originalRandom = Math.random, originalSetInterval = global.setInterval;
let clock = Math.floor(originalNow() / 1000), seed = 0x57a1cafe;
Date.now = () => clock * 1000;
Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 0x100000000; };
global.setInterval = (...args) => { const timer = originalSetInterval(...args); intervals.push(timer); return timer; };
function lastPacket(player, cmd) { return player.packets.filter(packet => packet.command === cmd).at(-1); }
async function account(name, lead = 110) {
  const uid = await new AccountRepository().CreateAccount(name + '-' + crypto.randomBytes(5).toString('hex') + '@smoke.invalid', crypto.createHash('md5').update('PrivateWorkflow1026!').digest('hex'));
  await new PlayerRepository().CreatePlayer(uid, name, 0x3399cc);
  await new AccountRepository().UpdateRoleCreated(uid, true);
  const session = { Socket: { destroyed: false, write: () => true } };
  const player = new PlayerInstance(session, uid, {}); session.Player = player;
  player.packets = [];
  player.SendPacket = async packet => player.packets.push({ command: packet.getCmdId(), result: packet.getResult(), body: packet.serialize('xin-20261013') });
  await player.Initialize(); players.push(player);
  const pets = Array.from({ length: 6 }, (_, index) => {
    const species = index === 0 ? lead : 110;
    const pet = Object.assign(createDefaultPetInfo(uid, species), {
      catchTime: clock - 100 - index, level: 100, obtainLevel: 100, isInBag: true, isDefault: index === 0,
      dvHp: 31, dvAtk: 31, dvDef: 31, dvSpAtk: 31, dvSpDef: 31, dvSpeed: 31,
      evHp: 255, evSpeed: 255, nature: 0, skillArray: species === 898 ? [12153,21112,12155,21113] : [20143,10326]
    });
    PetCalculator.UpdatePetStats(pet); pet.skillPP = ReconcilePetPP(pet); return pet;
  });
  player.PetManager.PetData.PetList = pets;
  await DatabaseHelper.Instance.SavePetData(player.PetManager.PetData, true);
  return player;
}
async function challenge(player, route) {
  player.Data.mapID = route.mapId;
  player.packets.length = 0;
  await player.BattleManager.HandleChallengeBoss(route.mapId, route.param2);
  return { battle: player.BattleManager.GetCurrentBattle(), packet: lastPacket(player, CommandID.CHALLENGE_BOSS) };
}
async function entries() {
  const player = await account('Entries');
  for (const route of routes) {
    try {
    player.MapSpawnManager.OnEnterMap(route.mapId);
    assert.equal(player.MapSpawnManager.GetMapOgres(route.mapId)[route.param2].petId, 0, `Boss leaked into ordinary wild slot: ${route.petId}`);
    const visibleBosses = player.MapSpawnManager.GetMapBosses(route.mapId).filter(entry => entry.region === route.param2);
    assert.equal(visibleBosses.length, 1, `Expected one standing Boss at region ${route.param2}`);
    assert.equal(visibleBosses[0].id, route.petId, `Wrong standing Boss for ${route.petId}`);
    const required = route.requiredBosses || [];
    if (required.some(entry => !player.ChallengeProgressManager.HasDefeatedSPTBoss(entry.sptId))) {
      const rejected = await challenge(player, route);
      assert.ok(!rejected.battle && rejected.packet && rejected.packet.result === 900, `Prerequisite rejection missing for ${route.petId}`);
      for (const prerequisite of required) player.ChallengeProgressManager.MarkSPTBossDefeated(prerequisite.sptId);
    }
    const { battle, packet } = await challenge(player, route);
    assert.ok(battle && packet && packet.result === 0, `Challenge entry failed for ${route.petId}: ${packet?.result}`);
    assert.equal(battle.enemy.petId, route.petId);
    assert.ok(battle.enemy.hp > 0 && battle.enemy.maxHp > 0);
    assert.ok(battle.enemy.skills.length > 0);
    result.entryEstablishment.push({ petId: route.petId, mapId: route.mapId, param2: route.param2, standingOnly: true, ordinarySlotEmpty: true, opponent: battle.enemy.petId, hp: battle.enemy.hp, maxHp: battle.enemy.maxHp, skills: battle.enemy.skills, prerequisiteFixture: required.map(entry => entry.sptId) });
    } catch (error) {
      failures.push(`entry ${route.petId}: ${error.stack}`);
    } finally {
      if (player.BattleManager.GetCurrentBattle()) player.BattleManager.CleanupBattle();
    }
  }
}
async function fight(player, route, label) {
  const attempt = { petId: route.petId, label, turns: [], outcome: 'not-started' };
  result.actualBattles.push(attempt);
  const { battle, packet } = await challenge(player, route);
  assert.ok(battle && packet && packet.result === 0, `Battle entry ${route.petId} rejected: ${packet?.result}`);
  assert.equal(battle.enemy.petId, route.petId);
  await player.BattleManager.HandleReadyToFight();
  for (let turn = 0; turn < 120 && player.BattleManager.GetCurrentBattle() === battle && !battle.isOver; turn++) {
    if (battle.player.hp <= 0) {
      const next = player.PetManager.GetPetsInBag().find(pet => pet.hp > 0 && pet.catchTime !== battle.player.catchTime);
      if (!next) break;
      await player.BattleManager.HandleChangePet(next.catchTime);
      attempt.turns.push({ action: 'changePet', catchTime: next.catchTime, playerHp: battle.player.hp, opponentHp: battle.enemy.hp });
      continue;
    }
    if (battle.player.petId === 898 && !battle.enemy.battleLv.some(stage => stage > 0)) {
      const next = player.PetManager.GetPetsInBag().find(pet => pet.petId === 110 && pet.hp > 0);
      if (next) {
        await player.BattleManager.HandleChangePet(next.catchTime);
        attempt.turns.push({action:'changeAfterClear',catchTime:next.catchTime,opponentHp:battle.enemy.hp});
        continue;
      }
    }
    const proportion = battle.player.skills.indexOf(20143);
    const ready = id => battle.player.skillPP[battle.player.skills.indexOf(id)] > 0;
    const skill = battle.player.petId === 898 ? ready(12153) ? 12153 : 12155
      : proportion >= 0 && ready(20143) ? 20143 : 10326;
    const index = battle.player.skills.indexOf(skill);
    if (index < 0 || battle.player.skillPP[index] <= 0) break;
    const before = battle.enemy.hp;
    await player.BattleManager.HandleUseSkill(skill);
    attempt.turns.push({ action: 'skill', skill, opponentHpBefore: before, opponentHp: battle.enemy.hp, playerHp: battle.player.hp });
  }
  attempt.outcome = battle.enemy.hp <= 0 && player.ChallengeProgressManager.HasDefeatedSPTBoss(route.spt.sptId) ? 'victory' : 'not-victory';
  attempt.finalOpponentHp = battle.enemy.hp;
  if (player.BattleManager.GetCurrentBattle()) player.BattleManager.CleanupBattle();
  return attempt.outcome === 'victory';
}
async function battleCases() {
  const mainPlayer = await account('Combat'), aresPlayer = await account('AresCombat',898);
  const representatives = [361,898,1337,505,1484];
  cases: for (const id of [...representatives,...routes.map(route => route.petId).filter(id => !representatives.includes(id))]) {
    const player = id === 505 ? aresPlayer : mainPlayer;
    try {
    const route = routes.find(entry => entry.petId === id);
    for (const prerequisite of route.requiredBosses || []) {
      if (!player.ChallengeProgressManager.HasDefeatedSPTBoss(prerequisite.sptId)) {
        const rejected = await challenge(player, route);
        assert.ok(!rejected.battle && rejected.packet?.result === 900, `Expected prerequisite rejection for ${id}`);
        failures.push(`Boss ${id} prerequisite ${prerequisite.sptId} was not won in combat`);
        result.actualBattles.push({ petId: id, outcome: 'prerequisite-rejected', prerequisite: prerequisite.sptId, turns: [] });
        continue cases;
      }
    }
    await player.PetManager.HandlePetCure(0);
    const before = player.ItemManager.GetItemCount(route.spt.rewardItemId);
    const won = await fight(player, route, 'first');
    if (!won) { failures.push(`Boss ${id}: legal strategy did not win`); continue; }
    assert.equal(player.ItemManager.GetItemCount(route.spt.rewardItemId), before + 1, `First win reward ${id}`);
    await player.PetManager.HandlePetCure(0);
    const replayWon = await fight(player, route, 'replay');
    assert.ok(replayWon, `Replay did not win for ${id}`);
    assert.equal(player.ItemManager.GetItemCount(route.spt.rewardItemId), before + 1, `Replay duplicated reward ${id}`);
    } catch (error) {
      failures.push(`Boss ${id}: ${error.stack}`);
      if (player.BattleManager.GetCurrentBattle()) player.BattleManager.CleanupBattle();
    }
  }
  return mainPlayer;
}
async function hatch(player) {
  const earned = routes.find(route => player.ItemManager.GetItemCount(route.spt.rewardItemId) > 0 && player.ChallengeProgressManager.HasDefeatedSPTBoss(route.spt.sptId));
  const route = earned || routes.find(entry => entry.petId === 361);
  const itemId = route.spt.rewardItemId;
  if (!earned) assert.equal(await player.ItemManager.GiveItem(itemId, 1), true);
  const source = earned ? 'actual first-win essence' : 'test fixture essence; no battle victory claimed';
  const hatchRoute = require('../compat/server-patches/pet-acquisition/boss-routes.json').routes.find(entry => entry.disposition === 'newBoss' && entry.source.sptId === route.spt.sptId).source;
  const start = async (essence = itemId) => {
    const body = Buffer.alloc(4); body.writeUInt32BE(essence);
    await new PetHatchHandler().Handle(player.Session, {}, body);
    return lastPacket(player, 2315);
  };
  const get = async () => { await new PetHatchGetHandler().Handle(player.Session, {}, Buffer.alloc(0)); return lastPacket(player, 2316); };
  const count = () => player.ItemManager.GetItemCount(itemId);
  player.Data.hasNono = false;
  assert.equal((await start()).result, 5001); assert.equal((await get()).result, 5001); assert.ok(count() > 0);
  player.Data.hasNono = true;
  const begun = await start(); assert.equal(begun.result, 0); assert.equal(begun.body.readUInt32BE(0), 1800);
  const busyItem = itemId === 400103 ? 400051 : 400103;
  assert.equal(await player.ItemManager.GiveItem(busyItem, 1), true);
  const busyStock = player.ItemManager.GetItemCount(busyItem);
  assert.ok(busyStock > 0);
  assert.equal((await start(busyItem)).result, 5002);
  assert.equal(player.ItemManager.GetItemCount(busyItem), busyStock);
  let state = await get(); assert.equal(state.result, 0); assert.equal(state.body.readUInt32BE(4), 1800);
  clock += 1799; state = await get(); assert.equal(state.body.readUInt32BE(4), 1);
  const before = player.PetManager.PetData.PetList.length;
  clock++; state = await get(); assert.equal(state.result, 0); assert.equal(state.body.readUInt32BE(4), 0);
  assert.equal(state.body.readUInt32BE(8), hatchRoute.hatchPetId);
  const pets = player.PetManager.PetData.PetList;
  assert.equal(pets.length, before + 1);
  const pet = pets.find(entry => entry.catchTime === clock);
  assert.ok(pet && pet.petId === hatchRoute.hatchPetId && pet.level === 1 && !pet.isInBag);
  await get(); assert.equal(player.PetManager.PetData.PetList.length, before + 1);
  result.hatching = { source, itemId, petId: pet.petId, noNoRequired: true, seconds: 1800, busyPreservedStock: true, fullBagToStorage: true, repeatNoExtraPet: true };
}
async function main() {
  ConfigLoader.Instance._configDir = path.join(app, 'config'); ConfigLoader.Instance.Reload();
  Config.Config.database = { type: 'sqlite', path: path.join(directory, 'game.sqlite') };
  Config.Game.clientProtocol = 'xin-20261013';
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations()); await ConfigRegistry.Instance.Initialize();
  await load('shared/config/game/SkillEffectsConfig').SkillEffectsConfig.Instance.Load();
  await db.Initialize(); await new MigrationRunner().RunAll();
  try { await entries(); } catch (error) { failures.push(`entry: ${error.stack}`); }
  let combat;
  try { combat = await battleCases(); } catch (error) { failures.push(`combat: ${error.stack}`); combat = players.find(player => player.packets && player.PetManager && player !== players[0]); }
  if (combat) try { await hatch(combat); } catch (error) { failures.push(`hatching: ${error.stack}`); }
  else failures.push('hatching: combat fixture could not be initialized');
}
async function cleanup() {
  const models = [];
  for (const player of players) {
    if (player.Data) models.push(player.Data);
    for (const type of DataConfigRegistry.Instance.GetAllTypes()) {
      const data = DataCache.Instance.Get(type, player.Uid); if (data) models.push(data);
    }
    const progress = ChallengeProgressDataAccessor.Instance.GetCached(player.Uid); if (progress) models.push(progress);
    await player.OnLogout(); ChallengeProgressDataAccessor.Instance.RemoveCache(player.Uid);
  }
  for (const interval of intervals) clearInterval(interval);
  await new Promise(resolve => setTimeout(resolve, 300));
  await DataSaver.Instance.WaitForSaves(); await db.WithConnection(async () => {});
  for (const model of models) if (model._saveTimer) { clearTimeout(model._saveTimer); model._saveTimer = null; model._pendingSave = false; }
  await DataSaver.Instance.WaitForSaves(); await db.WithConnection(async () => {});
  await db.Shutdown();
}
(async () => {
  try { await main(); } catch (error) { failures.push(error.stack); }
  try { await cleanup(); } catch (error) { failures.push(`cleanup: ${error.stack}`); }
  finally { Date.now = originalNow; Math.random = originalRandom; global.setInterval = originalSetInterval; fs.rmSync(directory, { recursive: true, force: true }); }
  const report = JSON.stringify(result, null, 2) + '\n';
  if (evidence) fs.writeFileSync(evidence, report);
  process.stdout.write(report);
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
