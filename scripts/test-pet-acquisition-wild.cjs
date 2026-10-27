'use strict';
// Exercise real map spawns and wild capture against isolated SQLite.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
assert.ok(process.argv[2], 'Usage: node test-pet-acquisition-wild.cjs <assembled-app> [--evidence path]');
assert.ok(process.argv.length === 3 || (process.argv.length === 5 && process.argv[3] === '--evidence' && process.argv[4]), 'Invalid arguments');
const app = path.resolve(process.argv[2]);
const evidence = process.argv[4] && path.resolve(process.argv[4]);
const additions = require('../compat/server-patches/pet-acquisition/ordinary-routes.json').wildAdditions;
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const { Logger } = load('shared/utils');
for (const name of ['Info', 'Debug', 'Warn']) Logger[name] = () => {};
const { Config } = load('shared/config/ServerConfig');
const { ConfigLoader } = load('shared/config/ConfigLoader');
const { ConfigRegistry } = load('shared/config/ConfigRegistry');
const { GetGameConfigRegistrations } = load('shared/config/ConfigDefinitions');
const { GameConfig } = load('shared/config/game/GameConfig');
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
const { CommandID } = load('shared/protocol/CommandID');
const db = DatabaseManager.Instance;
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pet-wild-'));
const intervals = [], players = [], failures = [];
const result = { database: 'isolated SQLite', spawnEntropy: 'seeded LCG; actual map generator', captureEntropy: 'normal capsule; Math.random set to 0 during real capture, controlling entropy only', candidateCount: additions.length, maps: [], captures: [], failures };
const originalNow = Date.now, originalRandom = Math.random, originalSetInterval = global.setInterval;
let clock = Math.floor(originalNow() / 1000), seed = 0x57a1cafe;
Date.now = () => clock * 1000;
const seededRandom = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 0x100000000; };
Math.random = seededRandom;
global.setInterval = (...args) => { const timer = originalSetInterval(...args); intervals.push(timer); return timer; };
const lastPacket = (player, cmd) => player.packets.filter(packet => packet.command === cmd).at(-1);
async function account() {
  const uid = await new AccountRepository().CreateAccount('wild-' + crypto.randomBytes(5).toString('hex') + '@smoke.invalid', crypto.createHash('md5').update('PrivateWorkflow1026!').digest('hex'));
  await new PlayerRepository().CreatePlayer(uid, 'WildSmoke', 0x3399cc);
  await new AccountRepository().UpdateRoleCreated(uid, true);
  const session = { Socket: { destroyed: false, write: () => true } };
  const player = new PlayerInstance(session, uid, {}); session.Player = player;
  player.packets = [];
  player.SendPacket = async packet => player.packets.push({ command: packet.getCmdId(), result: packet.getResult(), body: packet.serialize('xin-20261013') });
  await player.Initialize(); players.push(player);
  const pets = Array.from({ length: 6 }, (_, index) => {
    const pet = Object.assign(createDefaultPetInfo(uid, 110), {
      catchTime: clock - 100 - index, level: 100, obtainLevel: 100, isInBag: true, isDefault: index === 0,
      dvHp: 31, dvAtk: 31, dvDef: 31, dvSpAtk: 31, dvSpDef: 31, dvSpeed: 31,
      evHp: 255, evSpeed: 255, nature: 0, skillArray: [20143, 10326]
    });
    PetCalculator.UpdatePetStats(pet); pet.skillPP = ReconcilePetPP(pet); return pet;
  });
  player.PetManager.PetData.PetList = pets;
  await DatabaseHelper.Instance.SavePetData(player.PetManager.PetData, true);
  return player;
}
function spawnCoverage(player) {
  assert.ok(additions.length > 0, 'No new wild candidates');
  const maps = new Map();
  for (const { mapId, entry } of additions) {
    if (!maps.has(mapId)) maps.set(mapId, new Set());
    assert.ok(!maps.get(mapId).has(entry.petId), `Duplicate candidate ${mapId}/${entry.petId}`);
    maps.get(mapId).add(entry.petId);
  }
  for (const [mapId, expected] of maps) {
    const seen = new Set(); let samples = 0;
    const config = GameConfig.GetMapConfigById(mapId);
    for (const petId of expected) {
      if (!config?.ogres.some(ogre => ogre.petId === petId && !ogre.isBoss && ogre.refreshConfig.enabled)) failures.push(`Missing enabled ordinary candidate ${mapId}/${petId}`);
    }
    while (samples < 20000 && seen.size < expected.size) {
      player.MapSpawnManager.OnEnterMap(mapId);
      for (const ogre of player.MapSpawnManager.GetMapOgres(mapId)) if (expected.has(ogre.petId)) seen.add(ogre.petId);
      samples++;
    }
    const missing = [...expected].filter(id => !seen.has(id));
    result.maps.push({ mapId, expected: [...expected], observed: [...seen].sort((a, b) => a - b), samples, missing });
    if (missing.length) failures.push(`Unreachable wild candidates on map ${mapId} after ${samples} samples: ${missing.join(', ')}`);
  }
}
async function capture(player, candidate, label) {
  const { mapId, entry } = candidate, petId = entry.petId;
  player.Data.mapID = mapId;
  let slot = -1, samples = 0;
  while (samples++ < 20000) {
    player.MapSpawnManager.OnEnterMap(mapId);
    slot = player.MapSpawnManager.GetMapOgres(mapId).findIndex(ogre => ogre.petId === petId);
    if (slot >= 0) break;
  }
  assert.ok(slot >= 0, `No spawn for capture ${mapId}/${petId}`);
  player.packets.length = 0;
  await player.BattleManager.HandleFightNpcMonster(slot);
  const battle = player.BattleManager.GetCurrentBattle();
  assert.ok(battle, `No wild battle ${mapId}/${petId}: ${lastPacket(player, CommandID.FIGHT_NPC_MONSTER)?.result}`);
  assert.equal(battle.enemy.petId, petId, `Unexpected wild encounter ${mapId}/${petId}`);
  await player.BattleManager.HandleReadyToFight();
  const capsule = 300001;
  assert.equal(await player.ItemManager.GiveItem(capsule, 1), true);
  const stock = player.ItemManager.GetItemCount(capsule);
  const before = player.PetManager.PetData.PetList.slice();
  assert.equal(player.PetManager.GetPetsInBag().length, 6, 'Capture fixture requires full bag');
  clock++;
  // The normal capsule uses the real critical-capture probability; only entropy is controlled.
  Math.random = () => 0;
  try { await player.BattleManager.HandleCatchMonster(capsule); } finally { Math.random = seededRandom; }
  assert.equal(player.ItemManager.GetItemCount(capsule), stock - 1, 'Capsule not consumed');
  assert.equal(player.BattleManager.GetCurrentBattle(), null, 'Successful capture did not end battle');
  const after = player.PetManager.PetData.PetList;
  assert.equal(after.length, before.length + 1, 'Capture did not add exactly one pet');
  const acquired = after.find(pet => !before.includes(pet));
  assert.ok(acquired && acquired.petId === petId && !acquired.isInBag, 'Captured pet missing or not in warehouse');
  assert.equal(player.PetManager.GetPetsInBag().length, 6);
  result.captures.push({ label, mapId, slot, samples, petId, capsule, stockBefore: stock, stockAfter: stock - 1, catchTime: acquired.catchTime, warehouse: true });
}
async function main() {
  ConfigLoader.Instance._configDir = path.join(app, 'config'); ConfigLoader.Instance.Reload();
  Config.Config.database = { type: 'sqlite', path: path.join(directory, 'game.sqlite') };
  Config.Game.clientProtocol = 'xin-20261013';
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations()); await ConfigRegistry.Instance.Initialize();
  await load('shared/config/game/SkillEffectsConfig').SkillEffectsConfig.Instance.Load();
  await db.Initialize(); await new MigrationRunner().RunAll();
  const player = await account();
  spawnCoverage(player);
  const parent = additions.find(candidate => candidate.mapId === 56 && candidate.entry.petId === 1216);
  assert.ok(parent, 'Missing protected fusion parent 1216 on map 56');
  const ordinary = additions.find(candidate => candidate.entry.petId === 1) || additions.find(candidate => candidate.entry.petId !== 1216);
  assert.ok(ordinary, 'Missing ordinary capture representative');
  for (const [candidate, label] of [[ordinary, 'ordinary'], [parent, 'fusion-parent-first'], [parent, 'fusion-parent-repeat']]) {
    try { await capture(player, candidate, label); }
    catch (error) { failures.push(`capture ${label}: ${error.stack}`); if (player.BattleManager.GetCurrentBattle()) player.BattleManager.CleanupBattle(); }
  }
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
