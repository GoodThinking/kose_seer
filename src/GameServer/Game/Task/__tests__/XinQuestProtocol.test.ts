import { DatabaseHelper } from '../../../../DataBase/DatabaseHelper';
import { TaskData, TaskStatus } from '../../../../DataBase/models/TaskData';
import { AddTaskBufHandler } from '../../../../GameServer/Server/Packet/Recv/Task/AddTaskBufHandler';
import { AcceptTaskHandler } from '../../../../GameServer/Server/Packet/Recv/Task/AcceptTaskHandler';
import { CompleteTaskHandler } from '../../../../GameServer/Server/Packet/Recv/Task/CompleteTaskHandler';
import { GetTaskBufHandler } from '../../../../GameServer/Server/Packet/Recv/Task/GetTaskBufHandler';
import { IClientSession } from '../../../../GameServer/Server/Packet/IHandler';
import { TaskManager } from '../TaskManager';
import * as taskState from '../SaveTaskState';
import * as itemTask from '../CompleteItemTask';
import { GetTaskBufRspProto } from '../../../../shared/proto/packets/rsp/task/GetTaskBufRspProto';
import { PacketGetTaskBuf } from '../../../../GameServer/Server/Packet/Send/Task/PacketGetTaskBuf';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DatabaseManager } from '../../../../DataBase/DatabaseManager';
import { SQLiteDriver } from '../../../../DataBase/drivers/SQLiteDriver';
import { Migration012FixAllTables } from '../../../../DataBase/migrations/scripts/012_fix_all_tables';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { PacketBuilder } from '../../../../shared/protocol/PacketBuilder';
import { Handlers } from '../../../../shared/decorators/Opcode';
import { HeadInfo } from '../../../../shared/protocol/HeadInfo';
import '../../../../GameServer/Server/Packet/Recv/Task';

