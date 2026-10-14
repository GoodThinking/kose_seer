import { PetService } from '../../../../GMServer/services/PetService';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DatabaseHelper } from '../../../../DataBase/DatabaseHelper';
import { DatabaseManager } from '../../../../DataBase/DatabaseManager';
import { SQLiteDriver } from '../../../../DataBase/drivers/SQLiteDriver';
import { Migration012FixAllTables } from '../../../../DataBase/migrations/scripts/012_fix_all_tables';
import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../../../shared/config/ConfigDefinitions';
import { createDefaultPetInfo } from '../../../../shared/models/PetModel';
import { PacketBuilder } from '../../../../shared/protocol/PacketBuilder';
import { Handlers } from '../../../../shared/decorators/Opcode';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { PetManager } from '../../Pet/PetManager';
import { GameEventBus } from '../../Event/GameEventBus';
import { TaskManager } from '../TaskManager';
import '../../../../GameServer/Server/Packet/Recv/Task';

test.each([
  // Old Reseer panel evidence: grass/fire/water send outType 1/2/3.
  // These assert existing KOSE rules, not that the panel is an XIN-version asset.
  { taskId: 86, param: 1, petId: 1, level: 5, protocol: 'xin-20261013', selected: true, rewards: [] },
  { taskId: 86, param: 2, petId: 7, level: 5, protocol: 'xin-20261013', selected: true, rewards: [] },
  { taskId: 86, param: 3, petId: 4, level: 5, protocol: 'xin-20261013', selected: true, rewards: [] },
  ...['player_pets', 'player_tasks', 'commit'].map(failTable => ({ taskId: 86, param: 3, petId: 4, level: 5, protocol: 'xin-20261013', selected: true, rewards: [], failTable })),
  { taskId: 15, param: 0, petId: 56, level: 1, protocol: 'kose', selected: false, rewards: [] },
  // type=3 is only a response description; experience granting is not implemented.
  { taskId: 463, param: 0, petId: 161, level: 1, protocol: 'kose', selected: false, rewards: [3, 3000] },
])('task $taskId param $param collision fails without completion; explicit next-second retry succeeds once and reloads', async (testCase) => {
  const { taskId, param, petId, level, protocol, selected, rewards } = testCase;
  const failTable = 'failTable' in testCase ? testCase.failTable : undefined;
  jest.useFakeTimers();
  const second = 1700000000;
  jest.setSystemTime(second * 1000);
  const directory = mkdtempSync(join(tmpdir(), 'xin-quest-pet-'));
  const driver = new SQLiteDriver({ filename: join(directory, 'state.sqlite') });
  const driverSpy = jest.spyOn(DatabaseManager.Instance, 'Driver', 'get').mockReturnValue(driver);
  const uid = 73001;
  const packets: Buffer[] = [];
  const player: any = {
    Uid: uid, ClientProtocol: protocol, Data: { coins: 0 },
    EventBus: new GameEventBus(),
    _packetBuilder: new PacketBuilder('1'),
    _session: { Socket: { write: (packet: Buffer) => packets.push(Buffer.from(packet)) } },
    SendPacket: PlayerInstance.prototype.SendPacket,
  };
  const session = { Player: player };
  async function route(command: number, ...values: number[]): Promise<Buffer> {
    const Handler = Handlers.Get(command)!;
    expect(Handler).toBeDefined();
    const body = Buffer.alloc(values.length * 4);
    values.forEach((value, i) => body.writeUInt32BE(value, i * 4));
    const count = packets.length;
    await new Handler().Handle(session, {}, body);
    expect(packets).toHaveLength(count + 1);
    const packet = packets.at(-1)!;
    expect(packet.readUInt32BE(0)).toBe(packet.length);
    expect(packet.readUInt32BE(5)).toBe(command);
    expect(packet.readUInt32BE(9)).toBe(uid);
    return packet;
  }
  async function stored() {
    const pets = await driver.query<any>('SELECT pet_list FROM player_pets WHERE owner_id = ?', [uid]);
    const tasks = await driver.query<any>('SELECT task_list FROM player_tasks WHERE owner_id = ?', [uid]);
    return { pets: JSON.parse(pets[0].pet_list), tasks: JSON.parse(tasks[0].task_list) };
  }
  async function load() {
    player.PetManager = new PetManager(player);
    player.TaskManager = new TaskManager(player);
    await player.PetManager.Initialize();
    await player.TaskManager.Initialize();
  }
  try {
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG]) {
      ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
    }
    await ConfigRegistry.Instance.Initialize();
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG]) {
      expect(ConfigRegistry.Instance.IsLoaded(key)).toBe(true);
    }
    await driver.connect();
    await driver.execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY)');
    await driver.execute('INSERT INTO players VALUES (?)', [uid]);
    for (const table of ['player_pets', 'player_tasks']) {
      await driver.execute(new Migration012FixAllTables().upSQLite()
        .find(sql => sql.includes('CREATE TABLE IF NOT EXISTS ' + table))!);
    }
    await load();
    player.PetManager.PetData.PetList = [
      Object.assign(createDefaultPetInfo(uid, 1), { catchTime: second, nick: 'existing', isInBag: true }),
    ];
    await DatabaseHelper.Instance.SavePetData(player.PetManager.PetData);
    await jest.runOnlyPendingTimersAsync();
    jest.setSystemTime(second * 1000);
    expect((await route(2201, taskId)).readInt32BE(13)).toBe(0);
    const before = await stored();
    const failure = await route(2202, taskId, param);
    expect(failure.readInt32BE(13)).toBe(5000);
    // No successful/nonexistent pet identity is advertised.
    expect(Array.from({ length: 4 }, (_, i) => failure.readUInt32BE(17 + i * 4)))
      .toEqual([taskId, 0, 0, 0]);
    expect(failure.length).toBe(33);
    expect(player.TaskManager.GetTaskStatusArray()[taskId - 1]).toBe(1);
    expect(before.tasks[String(taskId)].status).toBe(1);
    expect(player.Data.coins).toBe(0);
    expect(player.PetManager.PetData.PetList).toEqual(before.pets);
    expect(await stored()).toEqual(before);
    // Advance time alone does not trigger a server retry or grant.
    jest.setSystemTime((second + 1) * 1000);
    expect(await stored()).toEqual(before);
    if (failTable) {
      if (failTable === 'commit') {
        await driver.execute('CREATE TABLE commit_guard (parent_id INTEGER REFERENCES players(user_id) DEFERRABLE INITIALLY DEFERRED)');
        await driver.execute('CREATE TRIGGER reject_starter AFTER UPDATE ON player_tasks BEGIN INSERT INTO commit_guard VALUES (-1); END');
      } else {
        await driver.execute(`CREATE TRIGGER reject_starter BEFORE UPDATE ON ${failTable} BEGIN SELECT RAISE(FAIL, 'starter-write-blocked'); END`);
      }
      const eventSpy = jest.spyOn(player.EventBus, 'Emit');
      try {
        expect((await route(2202, taskId, param)).readInt32BE(13)).toBe(5000);
        expect(await stored()).toEqual(before);
        expect(player.PetManager.PetData.PetList).toEqual(before.pets);
        expect(player.TaskManager.GetTaskStatusArray()[85]).toBe(1);
        expect(eventSpy).not.toHaveBeenCalled();
        await jest.runOnlyPendingTimersAsync();
        expect(await stored()).toEqual(before);
      } finally {
        await driver.execute('DROP TRIGGER reject_starter');
        eventSpy.mockRestore();
      }
      jest.setSystemTime((second + 1) * 1000);
    }
    let success: Buffer;
    if (selected && param === 3 && !failTable) {
      let entered!: () => void;
      let release!: () => void;
      const reached = new Promise<void>(resolve => { entered = resolve; });
      const gate = new Promise<void>(resolve => { release = resolve; });
      const execute = driver.execute.bind(driver);
      const pause = jest.spyOn(driver, 'execute').mockImplementation(async (sql, params) => {
        if (sql.startsWith('UPDATE player_tasks SET task_list = ? WHERE')) { entered(); await gate; }
        return execute(sql, params);
      });
      const eventFailure = jest.spyOn(player.EventBus, 'Emit').mockRejectedValue(new Error('notification failure'));
      try {
        const pending = route(2202, taskId, param);
        await reached;
        // A separate real grant cannot steal the staged identity while commit is pending.
        expect(await player.PetManager.GivePet(7, 5, second + 1)).toBe(false);
        expect(await player.PetManager.GivePet(7, 5, second + 2)).toBe(false);
        await expect(new PetService().givePet(uid, 7, 5, false)).rejects.toThrow('Pet grant pending atomic reward');
        const bagReplies = jest.spyOn(player, 'SendPacket').mockResolvedValue(undefined);
        try {
          await player.PetManager.HandlePetRelease(second);
          await player.PetManager.HandlePetTakeOut(second);
          await player.PetManager.HandlePetDefault(second);
          await player.PetManager.HandleMovePetToStorage(1);
          await player.PetManager.HandleMovePetToBag(1);
          expect(bagReplies.mock.calls).toHaveLength(5);
          expect(bagReplies.mock.calls.every(([packet]: any[]) => packet.getResult() === 5000)).toBe(true);
        } finally { bagReplies.mockRestore(); }
        expect(player.PetManager.PetData.PetList).toEqual(before.pets);
        release();
        success = await pending;
      } finally { release(); pause.mockRestore(); eventFailure.mockRestore(); }
    } else {
      success = await route(2202, taskId, param);
    }
    expect(success.readInt32BE(13)).toBe(0);
    expect(Array.from({ length: 4 + rewards.length }, (_, i) => success.readUInt32BE(17 + i * 4)))
      .toEqual([taskId, selected ? petId : 0, selected ? second + 1 : 0, rewards.length / 2, ...rewards]);
    expect(success.length).toBe(33 + rewards.length * 4);
    const saved = await stored();
    expect(saved.tasks[String(taskId)].status).toBe(3);
    expect(saved.pets).toHaveLength(2);
    expect(saved.pets.find((pet: any) => pet.catchTime === second)).toEqual(before.pets[0]);
    expect(saved.pets.find((pet: any) => pet.catchTime === second + 1))
      .toMatchObject({ petId, level, catchTime: second + 1 });
    await jest.runOnlyPendingTimersAsync();
    DatabaseHelper.Instance.RemoveCache(uid);
    await driver.disconnect();
    await driver.connect();
    await load();
    expect(player.TaskManager.GetTaskStatusArray()[taskId - 1]).toBe(3);
    expect(player.PetManager.PetData.PetList).toEqual(saved.pets);
    expect((await route(2202, taskId, param)).readInt32BE(13)).toBe(5003);
    expect(await stored()).toEqual(saved);
  } finally {
    await jest.runOnlyPendingTimersAsync();
    DatabaseHelper.Instance.RemoveCache(uid);
    await driver.disconnect();
    driverSpy.mockRestore();
    jest.useRealTimers();
    rmSync(directory, { recursive: true, force: true });
  }
});
