import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DatabaseHelper } from '../../../../DataBase/DatabaseHelper';
import { DatabaseManager } from '../../../../DataBase/DatabaseManager';
import { SQLiteDriver } from '../../../../DataBase/drivers/SQLiteDriver';
import { Migration012FixAllTables } from '../../../../DataBase/migrations/scripts/012_fix_all_tables';
import { ItemData } from '../../../../DataBase/models/ItemData';
import { PlayerData } from '../../../../DataBase/models/PlayerData';
import { TaskStatus } from '../../../../DataBase/models/TaskData';
import { CompleteTaskHandler } from '../../../../GameServer/Server/Packet/Recv/Task/CompleteTaskHandler';
import { GetTaskBufHandler } from '../../../../GameServer/Server/Packet/Recv/Task/GetTaskBufHandler';
import { AddTaskBufHandler } from '../../../../GameServer/Server/Packet/Recv/Task/AddTaskBufHandler';
import { TaskManager } from '../TaskManager';
import { TaskConfig } from '../../../../shared/config/game/TaskConfig';
import { createDefaultPlayerInfo } from '../../../../shared/models/PlayerModel';

const taskId = 96;
const legacyValues = { 0: 16777216, 1: 65536, 2: 0, 3: 0, 4: 0 };
const legacyWireBytes = Buffer.from('0100000000010000000000000000000000000000', 'hex');

interface Fixture {
  uid: number;
  directory: string;
  driver: SQLiteDriver;
  driverSpy: jest.SpyInstance;
  player: any;
  sent: any[];
  close(): Promise<void>;
}

async function createFixture(uid: number, options: {
  buffer?: Record<string, any>;
  hasNono?: boolean;
  nonoState?: number;
} = {}): Promise<Fixture> {
  const directory = mkdtempSync(join(tmpdir(), 'task96-reward-'));
  const driver = new SQLiteDriver({ filename: join(directory, 'state.sqlite') });
  const driverSpy = jest.spyOn(DatabaseManager.Instance, 'Driver', 'get').mockReturnValue(driver);
  const sent: any[] = [];
  const initial = { coins: 2500, gold: 25, allocatableExp: 100 };
  const player: any = {
    Uid: uid,
    ClientProtocol: 'kose',
    SendPacket: jest.fn(async packet => sent.push(packet)),
    Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, `task96-${uid}`), initial, {
      hasNono: options.hasNono ?? true,
      nonoState: options.nonoState ?? 2,
    })),
    ItemManager: { ItemData: new ItemData(uid) },
  };

  try {
    await driver.connect();
    await driver.execute(`CREATE TABLE players (
      user_id INTEGER PRIMARY KEY,
      coins INTEGER NOT NULL,
      gold INTEGER NOT NULL,
      allocatable_exp INTEGER NOT NULL,
      has_nono INTEGER NOT NULL,
      nono_state INTEGER NOT NULL
    )`);
    await driver.execute('INSERT INTO players VALUES (?, ?, ?, ?, ?, ?)', [
      uid, initial.coins, initial.gold, initial.allocatableExp,
      player.Data.hasNono ? 1 : 0, player.Data.nonoState,
    ]);
    const taskDdl = new Migration012FixAllTables().upSQLite()
      .find(sql => sql.includes('CREATE TABLE IF NOT EXISTS player_tasks'))!;
    await driver.execute(taskDdl);
    const accepted = {
      taskId, status: TaskStatus.ACCEPTED, acceptTime: 1, completeTime: 0,
    };
    await driver.execute('INSERT INTO player_tasks (owner_id, task_list, task_buffers) VALUES (?, ?, ?)', [
      uid,
      JSON.stringify({ [taskId]: accepted }),
      JSON.stringify(options.buffer === undefined
        ? { [taskId]: legacyValues }
        : { [taskId]: options.buffer }),
    ]);
    player.TaskManager = new TaskManager(player);
    await player.TaskManager.Initialize();
  } catch (error) {
    await driver.disconnect();
    driverSpy.mockRestore();
    rmSync(directory, { recursive: true, force: true });
    throw error;
  }

  return {
    uid, directory, driver, driverSpy, player, sent,
    async close() {
      player.Data.cleanup();
      await jest.runOnlyPendingTimersAsync();
      DatabaseHelper.Instance.RemoveCache(uid);
      await driver.disconnect();
      driverSpy.mockRestore();
      rmSync(directory, { recursive: true, force: true });
    },
  };
}