describe('XIN task buffer and completion flow', () => {
  const taskId = 85;
  let saveTaskData: jest.SpyInstance;
  let saveTaskBuffer: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    saveTaskData = jest.spyOn(DatabaseHelper.Instance, 'SaveTaskData').mockResolvedValue();
    jest.spyOn(taskState, 'SaveAcceptedTask').mockImplementation(async (tasks, id) => tasks.AcceptTask(id));
    saveTaskBuffer = jest.spyOn(taskState, 'SaveTaskBuffer').mockImplementation(async (tasks, id, update) => {
      tasks.TaskBuffers.set(id, update(tasks.TaskBuffers.get(id)));
    });
  });

  afterEach(async () => {
    await jest.runOnlyPendingTimersAsync();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function createPlayer() {
    const sent: Array<{ getResult(): number; serialize(protocol?: 'kose' | 'xin-20261013'): Buffer }> = [];
    const player: any = {
      Uid: 70001,
      ClientProtocol: 'xin-20261013',
      Data: { coins: 0 },
      ItemManager: { GiveItem: jest.fn().mockResolvedValue(undefined) },
      PetManager: { GivePet: jest.fn().mockResolvedValue(undefined) },
      SendPacket: jest.fn(async (packet) => sent.push(packet)),
    };
    const manager = new TaskManager(player);
    manager.TaskData = new TaskData(player.Uid);
    player.TaskManager = manager;
    return { player, manager, sent };
  }

  it('routes the XIN 100-byte buffer through save, response, and TaskData reload', async () => {
    const { player, manager, sent } = createPlayer();
    const session: any = { Player: player };
    const request = Buffer.alloc(104);
    request.writeUInt32BE(taskId, 0);
    for (let index = 0; index < 100; index++) request[4 + index] = (index * 17) & 0xff;

    await new AddTaskBufHandler().Handle(session, {} as any, request);

    expect(saveTaskBuffer).toHaveBeenCalledWith(manager.TaskData, taskId, expect.any(Function));
    expect(sent).toHaveLength(1);
    expect(sent[0].getResult()).toBe(0);

    await new GetTaskBufHandler().Handle(session, {} as any, Buffer.from([0, 0, 0, taskId]));
    const response = sent[1].serialize('xin-20261013');
    expect(response).toHaveLength(108);
    expect(response.readUInt32BE(0)).toBe(taskId);
    expect(response.readUInt32BE(4)).toBe(1);
    expect(response.subarray(8)).toEqual(request.subarray(4));

    const row = manager.TaskData.ToRow();
    const reloaded = TaskData.FromRow({ owner_id: player.Uid, task_list: row.task_list, task_buffers: row.task_buffers });
    expect(reloaded.GetTaskBufferBytes(taskId, 100)).toEqual(request.subarray(4));
  });

  it('legacy KOSE regression: sequential completion calls award configured task 85 only once', async () => {
    const { manager, player } = createPlayer();
    player.ClientProtocol = 'kose';
    player.EventBus = { Emit: jest.fn().mockResolvedValue(undefined) };
    const grant = jest.spyOn(itemTask, 'CompleteItemTask').mockImplementation(async (tasks, _items, _rewards, id) => {
      tasks.CompleteTask(id);
    });
    const session: any = { Player: player };
    const accept = Buffer.alloc(4);
    accept.writeUInt32BE(taskId, 0);
    const complete = Buffer.alloc(8);
    complete.writeUInt32BE(taskId, 0);

    await new AcceptTaskHandler().Handle(session, {} as any, accept);
    await new CompleteTaskHandler().Handle(session, {} as any, complete);

    expect(manager.TaskData.GetTask(taskId)?.status).toBe(TaskStatus.COMPLETED);
    expect(grant).toHaveBeenCalledTimes(1);
    expect(grant.mock.calls[0][2]).toHaveLength(8);
    expect(grant.mock.calls[0][3]).toBe(85);
    expect(player.ItemManager.GiveItem).not.toHaveBeenCalled();

    const row = manager.TaskData.ToRow();
    const reloaded = TaskData.FromRow({ owner_id: player.Uid, task_list: row.task_list, task_buffers: row.task_buffers });
    expect(reloaded.GetTask(taskId)?.status).toBe(TaskStatus.COMPLETED);

    await new CompleteTaskHandler().Handle(session, {} as any, complete);
    expect(grant).toHaveBeenCalledTimes(1);
    expect(player.SendPacket.mock.calls.at(-1)[0].getResult()).toBe(5003);
  });

  it.each([[94, 4], [96, 3]])('round-trips fixed Nieo task %i boolean progress through handlers and reload', async (progressTaskId, stageCount) => {
    const { player, manager, sent } = createPlayer();
    player.ClientProtocol = 'kose';
    // This fixture exercises only handlers that read Player.
    const session = { Player: player } as unknown as IClientSession;
    const head = new HeadInfo();
    const query = Buffer.alloc(4);
    query.writeUInt32BE(progressTaskId);
    await new GetTaskBufHandler().Handle(session, head, query);
    let progress = sent.at(-1)!.serialize('kose').subarray(8);
    expect(progress).toEqual(Buffer.alloc(20));
    manager.TaskData.TaskBuffers.set(progressTaskId, {
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 20: 7, xinBytes: [9]
    });
    for (let stage = 0; stage < stageCount; stage++) {
      // TasksManager.sendCompletePro writes one Boolean at the stage position.
      progress[stage] = 1;
      await new AddTaskBufHandler().Handle(session, head, Buffer.concat([query, progress]));
      expect(sent.at(-1)!.getResult()).toBe(0);
      if (stage === 0) {
        expect(Object.keys(manager.TaskData.TaskBuffers.get(progressTaskId)!).sort()).toEqual(
          Array.from({ length: 20 }, (_, i) => String(i)).sort()
        );
      }
      await new GetTaskBufHandler().Handle(session, head, query);
      progress = sent.at(-1)!.serialize('kose').subarray(8);
      expect([...progress.subarray(0, stageCount)]).toEqual(
        Array.from({ length: stageCount }, (_, i) => i <= stage ? 1 : 0)
      );
    }
    const row = manager.TaskData.ToRow();
    manager.TaskData = TaskData.FromRow({ owner_id: player.Uid, ...row });
    expect(manager.GetTaskBuffer(progressTaskId).slice(0, stageCount)).toEqual(new Array(stageCount).fill(1));
    await new GetTaskBufHandler().Handle(session, head, query);
    expect(sent.at(-1)!.serialize('kose').subarray(8)).toEqual(progress);
  });

  it('reads the legacy five-UInt32 task 96 buffer as its exact UInt32BE byte stream', async () => {
    const { player, manager, sent } = createPlayer();
    player.ClientProtocol = 'kose';
    manager.TaskData.TaskBuffers.set(96, { 0: 16777216, 1: 65536, 2: 0, 3: 0, 4: 0 });
    manager.TaskData.TaskList.set(96, {
      taskId: 96, status: TaskStatus.ACCEPTED, acceptTime: 1, completeTime: 0,
    });

    await new GetTaskBufHandler().Handle({ Player: player } as any, {} as any, Buffer.from([0, 0, 0, 96]));

    let payload = sent[0].serialize('kose').subarray(8);
    expect(payload).toEqual(Buffer.from('0100000000010000000000000000000000000000', 'hex'));
    expect(manager.TaskData.GetTask(96)?.status).toBe(TaskStatus.ACCEPTED);

    const query = Buffer.from([0, 0, 0, 96]);
    for (let stage = 0; stage < 3; stage++) {
      payload[stage] = 1;
      await new AddTaskBufHandler().Handle(
        { Player: player } as any, {} as any, Buffer.concat([query, payload])
      );
      await new GetTaskBufHandler().Handle({ Player: player } as any, {} as any, query);
      payload = sent.at(-1)!.serialize('kose').subarray(8);
      expect([...payload.subarray(0, 4)]).toEqual([0, 1, 2, 3].map(i => i <= stage ? 1 : 0));
    }
    const row = manager.TaskData.ToRow();
    manager.TaskData = TaskData.FromRow({ owner_id: player.Uid, ...row });
    expect(manager.GetTaskBuffer(96)).toEqual([...payload]);
    expect(manager.TaskData.GetTask(96)?.status).toBe(TaskStatus.ACCEPTED);
    expect(player.Data.coins).toBe(0);
    expect(player.ItemManager.GiveItem).not.toHaveBeenCalled();
  });

  it('keeps a canonical twenty-byte task 96 buffer unchanged and rejects mixed legacy shapes', async () => {
    const { player, manager, sent } = createPlayer();
    player.ClientProtocol = 'kose';
    const bytes = Array.from({ length: 20 }, (_, i) => (i * 13) & 0xff);
    manager.TaskData.TaskBuffers.set(96, Object.fromEntries(bytes.map((value, i) => [i, value])));
    await new GetTaskBufHandler().Handle({ Player: player } as any, {} as any, Buffer.from([0, 0, 0, 96]));
    expect(sent[0].serialize('kose').subarray(8)).toEqual(Buffer.from(bytes));

    manager.TaskData.TaskBuffers.set(96, { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 });
    await new GetTaskBufHandler().Handle({ Player: player } as any, {} as any, Buffer.from([0, 0, 0, 96]));
    expect(sent.at(-1)!.getResult()).toBe(5000);
  });

  it('rejects a truncated XIN buffer instead of changing saved task state', async () => {
    const { player, manager, sent } = createPlayer();
    const request = Buffer.alloc(103);
    request.writeUInt32BE(taskId, 0);

    await new AddTaskBufHandler().Handle({ Player: player } as any, {} as any, request);

    expect(manager.TaskData.TaskBuffers.has(taskId)).toBe(false);
    expect(saveTaskData).not.toHaveBeenCalled();
    expect(sent).toHaveLength(1);
    expect(sent[0].getResult()).toBe(5001);
  });

  it('keeps the five UInt32 task-buffer response in kose mode', () => {
    const proto = new GetTaskBufRspProto();
    proto.taskId = taskId;
    proto.buffers = [1, 2, 3, 4, 5];

    const response = proto.serialize('kose');
    expect(response).toHaveLength(28);
    expect([...Array(7).keys()].map(index => response.readUInt32BE(index * 4))).toEqual([
      taskId, 1, 1, 2, 3, 4, 5,
    ]);
  });

  it.each([94, 96])('round-trips fixed Nieo task %i response bytes through the proto', progressTaskId => {
    const expected = Array.from({ length: 20 }, (_, i) => (i * 13) & 0xff);
    const encoded = new GetTaskBufRspProto();
    encoded.taskId = progressTaskId;
    encoded.buffers = expected;

    const decoded = new GetTaskBufRspProto();
    decoded.deserialize(encoded.serialize('kose'));

    expect(decoded.taskId).toBe(progressTaskId);
    expect(decoded.buffers).toEqual(expected);
  });

  it('retains packet snapshots and reports corrupted persisted bytes as an error', async () => {
    const raw = Buffer.alloc(100, 1);
    const values = [1, 2, 3, 4, 5];
    const packet = new PacketGetTaskBuf(taskId, values, raw);
    raw.fill(0);
    values.fill(0);
    expect(packet.serialize('xin-20261013').subarray(8)).toEqual(Buffer.alloc(100, 1));
    expect(packet.serialize('kose').readUInt32BE(8)).toBe(1);
    const { player, manager, sent } = createPlayer();
    manager.TaskData.TaskBuffers.set(taskId, { xinBytes: [999] });
    await new GetTaskBufHandler().Handle({ Player: player } as any, {} as any, Buffer.from([0, 0, 0, taskId]));
    expect(sent[0].getResult()).toBe(5000);
  });

  it('awaits saving and propagates a rejected save into the task response', async () => {
    const { player, sent } = createPlayer();
    let reject!: (reason: Error) => void;
    saveTaskBuffer.mockImplementationOnce(() => new Promise<void>((_resolve, fail) => { reject = fail; }));
    const request = Buffer.alloc(104);
    request.writeUInt32BE(taskId);
    const handling = new AddTaskBufHandler().Handle({ Player: player } as any, {} as any, request);
    expect(sent).toHaveLength(0);
    reject(new Error('injected save failure'));
    await handling;
    expect(sent[0].getResult()).toBe(5000);
  });
});

