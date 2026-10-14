import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import '../../../../DataBase/loaders/DataLoader';
import { DatabaseHelper } from '../../../../DataBase/DatabaseHelper';
import { DatabaseManager } from '../../../../DataBase/DatabaseManager';
import { Migration012FixAllTables } from '../../../../DataBase/migrations/scripts/012_fix_all_tables';
import { PetManager } from '../PetManager';
import { DataCache } from '../../../../DataBase/cache/DataCache';
import { GameEventBus } from '../../Event/GameEventBus';
import { PetEventType, PetObtainSource, IPetObtainedEvent } from '../../Event/EventTypes';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { Config } from '../../../../shared/config/ServerConfig';
import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../../../shared/config/ConfigDefinitions';
import { createDefaultPetInfo, IPetInfo } from '../../../../shared/models/PetModel';
import { PacketBuilder } from '../../../../shared/protocol/PacketBuilder';
import { HeadInfo } from '../../../../shared/protocol/HeadInfo';
import { Handlers } from '../../../../shared/decorators/Opcode';
import { IClientSession } from '../../../Server/Packet/IHandler';
import '../../../Server/Packet/Recv/Pet/GetPetListHandler';
import '../../../Server/Packet/Recv/Pet/GetPetInfoHandler';
import '../../../Server/Packet/Recv/Pet/PetReleaseHandler';
import '../../../Server/Packet/Recv/Pet/PetDefaultHandler';

// Independent client-order decoder: no server serializer or BufferWriter helpers.
class Input {
  offset = 0;
  constructor(readonly data: Buffer) {}
  bytes(n: number): Buffer {
    if (this.offset + n > this.data.length) throw new Error('truncated');
    const result = this.data.subarray(this.offset, this.offset + n);
    this.offset += n;
    return result;
  }
  u32(): number { return this.bytes(4).readUInt32BE(); }
  words(names: string): Record<string, number> {
    return Object.fromEntries(names.split(' ').map(name => [name, this.u32()]));
  }
  end(): void { expect(this.offset).toBe(this.data.length); }
}

function readPet(r: Input) {
  const id = r.u32();
  r.bytes(16);
  const stats = r.words('dv nature abilityType level exp lvExp nextLvExp hp maxHp attack defence sa sd speed addMaxHP addMoreMaxHP addAttack addDefence addSA addSD addSpeed evHp evAtk evDef evSA evSD evSpeed');
  const skillCount = r.u32();
  const skills = Array.from({length: 4}, () => r.words('id pp'));
  const caught = r.words('catchTime catchMap catchRect catchLevel');
  const effects = Array.from({length: r.bytes(2).readUInt16BE()}, () => ({
    itemId: r.u32(), status: r.bytes(1)[0], leftCount: r.bytes(1)[0],
    effectID: r.bytes(2).readUInt16BE(),
    args: Array.from({length: 8}, () => r.bytes(2).readUInt16LE()),
  }));
  const extra = r.words('peteffect skinID shiny freeForbidden boss ornament skillProton skillProtonCount');
  const protons = Array.from({length: extra.skillProtonCount}, () => r.words('skillID visualID'));
  const marks = r.words('abilityMark skillMark commonMark commonMarkActived');
  return {id, ...stats, skillCount, skills, ...caught, effects, ...extra, protons, ...marks};
}

