import { DatabaseHelper } from '../DatabaseHelper';
import { TaskData } from '../models/TaskData';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DatabaseManager } from '../DatabaseManager';
import { SQLiteDriver } from '../drivers/SQLiteDriver';

function gate() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

test('unrelated writes wait outside rollback and subsequent transactions remain usable', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'kose-transaction-isolation-'));
  const driver = new SQLiteDriver({filename: join(directory, 'test.sqlite')});
  const db = DatabaseManager.Instance;
  const spy = jest.spyOn(db, 'Driver', 'get').mockReturnValue(driver);
  const entered = gate();
  const resume = gate();
  try {
    await driver.connect();
    await db.Execute('CREATE TABLE proof (id INTEGER PRIMARY KEY)');
    const transaction = db.Transaction(async connection => {
      await connection.execute('INSERT INTO proof VALUES (1)');
      entered.resolve();
      await resume.promise;
      throw new Error('rollback expected');
    });
    const rejected = expect(transaction).rejects.toThrow('rollback expected');
    await entered.promise;
    let unrelatedDone = false;
    const outside = db.Execute('INSERT INTO proof VALUES (2)').then(() => { unrelatedDone = true; });
    await Promise.resolve();
    expect(unrelatedDone).toBe(false);
    resume.resolve();
    await rejected;
    await outside;
    await db.Transaction(connection => connection.execute('INSERT INTO proof VALUES (3)'));
    expect(await db.Query('SELECT id FROM proof ORDER BY id')).toEqual([{id: 2}, {id: 3}]);
  } finally {
    resume.resolve();
    await driver.disconnect();
    spy.mockRestore();
    rmSync(directory, {recursive: true, force: true});
  }
});


test('a queued save reads live data only after the atomic operation publishes', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'kose-save-order-'));
  const driver = new SQLiteDriver({filename: join(directory, 'test.sqlite')});
  const db = DatabaseManager.Instance;
  const spy = jest.spyOn(db, 'Driver', 'get').mockReturnValue(driver);
  const entered = gate();
  const resume = gate();
  const tasks = new TaskData(1);
  tasks.TaskList.set(86, {taskId: 86, status: 1, acceptTime: 1, completeTime: 0});
  try {
    await driver.connect();
    await db.Execute('CREATE TABLE player_tasks (owner_id INTEGER PRIMARY KEY, task_list TEXT, task_buffers TEXT)');
    const owner = db.WithConnection(async () => {
      entered.resolve();
      await resume.promise;
      tasks.TaskList.set(86, {taskId: 86, status: 3, acceptTime: 1, completeTime: 2});
    });
    await entered.promise;
    const waitingSave = DatabaseHelper.Instance.SaveTaskData(tasks, true);
    resume.resolve();
    await owner;
    await waitingSave;
    const rows = await db.Query<any>('SELECT task_list FROM player_tasks');
    expect(JSON.parse(rows[0].task_list)['86'].status).toBe(3);
  } finally {
    resume.resolve();
    await driver.disconnect();
    spy.mockRestore();
    rmSync(directory, {recursive: true, force: true});
  }
});