async function readDurableState(driver: SQLiteDriver, uid: number): Promise<{
  coins: number; gold: number; allocatableExp: number; task: any; buffer: any;
}> {
  const walletRows = await driver.query<any>(
    'SELECT coins, gold, allocatable_exp FROM players WHERE user_id = ?', [uid]
  );
  const taskRows = await driver.query<any>(
    'SELECT task_list, task_buffers FROM player_tasks WHERE owner_id = ?', [uid]
  );
  const tasks = JSON.parse(taskRows[0].task_list);
  const buffers = JSON.parse(taskRows[0].task_buffers);
  return {
    coins: walletRows[0].coins,
    gold: walletRows[0].gold,
    allocatableExp: walletRows[0].allocatable_exp,
    task: tasks[taskId],
    buffer: buffers[taskId],
  };
}

describe('task 96 reward with real SQLite and packet handlers', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(async () => {
    await jest.runOnlyPendingTimersAsync();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('rejects the raw legacy row, resumes its exact bytes, then commits only one reward across replay and reload', async () => {
    const fixture = await createFixture(73096);
    const { uid, driver, player, sent } = fixture;
    let secondPlayer: any;
    const session: any = { Player: player };
    const complete = Buffer.alloc(8);
    complete.writeUInt32BE(taskId, 0);
    complete.writeUInt32BE(1, 4);
    const query = Buffer.alloc(4);
    query.writeUInt32BE(taskId, 0);
    const config = TaskConfig.Instance.GetTask(taskId)!;
    const expectedCoins = 2500 + config.rewards!.coins!;
    const expectedExp = 100 + config.rewards!.special![0].value;

    try {
      // An old integer row is not interpreted as truthy Boolean stages and cannot be claimed.
      await new CompleteTaskHandler().Handle(session, {} as any, complete);
      expect(sent.at(-1)!.getResult()).toBe(5000);
      let durable = await readDurableState(driver, uid);
      expect([durable.coins, durable.gold, durable.allocatableExp]).toEqual([2500, 25, 100]);
      expect(durable.task.status).toBe(TaskStatus.ACCEPTED);
      expect(durable.buffer).toEqual(legacyValues);

      // Actual GET handler returns the exact legacy response stream, including historical stage 0.
      await new GetTaskBufHandler().Handle(session, {} as any, query);
      let progress: Buffer = sent.at(-1)!.serialize('kose').subarray(8);
      expect(progress).toEqual(legacyWireBytes);

      // The client's full 20-byte 2204 writes continue at stages 1 and 2 and persist canonical bytes.
      for (const stage of [1, 2]) {
        progress[stage] = 1;
        await new AddTaskBufHandler().Handle(
          session, {} as any, Buffer.concat([query, progress])
        );
        expect(sent.at(-1)!.getResult()).toBe(0);
        await new GetTaskBufHandler().Handle(session, {} as any, query);
        progress = sent.at(-1)!.serialize('kose').subarray(8);
        expect([...progress.subarray(0, 4)]).toEqual([1, 1, stage === 2 ? 1 : 0, 0]);
        durable = await readDurableState(driver, uid);
        expect(durable.buffer).toEqual(Object.fromEntries([...progress].map((value, i) => [i, value])));
        expect(durable.task.status).toBe(TaskStatus.ACCEPTED);
      }

      // Two independently loaded sessions race through actual 2202 handlers and SQLite transactions.
      secondPlayer = {
        Uid: uid,
        ClientProtocol: 'kose',
        SendPacket: jest.fn(async packet => sent.push(packet)),
        Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, `task96-${uid}-second`), {
          coins: 2500, gold: 25, allocatableExp: 100, hasNono: true, nonoState: 2,
        })),
        ItemManager: { ItemData: new ItemData(uid) },
      };
      DatabaseHelper.Instance.RemoveCache(uid);
      secondPlayer.TaskManager = new TaskManager(secondPlayer);
      await secondPlayer.TaskManager.Initialize();
      const from = sent.length;
      await Promise.all([
        new CompleteTaskHandler().Handle(session, {} as any, complete),
        new CompleteTaskHandler().Handle({ Player: secondPlayer } as any, {} as any, complete),
      ]);
      const results = sent.slice(from).map(packet => packet.getResult()).sort((a, b) => a - b);
      expect(results).toEqual([0, 5000]);
      durable = await readDurableState(driver, uid);
      expect([durable.coins, durable.gold, durable.allocatableExp]).toEqual([expectedCoins, 25, expectedExp]);
      expect([player.Data.coins, player.Data.gold, player.Data.allocatableExp]).toEqual([
        expectedCoins, 25, expectedExp,
      ]);
      expect(durable.task.status).toBe(TaskStatus.COMPLETED);
      expect(durable.buffer[3]).toBe(1);

      // Sequential replay is rejected with no balance delta.
      await new CompleteTaskHandler().Handle(session, {} as any, complete);
      expect(sent.at(-1)!.getResult()).toBe(5003);
      expect(await readDurableState(driver, uid)).toMatchObject({
        coins: expectedCoins, gold: 25, allocatableExp: expectedExp,
      });

      // Drop the task cache, reload from SQLite, then replay again; persisted status still blocks reward.
      DatabaseHelper.Instance.RemoveCache(uid);
      player.TaskManager = new TaskManager(player);
      await player.TaskManager.Initialize();
      expect(player.TaskManager.TaskData.GetTask(taskId)?.status).toBe(TaskStatus.COMPLETED);
      const reloaded = player.TaskManager.GetTaskBuffer(taskId);
      expect(reloaded.slice(0, 4)).toEqual([1, 1, 1, 1]);
      await new CompleteTaskHandler().Handle(session, {} as any, complete);
      expect(sent.at(-1)!.getResult()).toBe(5003);
      expect(await readDurableState(driver, uid)).toMatchObject({
        coins: expectedCoins, gold: 25, allocatableExp: expectedExp,
      });
    } finally {
      secondPlayer?.Data.cleanup();
      await fixture.close();
    }
  });

  it('rejects completed stages when NoNo is not following and leaves SQLite wallet and task unchanged', async () => {
    const bytes = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i, i < 3 ? 1 : 0]));
    const fixture = await createFixture(73097, { buffer: bytes, hasNono: true, nonoState: 0 });
    const { uid, driver, player, sent } = fixture;
    const complete = Buffer.alloc(8);
    complete.writeUInt32BE(taskId, 0);
    complete.writeUInt32BE(1, 4);

    try {
      await new CompleteTaskHandler().Handle({ Player: player } as any, {} as any, complete);
      expect(sent.at(-1)!.getResult()).toBe(5000);
      expect(await readDurableState(driver, uid)).toMatchObject({
        coins: 2500, gold: 25, allocatableExp: 100,
        task: { status: TaskStatus.ACCEPTED },
        buffer: bytes,
      });
    } finally {
      await fixture.close();
    }
  });

  it('rejects legacy UInt32 values 1 because their BE-expanded progress bytes are zero', async () => {
    const falseProgress = { 0: 1, 1: 1, 2: 1, 3: 0, 4: 0 };
    const fixture = await createFixture(73098, { buffer: falseProgress });
    const { uid, driver, player, sent } = fixture;
    const complete = Buffer.alloc(8);
    complete.writeUInt32BE(taskId, 0);
    complete.writeUInt32BE(1, 4);

    try {
      await new CompleteTaskHandler().Handle({ Player: player } as any, {} as any, complete);
      expect(sent.at(-1)!.getResult()).toBe(5000);
      expect(await readDurableState(driver, uid)).toMatchObject({
        coins: 2500, gold: 25, allocatableExp: 100,
        task: { status: TaskStatus.ACCEPTED }, buffer: falseProgress,
      });
    } finally {
      await fixture.close();
    }
  });

  it('claims an eligible legacy UInt32 row once, canonicalizes stage 3, and preserves remaining bytes after reload', async () => {
    const legacyEligible = {
      0: 0x01010100, 1: 0x02030405, 2: 0x06070809,
      3: 0x0a0b0c0d, 4: 0x0e0f1011,
    };
    const expectedCoins = 2500 + TaskConfig.Instance.GetTask(taskId)!.rewards!.coins!;
    const expectedExp = 100 + TaskConfig.Instance.GetTask(taskId)!.rewards!.special![0].value;
    const fixture = await createFixture(73099, { buffer: legacyEligible });
    const { uid, driver, player, sent } = fixture;
    const complete = Buffer.alloc(8);
    const query = Buffer.alloc(4);
    complete.writeUInt32BE(taskId, 0);
    complete.writeUInt32BE(1, 4);
    query.writeUInt32BE(taskId, 0);

    try {
      await new GetTaskBufHandler().Handle({ Player: player } as any, {} as any, query);
      expect([...sent.at(-1)!.serialize('kose').subarray(8)]).toEqual([
        1, 1, 1, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
      ]);

      await new CompleteTaskHandler().Handle({ Player: player } as any, {} as any, complete);
      expect(sent.at(-1)!.getResult()).toBe(0);
      const durable = await readDurableState(driver, uid);
      expect([durable.coins, durable.gold, durable.allocatableExp]).toEqual([expectedCoins, 25, expectedExp]);
      expect(durable.task.status).toBe(TaskStatus.COMPLETED);
      const expectedBytes = [1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
      expect(durable.buffer).toEqual(Object.fromEntries(expectedBytes.map((value, i) => [i, value])));

      DatabaseHelper.Instance.RemoveCache(uid);
      player.TaskManager = new TaskManager(player);
      await player.TaskManager.Initialize();
      expect(player.TaskManager.GetTaskBuffer(taskId)).toEqual(expectedBytes);
      await new GetTaskBufHandler().Handle({ Player: player } as any, {} as any, query);
      expect([...sent.at(-1)!.serialize('kose').subarray(8)]).toEqual(expectedBytes);
      await new CompleteTaskHandler().Handle({ Player: player } as any, {} as any, complete);
      expect(sent.at(-1)!.getResult()).toBe(5003);
      expect(await readDurableState(driver, uid)).toMatchObject({
        coins: expectedCoins, gold: 25, allocatableExp: expectedExp,
      });
    } finally {
      await fixture.close();
    }
  });

  it('keeps the dedicated XIN 100-byte task 96 claim path and its byte positions', async () => {
    const xinBytes = Array.from({ length: 100 }, (_, i) => i + 1);
    xinBytes[0] = xinBytes[1] = xinBytes[2] = 1;
    xinBytes[3] = 0;
    const fixture = await createFixture(73100, { buffer: { xinBytes } });
    const { uid, driver, player, sent } = fixture;
    const complete = Buffer.alloc(8);
    complete.writeUInt32BE(taskId, 0);
    complete.writeUInt32BE(1, 4);
    const expectedCoins = 2500 + TaskConfig.Instance.GetTask(taskId)!.rewards!.coins!;
    const expectedExp = 100 + TaskConfig.Instance.GetTask(taskId)!.rewards!.special![0].value;

    try {
      await new CompleteTaskHandler().Handle({ Player: player } as any, {} as any, complete);
      expect(sent.at(-1)!.getResult()).toBe(0);
      const durable = await readDurableState(driver, uid);
      expect([durable.coins, durable.gold, durable.allocatableExp]).toEqual([expectedCoins, 25, expectedExp]);
      expect(durable.task.status).toBe(TaskStatus.COMPLETED);
      expect(durable.buffer).toEqual({ xinBytes: xinBytes.map((value, i) => i === 3 ? 1 : value) });
      expect([...player.TaskManager.GetTaskBufferBytes(taskId, 100)])
        .toEqual(xinBytes.map((value, i) => i === 3 ? 1 : value));
    } finally {
      await fixture.close();
    }
  });
});
