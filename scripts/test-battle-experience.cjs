'use strict';
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs'), os = require('node:os'), crypto = require('node:crypto');
const app = path.resolve(process.argv[2]); process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const { Logger } = load('shared/utils'); for (const name of ['Info', 'Debug', 'Warn']) Logger[name] = () => {};
const { Config } = load('shared/config/ServerConfig'), { ConfigLoader } = load('shared/config/ConfigLoader'), { ConfigRegistry } = load('shared/config/ConfigRegistry');
const { GetGameConfigRegistrations } = load('shared/config/ConfigDefinitions');
const { SkillEffectsConfig, GameConfig } = load('shared/config/game/GameConfig');
const { DatabaseManager } = load('DataBase/DatabaseManager'), { MigrationRunner } = load('DataBase/migrations/MigrationRunner');
const { AccountRepository } = load('DataBase/repositories/Player/AccountRepository'), { PlayerRepository } = load('DataBase/repositories/Player/PlayerRepository');
const { PlayerInstance } = load('GameServer/Game/Player/PlayerInstance'), { DatabaseHelper } = load('DataBase/DatabaseHelper'), { DataSaver } = load('DataBase/savers/DataSaver');
const { TeamPresetsHandler } = load('GameServer/Server/Packet/Recv/NoNo/TeamPresets');
load('GameServer/Server/Packet/Recv/Battle/StarArenaHandlers');
const { BattleExperienceHandler } = load('GameServer/Server/Packet/Recv/Battle/BattleExperienceHandlers');
const { BattleExperience: F } = load('GameServer/Game/Battle/BattleExperience');
const { BattleTurnExecutor: Executor } = load('GameServer/Game/Battle/BattleTurnExecutor');
const { SkillEffectRuntime: R } = load('GameServer/Game/Battle/SkillEffectRuntime');
const { ArenaStrategy: AI } = load('GameServer/Game/Battle/ArenaStrategy');
const { ReconcilePetPP } = load('GameServer/Game/Pet/PetPP');
const db = DatabaseManager.Instance, players = [], results = [];
const database = path.join(os.tmpdir(), 'seer-experience-' + crypto.randomBytes(10).toString('hex') + '.sqlite');
let catchTime = 1810000000;
async function account(name) {
  const uid = await new AccountRepository().CreateAccount(name + '-' + Date.now() + '@experience.invalid', crypto.createHash('md5').update('PrivateSmoke1025!').digest('hex'));
  await new PlayerRepository().CreatePlayer(uid, name, 0x3399cc); await new AccountRepository().UpdateRoleCreated(uid, true);
  const session = { Socket: { destroyed: false, write: () => true } }, packets = [];
  const p = new PlayerInstance(session, uid, {}); session.Player = p;
  p.SendPacket = async proto => packets.push({ command: proto.getCmdId(), result: proto.getResult(), body: proto.serialize(p.ClientProtocol) });
  await p.Initialize(); p.Data.mapID = 9508; players.push(p); return { p, packets };
}
async function pet(p, id) { const identity = catchTime++; await p.PetManager.GivePet(id, 100, identity); return p.PetManager.PetData.GetPetByCatchTime(identity); }
async function update(p, pet, patch) { await p.PetManager.PetData.CommitPetUpdate(pet, { ...pet, ...patch }); }
async function teams(context, operation, slot = 0, extra = {}) {
  await new TeamPresetsHandler().Handle(context.p.Session, {}, Buffer.from(JSON.stringify({ version: 2, operation, slot, ...extra })));
  const bytes = context.packets.findLast(packet => packet.command === 91003).body;
  return JSON.parse(bytes.subarray(4, 4 + bytes.readUInt32BE(0)).toString());
}
async function test(name, fn) { await fn(); results.push(name); }
function combatPet(manager, id = 303, identity = 1900000000) { return manager._initService.BuildBattlePet(id, GameConfig.GetPetById(id).DefName, 100, 1000, 1000, 200, 200, 200, 200, 100, GameConfig.GetPetById(id).Type, [10001, 20036], identity, 0); }
function battle(p, own = 303, foe = 216) { const manager = p.BattleManager; const value = { userId: p.Uid, turn: 1, player: combatPet(manager, own), enemy: combatPet(manager, foe, 1900000001), battleType: 'PVE', pendingEntry: {}, starArena: { trainer: { style: 'balanced' } } }; F.Ensure(value); return value; }
const strike = { id: 10001, name: '撞击', category: 1, type: 8, power: 35, accuracy: 100, priority: 0, mustHit: true };
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config'); Config.Config.database = { type: 'sqlite', path: database };
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations()); await ConfigRegistry.Instance.Initialize();
  await load('shared/config/game/SkillEffectsConfig').SkillEffectsConfig.Instance.Load(); await db.Initialize(); await new MigrationRunner().RunAll();
  const context = await account('Loadout'), other = await account('Other'); const { p } = context;
  await test('Real fusion species accept only fusion trait reset; ordinary species accept only ordinary reset', () => {
    const traits = load('GameServer/Game/Pet/PetTrait');
    const fusionReset = GameConfig.GetItemById(300052), ordinaryReset = GameConfig.GetItemById(300054);
    const fused = { petId: 303, effectList: [{ itemId: 1044, effectID: 1044 }] };
    const ordinary = { petId: 70, effectList: [{ itemId: 1044, effectID: 1044 }] };
    assert.equal(traits.isFusionSpecies(303), true);
    assert.equal(traits.isFusionSpecies(70), false);
    assert.equal(traits.applyTraitItem(fused, ordinaryReset), 'reject');
    assert.equal(traits.applyTraitItem(ordinary, fusionReset), 'reject');
    assert.equal(traits.applyTraitItem(fused, fusionReset), 'ok');
    assert.equal(traits.applyTraitItem(ordinary, ordinaryReset), 'ok');
    assert.notEqual(traits.currentTraitId(fused), 1044);
    assert.notEqual(traits.currentTraitId(ordinary), 1044);
  });
  const lisa = await pet(p, 303), ray = await pet(p, 70);
  const learnable = GameConfig.GetPetById(303).LearnableMoves.Move.filter(move => move.LearningLv <= 100).map(move => move.ID);
  const a = learnable.slice(0, 4), b = learnable.slice(4, 8);
  await update(p, lisa, { skillArray: a, skillPP: ReconcilePetPP({ ...lisa, skillArray: a }, true) });
  await test('Named presets persist legal members, default and four moves', async () => {
    const view = await teams(context, 0); const saved = await teams(context, 1, 1, { name: '擂台队', revision: view.teams[0].revision }); assert.equal(saved.ok, true, JSON.stringify(saved)); assert.equal(saved.teams[0].name, '擂台队'); assert.deepEqual(saved.teams[0].members[0].skills, a);
    const stored = JSON.parse((await db.Query('SELECT members FROM player_team_presets WHERE owner_id=? AND slot=1', [p.Uid]))[0].members); assert.equal(stored.version, 2); assert.equal(stored.name, '擂台队');
  });
  await update(p, lisa, { skillArray: b, skillPP: ReconcilePetPP({ ...lisa, skillArray: b }, true) });
  let view = await teams(context, 0); await teams(context, 1, 2, { name: '另一配招', revision: view.teams[1].revision });
  await update(p, lisa, { skillArray: a, hp: 23, skillPP: { ...ReconcilePetPP({ ...lisa, skillArray: a }, true), [a[0]]: 0 } });
  await test('Switching loadouts never restores HP or previously depleted PP, including returning to an unequipped move', async () => {
    for (const slot of [2, 1, 2, 1]) { const preview = await teams(context, 3, slot); assert.equal(preview.teams[slot - 1].error, ''); const applied = await teams(context, 2, slot, { revision: preview.teams[slot - 1].revision }); assert.equal(applied.ok, true); assert.equal(lisa.hp, 23); }
    assert.equal(lisa.skillPP[a[0]], 0); assert.deepEqual(lisa.skillArray, a);
    const durable = JSON.parse((await db.Query('SELECT pet_list FROM player_pets WHERE owner_id=?', [p.Uid]))[0].pet_list).find(pet => pet.catchTime === lisa.catchTime); assert.equal(durable.skillPP[a[0]], 0); assert.equal(durable.skillPPArchive[a[0]], 0);
  });
  await test('Preview rejects changes made after its revision; rejection leaves the bag and moves unchanged', async () => {
    const preview = await teams(context, 3, 2); await update(p, lisa, { hp: 22, skillPP: { ...lisa.skillPP, [a[1]]: 0 } });
    const before = JSON.stringify(p.PetManager.PetData.PetList); const result = await teams(context, 2, 2, { revision: preview.teams[1].revision }); assert.equal(result.ok, false); assert.match(result.error, /状态已变化/); assert.equal(JSON.stringify(p.PetManager.PetData.PetList), before);
  });
  await test('Invalid or missing pets and illegal moves cannot be restored; duplicate members are rejected', async () => {
    const original = (await db.Query('SELECT members FROM player_team_presets WHERE owner_id=? AND slot=1', [p.Uid]))[0].members;
    for (const mutate of [value => value.members[0].skills = [31351], value => value.members[0].catchTime = 1901234567, value => value.members.push(value.members[0])]) {
      const changed = JSON.parse(original); mutate(changed); await db.Execute('UPDATE player_team_presets SET members=? WHERE owner_id=? AND slot=1', [JSON.stringify(changed), p.Uid]);
      const preview = await teams(context, 3, 1); assert.ok(preview.teams[0].error); const before = JSON.stringify(p.PetManager.PetData.PetList); const result = await teams(context, 2, 1, { revision: preview.teams[0].revision }); assert.equal(result.ok, false); assert.equal(JSON.stringify(p.PetManager.PetData.PetList), before);
    }
    await db.Execute('UPDATE player_team_presets SET members=? WHERE owner_id=? AND slot=1', [original, p.Uid]);
  });
  await test('Legacy member-only preset upgrades once without changing ownership; another account never sees it', async () => {
    await db.Execute('INSERT INTO player_team_presets(owner_id,slot,members) VALUES(?,?,?)', [p.Uid, 3, JSON.stringify([ray.catchTime, lisa.catchTime])]);
    const upgraded = await teams(context, 0); assert.equal(upgraded.teams[2].members[0].catchTime, ray.catchTime); assert.deepEqual(upgraded.teams[2].members[1].skills, a);
    const another = await teams(other, 0); assert.equal(another.teams.every(team => !team.saved), true);
    assert.equal(JSON.parse((await db.Query('SELECT members FROM player_team_presets WHERE owner_id=? AND slot=3', [p.Uid]))[0].members).version, 2);
  });
  await test('A storage error rolls back both in-memory and durable party changes', async () => {
    const preview = await teams(context, 3, 2), before = JSON.stringify(p.PetManager.PetData.PetList);
    await db.Execute(`CREATE TRIGGER reject_loadout BEFORE UPDATE ON player_pets WHEN NEW.owner_id=${p.Uid} BEGIN SELECT RAISE(ABORT,'forced loadout storage failure'); END`);
    const result = await teams(context, 2, 2, { revision: preview.teams[1].revision }); assert.equal(result.ok, false); assert.equal(JSON.stringify(p.PetManager.PetData.PetList), before);
    const durable = JSON.parse((await db.Query('SELECT pet_list FROM player_pets WHERE owner_id=?', [p.Uid]))[0].pet_list); assert.deepEqual(durable, JSON.parse(before)); await db.Execute('DROP TRIGGER reject_loadout');
  });
  await test('A preview cannot be applied while in combat', async () => {
    const preview = await teams(context, 3, 2); p.BattleManager.InitializeBattle(battle(p)); const before = JSON.stringify(p.PetManager.PetData.PetList); const result = await teams(context, 2, 2, { revision: preview.teams[1].revision }); assert.equal(result.ok, false); assert.match(result.error, /战斗/); assert.equal(JSON.stringify(p.PetManager.PetData.PetList), before); p.BattleManager.CleanupBattle();
  });
  await test('Control failure is recorded from real can-act settlement and does not masquerade as a miss', () => {
    const value = battle(p); Executor.ExecuteAttack(value, value.player, value.enemy, strike, p.Uid, { canAct: false, reason: 'sleep' }, true);
    assert.ok(value.experience.events.some(event => /睡眠/.test(event.text))); assert.equal(value.experience.counters.player.misses, 0);
  });
  await test('A shield absorption and consumed attack immunity report the actual prevention source', () => {
    let value = battle(p); R.Put(value.enemy, 'shield', Infinity, { points: 10000 }); let result = Executor.ExecuteAttack(value, value.player, value.enemy, strike, p.Uid, { canAct: true }, true); assert.equal(result.damage, 0); assert.ok(value.experience.events.some(event => event.kind === 'shield'));
    value = battle(p); R.Put(value.enemy, 'chAttackBlock', Infinity, { count: 1 }); result = Executor.ExecuteAttack(value, value.player, value.enemy, strike, p.Uid, { canAct: true }, true); assert.equal(result.damage, 0); assert.ok(value.experience.events.some(event => /免疫.*消耗/.test(event.text))); assert.equal(R.Get(value.enemy, 'chAttackBlock'), undefined);
  });
  await test('Guaranteed-hit skills still report an actual consumed skill-failure effect, not random accuracy', () => {
    const value = battle(p); R.Put(value.player, 'chFailNext', Infinity, {}, false); const result = Executor.ExecuteAttack(value, value.player, value.enemy, strike, p.Uid, { canAct: true }, true); assert.equal(result.missed, true); assert.ok(value.experience.events.some(event => /技能失效效果已消耗/.test(event.text))); assert.equal(R.Get(value.player, 'chFailNext'), undefined);
  });
  await test('Effect details reflect real counts and expiry without opponent HP, PP, reserve pets or selected commands', () => {
    const value = battle(p); R.Put(value.player, 'chAttackReduction', Infinity, { count: 2, percent: 45 }); R.Put(value.enemy, 'statusSealed', 2); p.BattleManager.InitializeBattle(value);
    let snapshot = F.View(p.BattleManager); assert.ok(snapshot.own.effects.some(text => /剩余2次/.test(text))); assert.ok(snapshot.foe.effects.some(text => /剩余2回合/.test(text)));
    assert.equal('hp' in snapshot.foe, false); assert.equal('skillPP' in snapshot.foe, false); assert.equal('team' in snapshot.foe, false);
    value.enemy.effectStates.statusSealed.turns = 0; snapshot = F.View(p.BattleManager); assert.equal(snapshot.foe.effects.some(text => /封锁/.test(text)), false); p.BattleManager.CleanupBattle();
  });
  await test('The final report records actual fainted pets and winner, is isolated per account, and resets for the next match', async () => {
    const value = battle(p); p.BattleManager.InitializeBattle(value); value.enemy.hp = 0; F.Dead(value); F.Event(value, '真实结算', 'effect', 'player'); await p.BattleManager.SendFightOverPacket(p, 0, p.Uid); p.BattleManager.CleanupBattle();
    await new BattleExperienceHandler().Handle(p.Session, {}, Buffer.from([0, 0, 0, 1])); const report = JSON.parse(context.packets.findLast(packet => packet.command === 91013).body.toString()).report; assert.equal(report.result, '胜利'); assert.equal(report.lost[0].petId, 216); assert.equal(other.p.lastBattleExperience, undefined);
    p.BattleManager.InitializeBattle(battle(p)); assert.equal(p.lastBattleExperience, null); assert.equal(F.View(p.BattleManager).events.length, 0); p.BattleManager.CleanupBattle();
  });
  await test('Aggressive and defensive trainers make different recovery decisions in the same visible position', () => {
    const value = battle(p); value.enemy.hp = 600; value.enemy.maxHp = 1000; value.player.hp = 1000; value.enemy.skills = [10001, 20027]; value.enemy.skillPP = [20, 10];
    const heal = { id: 20027, name: '栖息', category: 4, type: 8, power: 0, accuracy: 100, sideEffect: '43', sideEffectArg: '2' }, configs = new Map([[10001, strike], [20027, heal]]);
    value.starArena.trainer.style = 'defensive'; assert.equal(AI.SelectSkill(value, configs), 20027); value.starArena.trainer.style = 'aggressive'; assert.equal(AI.SelectSkill(value, configs), 10001);
  });
  await test('Arena AI stops stacking capped buffs, does not duplicate active protection, and cannot select a zero-PP move', () => {
    const value = battle(p); const buff = { id: 20077, name: '强化', category: 4, type: 8, sideEffect: '4', sideEffectArg: '0 100 1', accuracy: 100 }, guard = { id: 20036, name: '防护', category: 4, type: 8, sideEffect: '48', sideEffectArg: '3', accuracy: 100 };
    value.enemy.skills = [10001, buff.id, guard.id]; value.enemy.skillPP = [20, 20, 20]; value.enemy.battleLevels[0] = 6; R.Put(value.enemy, 'statusImmune', 3); const configs = new Map([[10001, strike], [buff.id, buff], [guard.id, guard]]); assert.equal(AI.SelectSkill(value, configs), 10001);
    value.enemy.skillPP[0] = 0; assert.notEqual(AI.SelectSkill(value, configs), 10001); value.enemy.skillPP.fill(0); assert.equal(AI.SelectSkill(value, configs), 0);
  });
  await test('Diamond collection accepts the new 2.5-second boundary while rejecting early and duplicate claims with unchanged yield', async () => {
    const { MaterialGames } = load('GameServer/Game/Map/MaterialGames');
    p.Data.mapID = 13;
    MaterialGames.Join(p, 1); MaterialGames.sessions.get(p).started = Date.now() - 2300;
    await assert.rejects(() => MaterialGames.Finish(p, 100), /not completed/);
    MaterialGames.Join(p, 1); MaterialGames.sessions.get(p).started = Date.now() - 2600;
    const rewards = await MaterialGames.Finish(p, 100);
    assert.deepEqual(rewards, [{ itemId: 400022, count: 3 }]);
    assert.equal(p.ItemManager.ItemData.ItemList.find(item => item.itemId === 400022).count, 3);
    await assert.rejects(() => MaterialGames.Finish(p, 100), /not active/);
    MaterialGames.Join(p, 1); MaterialGames.sessions.get(p).started = Date.now() - 2600; p.Data.mapID = 10;
    await assert.rejects(() => MaterialGames.Finish(p, 100), /not active/);
  });
  await test('Normal harvesting still requires the correct tool and preserves the primary per-claim yield', async () => {
    const { Mining } = load('GameServer/Game/Item/Mining');
    p.Data.mapID = 10; p.Data.clothIds = [];
    await assert.rejects(() => new Mining(p).Claim(1), /equipped tool/);
    p.Data.clothIds = [100014];
    const rewards = await new Mining(p).Claim(1);
    assert.deepEqual(rewards, [{ itemId: 400001, count: 1 }]);
    assert.equal(p.ItemManager.ItemData.ItemList.find(item => item.itemId === 400001).count, 1);
  });
  await test('PvP detail orientation is account-relative and never includes private queued moves', () => {
    const value = battle(p); value.isPvp = true; value.userId = other.p.Uid; value.player2Id = p.Uid;
    value.player.nextSkillId = 31351; value.enemy.nextSkillId = 19230; R.Put(value.enemy, 'chAttackReduction', Infinity, { count: 2, percent: 45 });
    p.BattleManager.InitializeBattle(value); const snapshot = F.View(p.BattleManager);
    assert.equal(snapshot.own.name, value.enemy.name); assert.ok(snapshot.own.effects.some(text => /剩余2次/.test(text)));
    assert.equal(JSON.stringify(snapshot).includes('nextSkill'), false); p.BattleManager.CleanupBattle();
  });
  await test('Arena tactical setup stops once the selected defensive stat is already lowered', () => {
    const value = battle(p); value.starArena.trainer.style = 'tactical';
    const weaken = { id: 20035, name: '摇尾巴', category: 4, type: 8, sideEffect: '5', sideEffectArg: '1 100 -1', accuracy: 100 };
    value.enemy.skills = [10001, weaken.id]; value.enemy.skillPP = [20, 30];
    const configs = new Map([[10001, strike], [weaken.id, weaken]]);
    assert.equal(AI.SelectSkill(value, configs), weaken.id);
    value.player.battleLevels[1] = -2;
    assert.equal(AI.SelectSkill(value, configs), 10001);
  });
  await test('Names, loadouts and archived PP survive a real player reload', async () => {
    await DataSaver.Instance.SaveUser(p.Uid); p.Data.cleanup(); DatabaseHelper.Instance.RemoveCache(p.Uid);
    const session = { Socket: { destroyed: false, write: () => true } }, reloaded = new PlayerInstance(session, p.Uid, {}); session.Player = reloaded; reloaded.SendPacket = async () => {};
    await reloaded.Initialize(); players.push(reloaded);
    const pet = reloaded.PetManager.PetData.GetPetByCatchTime(lisa.catchTime);
    assert.deepEqual(pet.skillArray, a); assert.equal(pet.skillPP[a[0]], 0); assert.equal(pet.skillPPArchive[a[0]], 0);
    const stored = JSON.parse((await db.Query('SELECT members FROM player_team_presets WHERE owner_id=? AND slot=1', [p.Uid]))[0].members);
    assert.equal(stored.name, '擂台队'); assert.deepEqual(stored.members[0].skills, a);
  });
  console.log(JSON.stringify({ passed: results.length, results, database: 'isolated temporary SQLite only' }, null, 2));
})().catch(error => { console.error(error.stack); process.exitCode = 1; }).finally(async () => {
  for (const p of players) { p.Data?.cleanup(); await DataSaver.Instance.SaveUser(p.Uid); DatabaseHelper.Instance.RemoveCache(p.Uid); }
  await db.Shutdown(); fs.rmSync(database, { force: true }); process.exit(process.exitCode || 0);
});
