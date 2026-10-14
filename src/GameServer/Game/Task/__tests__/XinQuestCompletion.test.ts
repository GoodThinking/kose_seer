import * as starter from '../CompleteStarterTask';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { TaskManager } from '../TaskManager';
import { TaskData } from '../../../../DataBase/models/TaskData';
import { DatabaseHelper } from '../../../../DataBase/DatabaseHelper';
import { DatabaseManager } from '../../../../DataBase/DatabaseManager';
import { SQLiteDriver } from '../../../../DataBase/drivers/SQLiteDriver';
import { Migration012FixAllTables } from '../../../../DataBase/migrations/scripts/012_fix_all_tables';
import { Migration006CreateItems } from '../../../../DataBase/migrations/scripts/006_create_items';
import { ItemManager } from '../../Item/ItemManager';
import { GameEventBus } from '../../Event/GameEventBus';
import { GameConfig } from '../../../../shared/config/game/GameConfig';
import { ConfigLoader } from '../../../../shared/config/ConfigLoader';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { PacketBuilder } from '../../../../shared/protocol/PacketBuilder';
import { Handlers } from '../../../../shared/decorators/Opcode';
import '../../../../GameServer/Server/Packet/Recv/Task';

describe('task completion admission and retry', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(async () => {
    await jest.runOnlyPendingTimersAsync();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  function fixture() {
    jest.spyOn(DatabaseHelper.Instance, 'SaveTaskData').mockResolvedValue();
    const player: any = {
      Uid: 72001, ClientProtocol: 'xin-20261013',
      Data: {}, EventBus: new GameEventBus(),
      PetManager: { GivePet: jest.fn().mockResolvedValue(true), PetData: { PetList: [{ level: 5 }] } },
      ItemManager: { GiveItem: jest.fn().mockResolvedValue(true) },
      SendPacket: jest.fn().mockResolvedValue(undefined),
    };
    const manager = new TaskManager(player);
    manager.TaskData = new TaskData(player.Uid);
    const grant = jest.spyOn(starter, 'CompleteStarterTask').mockImplementation(async tasks => { tasks.CompleteTask(86); });
    return { manager, player, grant };
  }

  it('rejects invalid local pet choices without reward or state changes, then accepts a corrected retry', async () => {
    const { manager, player, grant } = fixture();
    manager.TaskData.AcceptTask(86);
    await manager.CompleteTask(86, 999);
    expect(grant).not.toHaveBeenCalled();
    expect(manager.TaskData.IsTaskCompleted(86)).toBe(false);
    expect(player.SendPacket.mock.calls.at(-1)[0].getResult()).toBe(5001);
    await manager.CompleteTask(86, 2);
    expect(grant).toHaveBeenCalledTimes(1);
    expect(grant.mock.calls[0][2]).toBe(7);
    expect(manager.TaskData.IsTaskCompleted(86)).toBe(true);
    await manager.CompleteTask(86, 2);
    expect(grant).toHaveBeenCalledTimes(1);
    expect(player.SendPacket.mock.calls.at(-1)[0].getResult()).toBe(5003);
  });

  it('releases admission after a pre-reward failure and keeps it held while saving', async () => {
    const { manager, player, grant } = fixture();
    await manager.CompleteTask(86, 1); // not accepted: no side effect
    expect(player.SendPacket.mock.calls.at(-1)[0].getResult()).toBe(5002);
    manager.TaskData.AcceptTask(86);
    let release!: () => void;
    grant.mockImplementationOnce(tasks => new Promise<void>(resolve => {
      release = () => { tasks.CompleteTask(86); resolve(); };
    }));
    const pending = manager.CompleteTask(86, 1);
    // Atomic grant is held pending while a duplicate request arrives.
    await Promise.resolve();
    await manager.CompleteTask(86, 1);
    expect(player.SendPacket.mock.calls.at(-1)[0].getResult()).toBe(5000);
    expect(grant).toHaveBeenCalledTimes(1);
    release();
    await pending;
    expect(player.SendPacket.mock.calls.at(-1)[0].getResult()).toBe(0);
  });
});

describe('task 87 completion with actual item persistence', () => {
  it('resumes accepted task 87 after reconnect, grants once, and rejects completed replay after reload', async () => {
    jest.useFakeTimers();
    const directory = mkdtempSync(join(tmpdir(), 'xin-quest-complete-'));
    const driver = new SQLiteDriver({ filename: join(directory, 'state.sqlite') });
    const driverSpy = jest.spyOn(DatabaseManager.Instance, 'Driver', 'get').mockReturnValue(driver);
    // Use actual KOSE items.xml; only bypass unrelated server-wide config initialization.
    const itemConfig = ConfigLoader.Instance.LoadXmlSync('data/xml/items.xml');
    expect(itemConfig).not.toBeNull();
    const configSpy = jest.spyOn(GameConfig, 'GetItemConfig').mockReturnValue(itemConfig);
    const uid = 72002;
    const packets: Buffer[] = [];
    const player: any = {
      Uid: uid, ClientProtocol: 'xin-20261013', Data: { coins: 0 },
      EventBus: new GameEventBus(),
      _packetBuilder: new PacketBuilder('1'),
      _session: { Socket: { write: (packet: Buffer) => packets.push(packet) } },
      SendPacket: PlayerInstance.prototype.SendPacket,
    };
    const session = { Player: player };
    const accept = Buffer.alloc(4); accept.writeUInt32BE(87);
    const complete = Buffer.alloc(8); complete.writeUInt32BE(87); complete.writeUInt32BE(1, 4);
    async function route(command: number, body: Buffer): Promise<void> {
      const Handler = Handlers.Get(command)!;
      expect(Handler).toBeDefined();
      await new Handler().Handle(session, {}, body);
    }
    try {
      await driver.connect();
      await driver.execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY)');
      await driver.execute('INSERT INTO players VALUES (?)', [uid]);
      await driver.execute(new Migration012FixAllTables().upSQLite().find(sql => sql.includes('CREATE TABLE IF NOT EXISTS player_tasks'))!);
      await driver.execute(new Migration006CreateItems().upSQLite()[0]);
      player.TaskManager = new TaskManager(player);
      player.ItemManager = new ItemManager(player);
      await player.TaskManager.Initialize();
      await player.ItemManager.Initialize();
      expect(player.TaskManager.GetTaskStatusArray()[86]).toBe(0);
      await route(2202, complete);
      expect(packets.at(-1)!.readInt32BE(13)).toBe(5002);
      expect(player.ItemManager.GetItemCount(300001)).toBe(0);
      expect(player.ItemManager.GetItemCount(300011)).toBe(0);
      await route(2201, accept);
      expect(packets.at(-1)!.readInt32BE(13)).toBe(0);
      expect(packets.at(-1)!.subarray(17)).toEqual(accept);
      expect(player.TaskManager.GetTaskStatusArray()[86]).toBe(1);
      // Client StepThree.start resumes ALR_ACCEPT without a second accept request.
      await jest.runOnlyPendingTimersAsync();
      DatabaseHelper.Instance.RemoveCache(uid);
      await driver.disconnect();
      await driver.connect();
      player.TaskManager = new TaskManager(player);
      player.ItemManager = new ItemManager(player);
      await player.TaskManager.Initialize();
      await player.ItemManager.Initialize();
      expect(player.TaskManager.GetTaskStatusArray()[86]).toBe(1);
      expect(player.TaskManager.TaskData.TaskBuffers.size).toBe(0); // XML has no pro nodes.
      expect(player.ItemManager.GetItemCount(300001)).toBe(0);
      expect(player.ItemManager.GetItemCount(300011)).toBe(0);
      packets.length = 0;
      await Promise.all([route(2202, complete), route(2202, complete)]);
      expect(packets.map(p => p.readInt32BE(13)).sort()).toEqual([0, 5000]);
      const success = packets.find(p => p.readInt32BE(13) === 0)!;
      expect(success.readUInt32BE(0)).toBe(success.length);
      expect(success.readUInt32BE(5)).toBe(2202);
      expect(success.readUInt32BE(9)).toBe(uid);
      const body = success.subarray(17);
      // Independent NoviceFinishInfo order: task, pet, captureTime, count, pairs.
      expect(body.length).toBe(32);
      expect(Array.from({ length: 8 }, (_, index) => body.readUInt32BE(index * 4)))
        .toEqual([87, 0, 0, 2, 300001, 5, 300011, 3]);
      expect(player.ItemManager.GetItemCount(300001)).toBe(5);
      expect(player.ItemManager.GetItemCount(300011)).toBe(3);
      expect(player.TaskManager.GetTaskStatusArray()[86]).toBe(3);
      await jest.runOnlyPendingTimersAsync();
      DatabaseHelper.Instance.RemoveCache(uid);
      await driver.disconnect();
      await driver.connect();
      player.TaskManager = new TaskManager(player);
      player.ItemManager = new ItemManager(player);
      await player.TaskManager.Initialize();
      await player.ItemManager.Initialize();
      expect(player.TaskManager.GetTaskStatusArray()[86]).toBe(3);
      await route(2202, complete);
      expect(packets.at(-1)!.readInt32BE(13)).toBe(5003);
      expect(player.ItemManager.GetItemCount(300001)).toBe(5);
      expect(player.ItemManager.GetItemCount(300011)).toBe(3);
      const rows = await driver.query<any>('SELECT item_list FROM player_items WHERE owner_id = ?', [uid]);
      expect(JSON.parse(rows[0].item_list).map((item: any) => [item.itemId, item.count]))
        .toEqual([[300001, 5], [300011, 3]]);
    } finally {
      await jest.runOnlyPendingTimersAsync();
      DatabaseHelper.Instance.RemoveCache(uid);
      await driver.disconnect();
      driverSpy.mockRestore();
      configSpy.mockRestore();
      jest.useRealTimers();
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