describe('XIN task handlers with real SQLite and packet framing', () => {
  it('queries, accepts, writes progress, reconnects and reloads without losing legacy buffers', async () => {
    jest.useFakeTimers();
    const directory = mkdtempSync(join(tmpdir(), 'xin-quest-'));
    const driver = new SQLiteDriver({ filename: join(directory, 'tasks.sqlite') });
    const db = DatabaseManager.Instance;
    const driverSpy = jest.spyOn(db, 'Driver', 'get').mockReturnValue(driver);
    const uid = 71001;
    const packets: Buffer[] = [];
    const player: any = {
      Uid: uid, ClientProtocol: 'xin-20261013',
      _packetBuilder: new PacketBuilder('1'),
      _session: { Socket: { write: (packet: Buffer) => packets.push(packet) } },
      SendPacket: PlayerInstance.prototype.SendPacket,
    };
    const request = Buffer.alloc(4);
    request.writeUInt32BE(7);
    const session: any = { Player: player };
    async function dispatch(command: number, body: Buffer): Promise<Buffer> {
      const Handler = Handlers.Get(command)!;
      expect(Handler).toBeDefined();
      await new Handler().Handle(session, {}, body);
      const packet = packets.at(-1)!;
      expect(packet.readUInt32BE(0)).toBe(packet.length);
      expect(packet.readUInt32BE(5)).toBe(command);
      expect(packet.readUInt32BE(9)).toBe(uid);
      return packet;
    }
    try {
      await driver.connect();
      await driver.execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY)');
      await driver.execute('INSERT INTO players VALUES (?)', [uid]);
      const ddl = new Migration012FixAllTables().upSQLite().find(sql => sql.includes('CREATE TABLE IF NOT EXISTS player_tasks'))!;
      await driver.execute(ddl);
      player.TaskManager = new TaskManager(player);
      await player.TaskManager.Initialize();
      expect(player.TaskManager.GetTaskStatusArray()[6]).toBe(0);
      const initial = await dispatch(2203, request);
      expect(initial.subarray(25)).toEqual(Buffer.alloc(100));
      expect(player.TaskManager.TaskData.TaskBuffers.size).toBe(0);
      await dispatch(2201, request);
      expect(player.TaskManager.GetTaskStatusArray()[6]).toBe(1);
      await player.TaskManager.SetTaskBufferValue(7, 0, 0x12345678);
      const update = Buffer.alloc(104);
      request.copy(update);
      update[4] = 1;
      update[5] = 1;
      update[103] = 255;
      expect((await dispatch(2204, update)).readInt32BE(13)).toBe(0);
      const response = await dispatch(2203, request);
      // TaskBufInfo reads two BE UInt32s followed by the untouched byte array.
      expect(response.length).toBe(125);
      expect(response.readUInt32BE(17)).toBe(7);
      expect(response.readUInt32BE(21)).toBe(1);
      expect(response.subarray(25)).toEqual(update.subarray(4));
      const rows = await driver.query<any>('SELECT * FROM player_tasks WHERE owner_id = ?', [uid]);
      expect(JSON.parse(rows[0].task_buffers)['7'].xinBytes).toEqual(Array.from(update.subarray(4)));
      expect(JSON.parse(rows[0].task_buffers)['7']['0']).toBe(0x12345678);
      DatabaseHelper.Instance.RemoveCache(uid);
      await driver.disconnect();
      await driver.connect();
      player.TaskManager = new TaskManager(player);
      await player.TaskManager.Initialize();
      expect(player.TaskManager.GetTaskStatusArray()[6]).toBe(1);
      expect(await dispatch(2203, request)).toEqual(response);
      const malformed = await dispatch(2204, update.subarray(0, 103));
      expect(malformed.readInt32BE(13)).toBe(5001);
      expect(await dispatch(2203, request)).toEqual(response);
      const duplicate = await dispatch(2201, request);
      expect(duplicate.readInt32BE(13)).toBe(5002);
    } finally {
      await jest.runOnlyPendingTimersAsync();
      DatabaseHelper.Instance.RemoveCache(uid);
      await driver.disconnect();
      driverSpy.mockRestore();
      jest.useRealTimers();
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
