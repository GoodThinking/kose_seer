'use strict';
// Real controller actions and persisted rewards against a disposable SQLite database.
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const [runtime, calibrationFile, destination] = process.argv.slice(2);
if (!runtime || !calibrationFile || !destination) throw Error('Usage: node scripts/test-spt-boss-controller.cjs <runtime> <completed calibration.json> <evidence.json> [all|cures|replays] [A|B]');
const app = path.resolve(runtime), calibrationPath = path.resolve(calibrationFile), evidencePath = path.resolve(destination);
const calibration = JSON.parse(fs.readFileSync(calibrationPath, 'utf8'));
assert.equal(calibration.complete, true);
const definitionBytes = fs.readFileSync(path.join(app, 'config/data/json/boss_abilities.json'));
assert.equal(calibration.bossConfigHash, crypto.createHash('sha256').update(definitionBytes).digest('hex'), 'Calibration must use the current boss configuration');
assert.equal(calibration.winningRoutes, calibration.encounters * 2);
const selectedRoute = process.argv[6] || 'A';
assert.ok(['A', 'B'].includes(selectedRoute));
const calibratedRows = calibration.results.map(row => ({...row, team: row['route' + selectedRoute]}));
const definitions = JSON.parse(definitionBytes).bossConfigs;
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const {Logger} = load('shared/utils');
for (const name of ['Info', 'Debug', 'Warn']) Logger[name] = () => {};
const {Config} = load('shared/config/ServerConfig');
const {ConfigLoader} = load('shared/config/ConfigLoader');
const {ConfigRegistry} = load('shared/config/ConfigRegistry');
const {GetGameConfigRegistrations} = load('shared/config/ConfigDefinitions');
const {DatabaseManager} = load('DataBase/DatabaseManager');
const {MigrationRunner} = load('DataBase/migrations/MigrationRunner');
const {DataSaver} = load('DataBase/savers/DataSaver');
const {AccountRepository} = load('DataBase/repositories/Player/AccountRepository');
const {PlayerRepository} = load('DataBase/repositories/Player/PlayerRepository');
const {PlayerInstance} = load('GameServer/Game/Player/PlayerInstance');
const {PetCalculator} = load('GameServer/Game/Pet/PetCalculator');
const {GameConfig} = load('shared/config/game/GameConfig');
const {BossAbilityConfig} = load('GameServer/Game/Battle/BossAbility/BossAbilityConfig');
const {BattleEventType} = load('GameServer/Game/Event/EventTypes');
const {ChallengeProgressDataAccessor} = load('DataBase/accessors/ChallengeProgressDataAccessor');
const {ReconcilePetPP} = load('GameServer/Game/Pet/PetPP');
const {DatabaseHelper} = load('DataBase/DatabaseHelper');
const {SkillEffectRuntime} = load('GameServer/Game/Battle/SkillEffectRuntime');
const {CommandID} = load('shared/protocol/CommandID');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'seer-spt-controller-'));
const db = DatabaseManager.Instance, players = [], naturalReplays = [], rewardRoutes = [];
const originalRandom = Math.random;
async function account(label) {
  const accounts = new AccountRepository();
  const uid = await accounts.CreateAccount(label + crypto.randomBytes(6).toString('hex') + '@fixture.invalid', crypto.randomBytes(16).toString('hex'));
  await new PlayerRepository().CreatePlayer(uid, label, 0x3399cc);
  await accounts.UpdateRoleCreated(uid, true);
  const session = {Socket: {destroyed: false, write: () => true}};
  const player = new PlayerInstance(session, uid, {}); session.Player = player;
  const packets = [], events = [];
  player.SendPacket = async packet => packets.push({command: packet.getCmdId(), result: packet.getResult(), body: packet.serialize(player.ClientProtocol)});
  await player.Initialize(); players.push(player);
  player.EventBus.On(BattleEventType.BATTLE_END, event => events.push(event));
  return {player, packets, events};
}
async function stored(player) {
  const rows = await db.Query('SELECT pet_list FROM player_pets WHERE owner_id=?', [player.Uid]);
  return JSON.parse(rows[0].pet_list);
}
async function prepare(context, row) {
  const {player} = context;
  const encounter = definitions.find(boss => boss.mapId === row.map && boss.param2 === row.region);
  for (const prerequisite of encounter.requiredBosses || []) player.ChallengeProgressManager.MarkSPTBossDefeated(prerequisite.sptId);
  if (row.map === 514) player.ChallengeProgressManager.SetPuniLevel(Math.max(0, row.region - 1));
  if (row.map === 677) player.ChallengeProgressManager.SetAlderLevel(Math.max(0, row.region - 1));
  if (encounter.requiredClaim) {
    const now = Math.floor(Date.now() / 1000), today = Math.floor((now + 8 * 3600) / 86400) * 86400 - 8 * 3600;
    for (let index = 0; index < encounter.requiredClaim.count; index++) {
      const period = today - (Math.floor(index / 2) + 1) * 86400 + index % 2;
      await db.Execute('INSERT OR IGNORE INTO receiver_claims (owner_id,reward_key,period_start,claimed_at,amount) VALUES (?,?,?,?,1)', [player.Uid, encounter.requiredClaim.key, period, period]);
    }
  }
  for (let index = 0; index < row.team.specs.length; index++) {
    const spec = row.team.specs[index], identity = 1700000000 + index + spec.id * 10;
    const learned = new Set((GameConfig.GetPetById(spec.id).LearnableMoves?.Move || []).filter(move => Number(move.LearningLv || 0) <= 100).map(move => Number(move.ID || move.id)));
    assert.equal(new Set(spec.skills).size, 4);
    assert.ok(spec.skills.every(id => learned.has(id)), 'Fixture must use a legal learned moveset: ' + spec.id);
    if (!player.PetManager.GetPetByCatchTime(identity)) assert.equal(await player.PetManager.GivePet(spec.id, 100, identity), true);
    const pet = player.PetManager.GetPetByCatchTime(identity), candidate = JSON.parse(JSON.stringify(pet));
    const training = spec.training;
    assert.equal(Object.values(training).reduce((sum, value) => sum + value, 0), 510);
    Object.assign(candidate, {level: 100, nature: 0, dvHp: 31, dvAtk: 31, dvDef: 31, dvSpAtk: 31, dvSpDef: 31, dvSpeed: 31,
      evHp: training.hp, evAtk: training.atk, evDef: training.def, evSpAtk: training.spAtk, evSpDef: training.spDef, evSpeed: training.speed,
      isInBag: true, isDefault: index === 0, skillArray: spec.skills.slice(), effectList: [], effectCount: 0});
    candidate.skillPP = ReconcilePetPP(candidate, true);
    PetCalculator.UpdatePetStats(candidate);
    candidate.hp = candidate.maxHp;
    const release = await player.PetManager.PetData.AcquireMutation();
    try { await player.PetManager.PetData.CommitPetUpdate(pet, candidate); } finally { release(); }
  }
  player.Data.mapID = row.map;
  for (const [id, count] of Object.entries(row.team.supplies)) assert.equal(await player.ItemManager.GiveItem(Number(id), count), true);
}
function petNotices(context, start) {
  return context.packets.slice(start).filter(packet => packet.command === 8004 && packet.body.length >= 16 && packet.body.readUInt32BE(4) > 0).map(packet => ({petId: packet.body.readUInt32BE(4), catchTime: packet.body.readUInt32BE(8)}));
}
async function replay(context, row, repeated) {
  assert.equal(row.team.won, true, 'A natural winning trace is required');
  const {player} = context, manager = player.BattleManager;
  await prepare(context, row);
  assert.ok(Number.isSafeInteger(row.team.seed) && row.team.seed >= 0 && row.team.seed <= 0xffffffff, 'Recorded battle seed required');
  let randomState = row.team.seed;
  Math.random = () => ((randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0) / 4294967296);
  const packetStart = context.packets.length, eventStart = context.events.length, rewardFitsBag = player.PetManager.GetPetsInBag().length < 6;
  await manager.HandleChallengeBoss(row.map, row.region);
  const battle = manager.GetCurrentBattle();
  assert.ok(battle, 'Actual boss entry failed: ' + row.name + '; replies=' + JSON.stringify(context.packets.slice(-6).map(packet => ({command: packet.command, result: packet.result, alert: packet.command === 80002 ? packet.body.subarray(4).toString('utf8') : undefined}))));
  await manager.HandleReadyToFight();
  for (const step of row.team.trace) {
    assert.equal(manager.GetCurrentBattle(), battle, 'Battle ended before recorded natural victory');
    const target = player.PetManager.GetPetsInBag().find(pet => pet.petId === step.active);
    assert.ok(target);
    if (step.swap) await manager.HandleChangePet(target.catchTime);
    else if (step.item) await manager.HandleUsePetItem(step.item, battle.player.catchTime);
    else await manager.HandleUseSkill(step.skill);
    assert.equal(battle.turn, step.turn, row.name + ' turn differs: ' + JSON.stringify({step, skills: battle.player.skills, pp: battle.player.skillPP, replies: context.packets.slice(-5).map(packet => ({command: packet.command, result: packet.result}))}));
    assert.equal(battle.enemy.hp, step.bossHp, row.name + ' boss HP differs at turn ' + step.turn);
    assert.equal(battle.player.hp, step.hp, row.name + ' player HP differs at turn ' + step.turn);
  }
  assert.equal(battle.enemy.hp, 0);
  assert.equal(context.events.length, eventStart + 1);
  assert.equal(context.events.at(-1).isVictory, true);
  assert.equal(context.events.at(-1).extra.rewardStatus, 'complete');
  const config = definitions.find(boss => boss.mapId === row.map && boss.param2 === row.region);
  if (!repeated && config.spt?.rewardPetId) {
    const deadline = Date.now() + 5000;
    while (!petNotices(context, packetStart).length && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20));
    const notice = petNotices(context, packetStart).find(notice => notice.petId === config.spt.rewardPetId);
    assert.ok(notice, 'Natural victory must emit its committed native pet notice');
    const pet = (await stored(player)).find(pet => pet.catchTime === notice.catchTime);
    assert.equal(pet.petId, notice.petId); assert.equal(pet.isInBag, rewardFitsBag);
  } else if (repeated) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    assert.equal(petNotices(context, packetStart).length, 0);
  }
  Math.random = originalRandom;
  naturalReplays.push({map: row.map, region: row.region, name: row.name, route: selectedRoute, turns: battle.turn, teamSize: row.team.specs.length, repeated, rewardStatus: context.events.at(-1).extra.rewardStatus});
}
async function verifyStatusMedicine() {
  const row = calibratedRows.find(row => row.map === 17 && row.region === 0);
  assert.ok(row, 'Rios legal-party fixture required');
  const context = await account('StatusMedicine'), {player} = context, manager = player.BattleManager;
  await prepare(context, row);
  await player.ItemManager.GiveItem(300616, 3);
  await player.ItemManager.GiveItem(300615, 3);
  await manager.HandleChallengeBoss(17, 0); await manager.HandleReadyToFight();
  const battle = manager.GetCurrentBattle(), checks = [];
  const count = id => player.ItemManager.ItemData.ItemList.find(item => item.itemId === id)?.count || 0;
  const use = id => manager.HandleUsePetItem(id, battle.player.catchTime);
  const lastResult = () => context.packets.filter(packet => packet.command === CommandID.USE_PET_ITEM).at(-1)?.result;
  assert.equal(battle.player.hp, battle.player.maxHp);
  SkillEffectRuntime.Inflict(battle.player, 1, 3);
  const pp = battle.enemy.skillPP.reduce((sum, value) => sum + value, 0), turn = battle.turn;
  await use(300616);
  assert.equal(lastResult(), 0); assert.equal(SkillEffectRuntime.HasStatus(battle.player, 1), false);
  assert.equal(count(300616), 2); assert.equal(battle.turn, turn + 1);
  assert.equal(battle.enemy.skillPP.reduce((sum, value) => sum + value, 0), pp - 1);
  const persisted = JSON.parse((await db.Query('SELECT item_list FROM player_items WHERE owner_id=?', [player.Uid]))[0].item_list);
  assert.equal(persisted.find(item => item.itemId === 300616).count, 2);
  checks.push('full-HP cure commits one item and one enemy action');
  const before = battle.turn;
  await use(300616); assert.equal(lastResult(), 5001); assert.equal(count(300616), 2); assert.equal(battle.turn, before);
  checks.push('absent status rejects without item or turn');
  SkillEffectRuntime.Inflict(battle.player, 1, 3);
  await manager.HandleUsePetItem(300616, battle.player.catchTime + 1);
  assert.equal(lastResult(), 5001); assert.equal(count(300616), 2); assert.equal(battle.turn, before);
  checks.push('wrong catchTime rejects without mutation');
  const profile = battle.enemy.sptBossProfile;
  for (const mode of ['wild', 'native', 'pvp']) {
    if (mode === 'wild') delete battle.enemy.sptBossProfile;
    if (mode === 'native') battle.enemy.sptBossProfile = {...profile, native: true};
    if (mode === 'pvp') battle.isPvp = true;
    await use(300616); assert.equal(lastResult(), 5001);
    assert.equal(count(300616), 2); assert.equal(battle.turn, before);
    battle.enemy.sptBossProfile = profile; battle.isPvp = false;
  }
  checks.push('wild, native exemptions and PvP preserve prior item scope');
  battle.player.statusDurations.fill(0); battle.player.status = -1; battle.player.statusTurns = 0;
  SkillEffectRuntime.Inflict(battle.player, 5, 3);
  assert.equal(SkillEffectRuntime.HasStatus(battle.player, 5), true, 'Fault fixture must begin frozen');
  const save = DatabaseHelper.Instance.SaveItemData;
  try {
    DatabaseHelper.Instance.SaveItemData = async function(data, ...args) {
      if (data === player.ItemManager.ItemData) throw Error('Injected status-medicine storage failure');
      return save.call(this, data, ...args);
    };
    await use(300615);
  } finally { DatabaseHelper.Instance.SaveItemData = save; }
  assert.equal(lastResult(), 5001); assert.equal(count(300615), 3);
  assert.equal(SkillEffectRuntime.HasStatus(battle.player, 5), true); assert.equal(battle.turn, before);
  checks.push('save failure restores item and preserves status and turn');
  const report = {complete: true, checks, scope: 'Real controller, configured medicine, disposable SQLite, forced status setup; no fabricated victory'};
  fs.writeFileSync(evidencePath, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report));
}
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'test.sqlite')};
  Config.Game.clientProtocol = 'kose';
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations()); await ConfigRegistry.Instance.Initialize();
  await load('shared/config/game/SkillEffectsConfig').SkillEffectsConfig.Instance.Load(); BossAbilityConfig.Instance.Load();
  await db.Initialize(); await new MigrationRunner().RunAll();
  if (process.argv[5] === 'cures') { await verifyStatusMedicine(); return; }
  for (const row of calibratedRows) {
    const context = await account('Natural' + row.map + '_' + row.region);
    await replay(context, row, false);
    if (row.map === 12 && row.region === 0) await replay(context, row, true);
  }
  if (process.argv[5] !== 'replays') for (const config of definitions.filter(boss => boss.sptBoss && boss.spt?.sptId > 0)) {
    const {player} = await account('Reward' + config.mapId + '_' + config.param2);
    const battle = {bossMapId: config.mapId, bossParam2: config.param2, enemy: {id: config.petId, name: config.petName, hp: 0}};
    const settlement = {}, service = player.BattleManager._rewardService;
    const rewards = await service.ProcessSPTFirstDefeatReward(battle, config.mapId, settlement);
    assert.equal(player.ChallengeProgressManager.HasDefeatedSPTBoss(config.spt.sptId), true, config.petName);
    await ChallengeProgressDataAccessor.Instance.Save(player.ChallengeProgressManager._data);
    const bits = (await db.Query('SELECT boss_achievement FROM player_challenge_progress WHERE user_id=?', [player.Uid]))[0].boss_achievement;
    assert.equal(Buffer.from(bits)[config.spt.sptId - 1], 1);
    if (config.spt.rewardPetId) {
      const pet = (await stored(player)).find(pet => pet.catchTime === settlement.rewardPet?.catchTime);
      assert.ok(pet); assert.equal(pet.petId, config.spt.rewardPetId); assert.equal(pet.level, 1);
    }
    if (config.spt.rewardItemId) assert.ok(rewards.some(item => item.itemId === config.spt.rewardItemId && item.count === 1));
    const before = await stored(player), duplicate = {};
    assert.deepEqual(await service.ProcessSPTFirstDefeatReward(battle, config.mapId, duplicate), []);
    assert.equal(duplicate.rewardPet, undefined);
    assert.deepEqual(await stored(player), before);
    rewardRoutes.push({map: config.mapId, region: config.param2, sptId: config.spt.sptId, petId: config.spt.rewardPetId || null, itemId: config.spt.rewardItemId || null, persisted: true, duplicateGrant: false});
  }
  const result = {complete: true, calibration: calibrationPath, calibrationHash: crypto.createHash('sha256').update(fs.readFileSync(calibrationPath)).digest('hex'), naturalReplays, rewardRoutes,
    scope: 'Every calibration encounter replays real boss entry, skill/switch/item actions, SQLite consumption, battle-end settlement and native 8004. Only prerequisite unlocks and legal trained parties are prepared in disposable accounts. Bulk reward routes use finished-boss fixtures to isolate first-win persistence and repeat suppression.'};
  fs.writeFileSync(evidencePath, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({naturalReplays, rewardRoutes: rewardRoutes.length, uniqueSptIds: new Set(rewardRoutes.map(row => row.sptId)).size}));
})().catch(error => {
  fs.writeFileSync(evidencePath, JSON.stringify({complete: false, calibration: calibrationPath, naturalReplays, rewardRoutes, error: error.message}, null, 2) + '\n');
  console.error(error.stack); process.exitCode = 1;
}).finally(async () => {
  Math.random = originalRandom;
  for (const player of players) {player.BattleManager.CleanupBattle(); await player.OnLogout();}
  await new Promise(resolve => setTimeout(resolve, 300));
  await DataSaver.Instance.WaitForSaves(); await db.Shutdown();
  fs.rmSync(temporary, {recursive: true, force: true});
  process.exit(process.exitCode || 0);
});
