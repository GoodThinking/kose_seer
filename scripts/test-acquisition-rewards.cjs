'use strict';
// Pass the assembled app directory. Private settlement calls test the atomic
// boundary, not a complete player-operated battle or client acceptance.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
assert.ok(process.argv[2], 'Usage: node scripts/test-acquisition-rewards.cjs <assembled-app> [--evidence <path>]');
assert.ok(process.argv.length === 3 || (process.argv.length === 5 && process.argv[3] === '--evidence'), 'Invalid arguments');
const evidence = process.argv[4] ? path.resolve(process.argv[4]) : null;
const app = path.resolve(process.argv[2]);
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const { Logger } = load('shared/utils');
for (const key of ['Info', 'Debug', 'Warn']) Logger[key] = () => {};
const { Config } = load('shared/config/ServerConfig');
const { ConfigLoader } = load('shared/config/ConfigLoader');
const { ConfigRegistry } = load('shared/config/ConfigRegistry');
const { GetGameConfigRegistrations } = load('shared/config/ConfigDefinitions');
const { DatabaseManager } = load('DataBase/DatabaseManager');
const { MigrationRunner } = load('DataBase/migrations/MigrationRunner');
const { DataSaver } = load('DataBase/savers/DataSaver');
const { ChallengeProgressDataAccessor } = load('DataBase/accessors/ChallengeProgressDataAccessor');
const { DataCache } = load('DataBase/cache/DataCache');
const { DataConfigRegistry } = load('DataBase/config/DataConfig');
const { AccountRepository } = load('DataBase/repositories/Player/AccountRepository');
const { PlayerRepository } = load('DataBase/repositories/Player/PlayerRepository');
const { PlayerInstance } = load('GameServer/Game/Player/PlayerInstance');
const { PvpBattleManager } = load('GameServer/Game/Battle/PvpBattleManager');
// The runtime singleton has no disposer; capture only its constructor's timer.
const nativeSetInterval = global.setInterval;
let pvpCleanupInterval;
try {
  global.setInterval = (...args) => {
    assert.equal(pvpCleanupInterval, undefined, 'Unexpected extra PvP cleanup interval');
    pvpCleanupInterval = nativeSetInterval(...args);
    return pvpCleanupInterval;
  };
  void PvpBattleManager.Instance;
} finally {
  global.setInterval = nativeSetInterval;
}
assert.ok(pvpCleanupInterval, 'Expected PvP cleanup interval');
const { BattleRewardService } = load('GameServer/Game/Battle/services/BattleRewardService');
const { ItemSystem } = load('GameServer/Game/Item/ItemSystem');
const { TaskStatus } = load('DataBase/models/TaskData');
const db = DatabaseManager.Instance;
const database = path.join(os.tmpdir(), 'seer-spt-' + crypto.randomBytes(10).toString('hex') + '.sqlite');
const players = [], results = [];
const boss = { bossMapId: 22, bossParam2: 0, enemy: { id: 34 } };
const mushroom = { bossMapId: 12, bossParam2: 0, enemy: { id: 47 } };
async function account(name) {
  const uid = await new AccountRepository().CreateAccount(name + '-' + crypto.randomBytes(5).toString('hex') + '@spt.invalid', crypto.createHash('md5').update('PrivateWorkflow1026!').digest('hex'));
  await new PlayerRepository().CreatePlayer(uid, name, 0x3399cc);
  await new AccountRepository().UpdateRoleCreated(uid, true);
  const session = { Socket: { destroyed: false, write: () => true } };
  const player = new PlayerInstance(session, uid, {}); session.Player = player;
  player.SendPacket = async () => {};
  await player.Initialize(); players.push(player); return player;
}
async function state(player) {
  const [items] = await db.Query('SELECT item_list FROM player_items WHERE owner_id=?', [player.Uid]);
  const [progress] = await db.Query('SELECT boss_achievement,max_puni_lv,tower_boss_index FROM player_challenge_progress WHERE user_id=?', [player.Uid]);
  return { items: JSON.parse(items.item_list), bits: Buffer.from(progress.boss_achievement), puni: progress.max_puni_lv, tower: progress.tower_boss_index };
}
async function settle(player, battle = boss) { return new BattleRewardService(player).ProcessSPTFirstDefeatReward(battle); }
async function test(name, fn) { await fn(); results.push(name); }
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  Config.Config.database = { type: 'sqlite', path: database };
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations()); await ConfigRegistry.Instance.Initialize();
  await load('shared/config/game/SkillEffectsConfig').SkillEffectsConfig.Instance.Load();
  await db.Initialize(); await new MigrationRunner().RunAll();
  assert.equal(ItemSystem.Exists(400051), true);
  assert.equal(ItemSystem.GetMaxStack(400051), 1);
  await test('Second write failure rolls back inventory, progress, and cache', async () => {
    const p = await account('Rollback'), before = await state(p);
    await db.Execute(`CREATE TRIGGER reject_spt BEFORE UPDATE OF boss_achievement ON player_challenge_progress WHEN NEW.user_id=${p.Uid} AND NEW.boss_achievement != OLD.boss_achievement BEGIN SELECT RAISE(ABORT,'forced second write failure'); END`);
    try {
      await assert.rejects(settle(p), /forced second write failure/);
      const after = await state(p);
      assert.deepEqual(after.items, before.items); assert.deepEqual(after.bits, before.bits);
      assert.equal(p.ItemManager.GetItemCount(400051), 0); assert.equal(p.ChallengeProgressManager.HasDefeatedSPTBoss(2), false);
    } finally { await db.Execute('DROP TRIGGER reject_spt'); }
  });
  await test('Real Max=1 keeps first-win eligibility when already owned', async () => {
    const p = await account('Full');
    assert.equal(await p.ItemManager.GiveItem(400051, 1), true);
    await assert.rejects(settle(p), /inventory full/);
    const saved = await state(p);
    assert.equal(saved.items.find(i => i.itemId === 400051).count, 1); assert.equal(saved.bits[1], 0);
    assert.equal(p.ChallengeProgressManager.HasDefeatedSPTBoss(2), false);
  });
  await test('Concurrent distinct reward services award only once', async () => {
    const p = await account('Concurrent');
    const values = await Promise.all([settle(p), settle(p)]);
    assert.equal(values.flat().length, 1);
    const saved = await state(p);
    assert.equal(saved.items.find(i => i.itemId === 400051).count, 1); assert.equal(saved.bits[1], 1);
  });
  await test('Queued saves preserve another SPT flag and concurrent Puni/tower changes', async () => {
    const p = await account('Queued'), progress = p.ChallengeProgressManager._data;
    let enter, release;
    const entered = new Promise(resolve => { enter = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    const holder = db.WithConnection(async () => { enter(); await gate; });
    await entered;
    progress.bossAchievement[4] = true; progress.maxPuniLv = 3; progress.towerBossIndex = 7;
    const pending = ChallengeProgressDataAccessor.Instance.Save(progress);
    const reward = settle(p);
    release(); await holder; await pending; await reward;
    const saved = await state(p);
    assert.equal(saved.bits[1], 1); assert.equal(saved.bits[4], 1); assert.equal(saved.puni, 3); assert.equal(saved.tower, 7);
    assert.equal(progress.bossAchievement[1], true); assert.equal(progress.bossAchievement[4], true);
  });
  await test('Notification failure after commit cannot cause another grant', async () => {
    const p = await account('Notify'), emit = p.EventBus.Emit.bind(p.EventBus);
    p.EventBus.Emit = async () => { throw new Error('forced notification failure'); };
    try { assert.equal((await settle(p)).length, 1); } finally { p.EventBus.Emit = emit; }
    assert.deepEqual(await settle(p), []);
    const saved = await state(p);
    assert.equal(saved.bits[1], 1); assert.equal(saved.items.find(i => i.itemId === 400051).count, 1);
  });
  await test('Non-victory fight end does not grant or mark', async () => {
    const p = await account('Defeat'), manager = p.BattleManager;
    const combat = { ...boss, battleType: 'PVE', player: { id: 1, petId: 1 }, enemy: { id: 34, petId: 34 } };
    manager._currentBattle = combat; manager._currentBattleMapId = 22;
    manager.SyncBattlePetHP = async () => {};
    manager.SendFightOverPacket = async () => {};
    manager.CleanupPveMap = async () => {};
    await manager.HandleFightOver(0, 0);
    const saved = await state(p);
    assert.equal(saved.bits[1], 0); assert.equal(p.ItemManager.GetItemCount(400051), 0);
  });
  await test('SPT 1 retains actual pet 46 and task 301 behavior', async () => {
    const p = await account('Mushroom');
    assert.deepEqual(await settle(p, mushroom), []);
    assert.equal(p.ChallengeProgressManager.HasDefeatedSPTBoss(1), true);
    assert.ok(p.PetManager.PetData.PetList.some(pet => pet.petId === 46));
    assert.equal(p.TaskManager.TaskData.GetTask(301).status, TaskStatus.COMPLETED);
    const tasks = JSON.parse((await db.Query('SELECT task_list FROM player_tasks WHERE owner_id=?', [p.Uid]))[0].task_list);
    assert.equal(tasks[301].status, TaskStatus.COMPLETED);
  });
  // Report after teardown succeeds, so evidence also covers fixture cleanup.
})().catch(error => { console.error(error.stack); process.exitCode = 1; }).finally(async () => {
  try {
    if (players.length) await db.Execute('DROP TRIGGER IF EXISTS reject_spt');
    const models = [];
    for (const player of players) {
      if (player.Data) models.push(player.Data);
      for (const type of DataConfigRegistry.Instance.GetAllTypes()) {
        const data = DataCache.Instance.Get(type, player.Uid);
        if (data) models.push(data);
      }
      const progress = ChallengeProgressDataAccessor.Instance.GetCached(player.Uid);
      if (progress) models.push(progress);
      await player.OnLogout();
      ChallengeProgressDataAccessor.Instance.RemoveCache(player.Uid);
    }
    // Let already scheduled debounces run against the still-open database.
    await new Promise(resolve => setTimeout(resolve, 300));
    await DataSaver.Instance.WaitForSaves();
    await db.WithConnection(async () => {});
    for (const data of models) {
      if (data._saveTimer) {
        clearTimeout(data._saveTimer);
        data._saveTimer = null;
        data._pendingSave = false;
      }
    }
    await DataSaver.Instance.WaitForSaves();
    await db.WithConnection(async () => {});
    await db.Shutdown();
    if (!process.exitCode) {
      const report = JSON.stringify({ passed: results.length, results, scope: 'isolated SQLite; private settlement, not full battle acceptance' }, null, 2) + '\n';
      if (evidence) fs.writeFileSync(evidence, report);
      process.stdout.write(report);
    }
  } finally {
    clearInterval(pvpCleanupInterval);
    fs.rmSync(database, { force: true });
  }
});
