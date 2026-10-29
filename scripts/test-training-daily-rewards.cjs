'use strict';
// Exercise configured daily task rewards against a disposable SQLite database.
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
if (!process.argv[2]) throw new Error('Usage: node test-training-daily-rewards.cjs <app>');
const app = path.resolve(process.argv[2]); process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const { Logger, LogLevel } = load('shared/utils/Logger'); Logger.SetMinLevel(LogLevel.Error);
const { Config } = load('shared/config/ServerConfig');
const { ConfigLoader } = load('shared/config/ConfigLoader');
const { DatabaseManager } = load('DataBase/DatabaseManager');
const { PlayerData } = load('DataBase/models/PlayerData');
const { TaskData, TaskStatus } = load('DataBase/models/TaskData');
const { TaskManager } = load('GameServer/Game/Task/TaskManager');
const { TaskConfig } = load('shared/config/game/TaskConfig');
const { createDefaultPlayerInfo } = load('shared/models/PlayerModel');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-training-daily-'));
const db = DatabaseManager.Instance, uid = 417077, taskId = 405;
const dataObjects = new Set();
const realNow = Date.now;
let originalConnection;
let clock = Date.UTC(2026, 9, 27, 15, 59, 0);
Date.now = () => clock;
const track = data => { dataObjects.add(data); return data; };
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config'); ConfigLoader.Instance.Reload();
  Config.Config.database = { type: 'sqlite', path: path.join(temporary, 'training.sqlite') };
  Config.Game.clientProtocol = 'kose';
  await db.Initialize();
  await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL)');
  await db.Execute("CREATE TABLE player_tasks(owner_id INTEGER PRIMARY KEY,task_list TEXT NOT NULL DEFAULT '{}',task_buffers TEXT NOT NULL DEFAULT '{}')");
  await db.Execute('INSERT INTO players VALUES (?,100,7,123)', [uid]);
  await db.Execute('INSERT INTO player_tasks(owner_id) VALUES (?)', [uid]);
  const config = TaskConfig.Instance.GetTask(taskId);
  assert.equal(config?.type, 'daily', '405 must use the candidate app daily task configuration');
  let packets = [], player;
  const readState = async () => {
    const [wallet] = await db.Query('SELECT coins,gold,allocatable_exp FROM players WHERE user_id=?', [uid]);
    const [row] = await db.Query('SELECT owner_id,task_list,task_buffers FROM player_tasks WHERE owner_id=?', [uid]);
    return { wallet, task: JSON.parse(row.task_list)[taskId], buffer: JSON.parse(row.task_buffers)[taskId], row };
  };
  const reload = async () => {
    const state = await readState();
    const info = Object.assign(createDefaultPlayerInfo(uid, 'TrainingReward'), {
      coins: state.wallet.coins, gold: state.wallet.gold, allocatableExp: state.wallet.allocatable_exp
    });
    player = { Uid: uid, Data: track(new PlayerData(info)), SendPacket: async packet => packets.push(packet.getResult()) };
    player.TaskManager = new TaskManager(player);
    player.TaskManager.TaskData = track(TaskData.FromRow(state.row));
    return player.TaskManager;
  };
  const complete = async manager => {
    packets = []; await manager.CompleteTask(taskId, 0, true);
    assert.equal(packets.length, 1); return packets[0];
  };
  const assertWallet = (state, experience) => assert.deepEqual(state.wallet, { coins: 100, gold: 7, allocatable_exp: experience });
  const assertCache = (manager, state) => {
    assert.equal(player.Data.coins, state.wallet.coins);
    assert.equal(player.Data.gold, state.wallet.gold);
    assert.equal(player.Data.allocatableExp, state.wallet.allocatable_exp);
    assert.deepEqual(manager.TaskData.GetTask(taskId), state.task);
    assert.deepEqual(manager.TaskData.TaskBuffers.get(taskId), state.buffer);
  };
  let manager = await reload();
  await manager.AcceptDailyTask(taskId);
  assert.equal(await complete(manager), 0);
  let state = await readState();
  assertWallet(state, 2123); assert.equal(state.task.status, TaskStatus.COMPLETED); assertCache(manager, state);

  // Reconstruct both real data classes from persisted state and reject a repeat.
  manager = await reload();
  assert.notEqual(await complete(manager), 0);
  state = await readState(); assertWallet(state, 2123); assert.equal(state.task.status, TaskStatus.COMPLETED); assertCache(manager, state);

  // Cross the fixed China-time midnight. A stale completion cannot earn a new reward.
  clock += 2 * 60 * 1000;
  assert.notEqual(await complete(manager), 0);
  state = await readState(); assertWallet(state, 2123); assert.equal(state.task, undefined); assertCache(manager, state);
  await manager.AcceptDailyTask(taskId);
  const beforeFailure = await readState(); assert.equal(beforeFailure.task.status, TaskStatus.ACCEPTED);

  // Fail after both real UPDATEs have executed, before commit: neither can persist.
  originalConnection = db.WithConnection;
  let injected = false;
  db.WithConnection = function(work) { return originalConnection.call(db, driver => work(new Proxy(driver, { get(target, key) {
    if (key === 'execute') return async (sql, args) => {
      const result = await target.execute(sql, args);
      if (!injected && sql.startsWith('UPDATE players SET coins')) { injected = true; throw new Error('injected post-write failure'); }
      return result;
    };
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  }}))); };
  try { assert.notEqual(await complete(manager), 0); } finally { db.WithConnection = originalConnection; }
  assert.equal(injected, true);
  state = await readState(); assert.deepEqual(state, beforeFailure); assertCache(manager, state);
  assert.equal(await complete(manager), 0);
  state = await readState(); assertWallet(state, 4123); assert.equal(state.task.status, TaskStatus.COMPLETED); assertCache(manager, state);

  // A concurrent duplicate is rejected while the first real transaction is pending.
  clock += 24 * 60 * 60 * 1000;
  await manager.AcceptDailyTask(taskId);
  let entered, release;
  const started = new Promise(resolve => { entered = resolve; });
  const barrier = new Promise(resolve => { release = resolve; });
  db.WithConnection = function(work) { return originalConnection.call(db, driver => work(new Proxy(driver, { get(target, key) {
    if (key === 'execute') return async (sql, args) => {
      const result = await target.execute(sql, args);
      if (sql.startsWith('UPDATE players SET coins')) { entered(); await barrier; }
      return result;
    };
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  }}))); };
  packets = [];
  const first = manager.CompleteTask(taskId, 0, true);
  try {
    await started;
    await manager.CompleteTask(taskId, 0, true);
    assert.deepEqual(packets, [5000]);
  } finally { release(); await first; db.WithConnection = originalConnection; }
  assert.deepEqual(packets, [5000, 0]);
  state = await readState(); assertWallet(state, 6123); assert.equal(state.task.status, TaskStatus.COMPLETED); assertCache(manager, state);
  console.log('Training daily reward SQLite atomicity, concurrency and day rollover passed');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  Date.now = realNow;
  if (originalConnection) db.WithConnection = originalConnection;
  for (const data of dataObjects) if (data?._saveTimer) clearTimeout(data._saveTimer);
  await db.Shutdown(); fs.rmSync(temporary, { recursive: true, force: true });
});