describe('XIN pet lifecycle through registered handlers and isolated SQLite', () => {
  const uid = 190001;
  const db = DatabaseManager.Instance;
  const helper = DatabaseHelper.Instance;
  const packets: Buffer[] = [];
  const obtained: IPetObtainedEvent[] = [];
  let directory: string;
  let oldDatabase: typeof Config.Config.database;
  let oldProtocol: typeof Config.Game.clientProtocol;
  let player: PlayerInstance;
  let manager: PetManager;
  let session: IClientSession;
  const waitAutosave = () => new Promise(resolve => setTimeout(resolve, 150));
  const pet = (id: number, catchTime: number, bag: boolean, first = false): IPetInfo =>
    Object.assign(createDefaultPetInfo(uid, id), {catchTime, isInBag: bag, isDefault: first});

  async function request(cmd: number, ...values: number[]): Promise<Buffer> {
    const handler = Handlers.Get(cmd);
    expect(handler).toBeDefined();
    const body = Buffer.alloc(values.length * 4);
    values.forEach((value, i) => body.writeUInt32BE(value, i * 4));
    const count = packets.length;
    await new handler!().Handle(session, new HeadInfo(), body);
    expect(packets).toHaveLength(count + 1);
    const packet = packets[packets.length - 1];
    expect(packet.readUInt32BE(0)).toBe(packet.length);
    expect(packet.readUInt32BE(5)).toBe(cmd);
    return packet;
  }
  async function stored(): Promise<IPetInfo[]> {
    const rows = await db.Query<{pet_list: string}>('SELECT pet_list FROM player_pets WHERE owner_id = ?', [uid]);
    expect(rows).toHaveLength(1);
    return JSON.parse(rows[0].pet_list);
  }
  async function seed(pets: IPetInfo[]): Promise<void> {
    manager.PetData.PetList = pets;
    await helper.SavePetData(manager.PetData);
    await waitAutosave();
    packets.length = 0;
  }
  function list(packet: Buffer) {
    const r = new Input(packet.subarray(17));
    const result = Array.from({length: r.u32()}, () => r.words('id catchTime level skinID shiny'));
    r.end();
    return result;
  }

  beforeAll(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xin-pets-test-'));
    oldDatabase = Config.Config.database;
    oldProtocol = Config.Game.clientProtocol;
    Config.Config.database = {type: 'sqlite', path: path.join(directory, 'pets.sqlite')};
    Config.Game.clientProtocol = 'xin-20261013';
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG]) {
      ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
    }
    ConfigRegistry.Instance.Register(ConfigKeys.NATURES_CONFIG, ConfigPaths[ConfigKeys.NATURES_CONFIG], ConfigType.JSON);
    await ConfigRegistry.Instance.Initialize();
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG, ConfigKeys.NATURES_CONFIG]) {
      expect(ConfigRegistry.Instance.IsLoaded(key)).toBe(true);
    }
    await db.Initialize();
    await db.Execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY)');
    await db.Execute('INSERT INTO players (user_id) VALUES (?)', [uid]);
    // Execute only the repository pet table DDL; never the destructive migration runner.
    const ddl = new Migration012FixAllTables().upSQLite().find(sql =>
      sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'));
    expect(ddl).toBeDefined();
    await db.Execute(ddl!);
    player = Object.create(PlayerInstance.prototype);
    player.EventBus = new GameEventBus();
    player.EventBus.On<IPetObtainedEvent>(PetEventType.PET_OBTAINED, event => { obtained.push(event); });
    Object.defineProperty(player, 'Uid', {value: uid});
    Object.assign(player, {
      _session: {Socket: {write: (packet: Buffer) => packets.push(Buffer.from(packet))}},
      _packetBuilder: new PacketBuilder(),
    });
    manager = new PetManager(player);
    Object.defineProperty(player, 'PetManager', {get: () => manager});
    session = {Player: player} as IClientSession;
    await manager.Initialize();
  });

  afterAll(async () => {
    await waitAutosave();
    helper.RemoveCache(uid);
    await db.Shutdown();
    Config.Config.database = oldDatabase;
    Config.Game.clientProtocol = oldProtocol;
    fs.rmSync(directory, {recursive: true, force: true});
  });

  test('query → take out → select first → detail → reconnect and reload preserves data', async () => {
    const selected = Object.assign(pet(7, 1700000001, false), {
      level: 16, skinId: 42, shiny: 3, hp: 61, maxHp: 110,
      skillArray: [10002],
      effectList: [{itemId: 1, status: 2, leftCount: -1, effectID: 8, args: '256 513 0 65535 5 6 7 8'}],
    });
    const first = pet(8, 1700000002, true, true);
    await seed([selected, first]);
    expect(list(await request(2303))).toEqual([
      {id: 8, catchTime: first.catchTime, level: 1, skinID: 0, shiny: 0},
      {id: 7, catchTime: selected.catchTime, level: 16, skinID: 42, shiny: 3},
    ]);

    // Freeze the debounce timer: only the awaited explicit save can persist before the response.
    jest.useFakeTimers({doNotFake: ['nextTick', 'setImmediate']});
    let taken: Buffer;
    try {
      taken = await request(2304, selected.catchTime, 1);
      expect((await stored()).find(p => p.catchTime === selected.catchTime)?.isInBag).toBe(true);
      await jest.runOnlyPendingTimersAsync();
    } finally { jest.useRealTimers(); }
    const r = new Input(taken!.subarray(17));
    expect(r.words('homeEnergy firstPetTime flag')).toEqual({homeEnergy: 0, firstPetTime: first.catchTime, flag: 1});
    const decoded = readPet(r);
    r.end();
    expect(decoded).toMatchObject({
      id: 7, catchTime: selected.catchTime, hp: 61, maxHp: 110, skinID: 42, shiny: 3,
      effects: [{leftCount: 255, args: [256, 513, 0, 65535, 5, 6, 7, 8]}],
    });
    expect((await request(2308, selected.catchTime)).readInt32BE(13)).toBe(0);
    await waitAutosave(); // Existing first-selection path uses BaseData debounce.
    const before = await request(2301, selected.catchTime);
    expect(before.subarray(17)).toEqual(taken!.subarray(29));
    helper.RemoveCache(uid);
    await db.Shutdown();
    await db.Initialize();
    manager = new PetManager(player);
    await manager.Initialize();
    const loaded = manager.PetData.GetPetByCatchTime(selected.catchTime)!;
    expect(loaded).toMatchObject({isInBag: true, isDefault: true, skinId: 42, shiny: 3});
    expect(loaded.effectList).toEqual(selected.effectList);
    expect((await request(2301, selected.catchTime))).toEqual(before);
    expect(list(await request(2303))[0].catchTime).toBe(selected.catchTime);

    const released = await request(2304, selected.catchTime, 0);
    const releaseReader = new Input(released.subarray(17));
    expect(releaseReader.words('homeEnergy firstPetTime flag')).toEqual({homeEnergy: 0, firstPetTime: first.catchTime, flag: 0});
    releaseReader.end();
    expect((await stored()).find(p => p.catchTime === selected.catchTime)?.isInBag).toBe(false);
  });

  test('full bag and unknown catchTime reject without changing persisted membership', async () => {
    const pets = Array.from({length: 6}, (_, i) => pet(7, 1700000100 + i, true, i === 0));
    pets.push(pet(8, 1700000200, false));
    await seed(pets);
    const before = await stored();
    for (const time of [1700000200, 1700000999]) {
      expect((await request(2304, time, 1)).readInt32BE(13)).toBe(5001);
      expect(await stored()).toEqual(before);
    }
    // Confirming an already-carried pet is valid even when the bag is full.
    expect((await request(2304, pets[0].catchTime, 1)).readInt32BE(13)).toBe(0);
    expect(manager.GetPetsInBag()).toHaveLength(6);
  });

  test('empty all-pet list ends immediately after the count', async () => {
    await seed([]);
    expect(list(await request(2303))).toEqual([]);
  });

  test('GivePet saves bag and overflow storage before debounce, then reloads catch cosmetics and skills', async () => {
    await seed(Array.from({length: 5}, (_, i) => pet(8, 1700000300 + i, true, i === 0)));
    // Player statistics are outside this pet-table integration; provide their existing cache target.
    DataCache.Instance.Set('player', uid, {petAllNum: 5, petMaxLev: 1});
    obtained.length = 0;
    jest.useFakeTimers({doNotFake: ['nextTick', 'setImmediate']});
    try {
      expect(await manager.GivePet(7, 9, 1700000400, PetObtainSource.CATCH)).toBe(true);
      expect(await manager.GivePet(7, 9, 1700000401, PetObtainSource.CATCH)).toBe(true);
      const rows = await stored();
      expect(rows).toHaveLength(7);
      expect(rows.find(p => p.catchTime === 1700000400)).toMatchObject({
        petId: 7, level: 9, obtainLevel: 9, isInBag: true, shiny: 0,
        skillArray: [10006, 20004, 10007, 20005],
      });
      expect(rows.find(p => p.catchTime === 1700000401)?.isInBag).toBe(false);
      expect(obtained.map(e => [e.catchTime, e.source])).toEqual([
        [1700000400, PetObtainSource.CATCH], [1700000401, PetObtainSource.CATCH],
      ]);
      await jest.runOnlyPendingTimersAsync();
    } finally { jest.useRealTimers(); }
    helper.RemoveCache(uid);
    await db.Shutdown();
    await db.Initialize();
    manager = new PetManager(player);
    await manager.Initialize();
    expect(manager.PetData.GetPetCount()).toEqual({total: 7, inBag: 6});
    const r = new Input((await request(2301, 1700000401)).subarray(17));
    const detail = readPet(r);
    r.end();
    expect(detail).toMatchObject({id: 7, catchTime: 1700000401, level: 9, skinID: 0, shiny: 0, skillCount: 4});
    expect(detail.skills.map(s => s.id)).toEqual([10006, 20004, 10007, 20005]);
    expect(list(await request(2303))).toHaveLength(7);
  });

  test('same-second and concurrent duplicate identities fail without replacing existing pets or emitting events', async () => {
    await seed([]);
    DataCache.Instance.Set('player', uid, {petAllNum: 0, petMaxLev: 0});
    obtained.length = 0;
    jest.useFakeTimers({doNotFake: ['nextTick', 'setImmediate']});
    jest.setSystemTime(1700000500000);
    try {
      expect(await manager.GivePet(7, 9)).toBe(true);
      const before = await stored();
      expect(await manager.GivePet(8, 1)).toBe(false);
      expect(await manager.GivePet(8, 1, 1700000500)).toBe(false);
      expect(await stored()).toEqual(before);
      expect(obtained).toHaveLength(1);
      const results = await Promise.all([
        manager.GivePet(7, 9, 1700000501), manager.GivePet(8, 1, 1700000501),
      ]);
      expect(results.filter(Boolean)).toHaveLength(1);
      expect((await stored()).filter(p => p.catchTime === 1700000501)).toHaveLength(1);
      expect(obtained).toHaveLength(2);
      await jest.runOnlyPendingTimersAsync();
    } finally { jest.useRealTimers(); }
  });

  test('unknown species and invalid explicit identities leave persisted pets untouched', async () => {
    await seed([pet(7, 1700000600, true, true)]);
    obtained.length = 0;
    const before = await stored();
    expect(await manager.GivePet(0xFFFFFFFF, 1, 1700000601)).toBe(false);
    for (const identity of [0, -1, 1.5, NaN, Infinity, 0x100000000]) {
      expect(await manager.GivePet(7, 1, identity)).toBe(false);
    }
    expect(await stored()).toEqual(before);
    expect(manager.PetData.PetList).toEqual(before);
    expect(obtained).toHaveLength(0);
  });

  test('concurrent distinct grants use the final bag capacity', async () => {
    await seed(Array.from({length: 5}, (_, i) => pet(7, 1700000700 + i, true, i === 0)));
    DataCache.Instance.Set('player', uid, {petAllNum: 5, petMaxLev: 1});
    const results = await Promise.all([
      manager.GivePet(7, 9, 1700000800), manager.GivePet(7, 9, 1700000801),
    ]);
    expect(results).toEqual([true, true]);
    expect((await stored()).filter(p => p.isInBag)).toHaveLength(6);
    expect(manager.PetData.GetPetCount()).toEqual({total: 7, inBag: 6});
  });

  test('first acquisition, empty-bag take-out and full-bag rotation keep one carried default across reload', async () => {
    await seed([]);
    DataCache.Instance.Set('player', uid, {petAllNum: 0, petMaxLev: 0});
    async function checkDefault(expected: number | null) {
      const rows = await stored();
      const defaults = rows.filter(p => p.isDefault);
      expect(defaults.map(p => p.catchTime)).toEqual(expected === null ? [] : [expected]);
      expect(defaults.every(p => p.isInBag)).toBe(true);
      expect(manager.GetDefaultPet()?.catchTime ?? null).toBe(expected);
      // LoginManager builds its pet list from this exact sorted manager data source.
      expect(manager.GetPetsInBag()[0]?.catchTime ?? null).toBe(expected);
    }
    expect(await manager.GivePet(7, 1, 1700000900)).toBe(true);
    await checkDefault(1700000900);
    const putAway = await request(2304, 1700000900, 0);
    expect(putAway.readUInt32BE(21)).toBe(0);
    await checkDefault(null);
    const takeBack = await request(2304, 1700000900, 1);
    expect(takeBack.readUInt32BE(21)).toBe(1700000900);
    await checkDefault(1700000900);
    for (let i = 1; i <= 6; i++) {
      expect(await manager.GivePet(7, 1, 1700000900 + i)).toBe(true);
      await checkDefault(1700000900);
    }
    expect((await request(2304, 1700000906, 1)).readInt32BE(13)).toBe(5001);
    await checkDefault(1700000900);
    await request(2304, 1700000900, 0);
    await checkDefault(1700000901);
    await request(2304, 1700000906, 1);
    await checkDefault(1700000901);
    await request(2308, 1700000906);
    await waitAutosave();
    await checkDefault(1700000906);
    await request(2308, 1700000900); // Stored pet cannot become default.
    await checkDefault(1700000906);
    helper.RemoveCache(uid);
    await db.Shutdown();
    await db.Initialize();
    manager = new PetManager(player);
    await manager.Initialize();
    await checkDefault(1700000906);
    // Storing every carried pet must clear the default when the bag becomes empty.
    for (const p of [...manager.GetPetsInBag()]) await request(2304, p.catchTime, 0);
    await checkDefault(null);
  });

  test('GivePet rejects non-integral and out-of-range levels before mutation; accepts current 1..100 bounds', async () => {
    await seed([]);
    DataCache.Instance.Set('player', uid, {petAllNum: 0, petMaxLev: 0});
    obtained.length = 0;
    for (const level of [NaN, Infinity, -Infinity, -1, 0, 1.5, 101, 0xFFFFFFFF]) {
      expect(await manager.GivePet(7, level, 1700001000)).toBe(false);
      expect(await stored()).toEqual([]);
      expect(manager.PetData.PetList).toEqual([]);
      expect(obtained).toEqual([]);
    }
    expect(await manager.GivePet(7, 1, 1700001001)).toBe(true);
    expect(await manager.GivePet(7, 100, 1700001002)).toBe(true);
    expect((await stored()).map(p => p.level)).toEqual([1, 100]);
  });
});
