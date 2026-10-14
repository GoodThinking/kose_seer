import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import '../../../../DataBase/loaders/DataLoader';
import { DatabaseManager } from '../../../../DataBase/DatabaseManager';
import { DatabaseHelper } from '../../../../DataBase/DatabaseHelper';
import { Migration012FixAllTables } from '../../../../DataBase/migrations/scripts/012_fix_all_tables';
import { Migration006CreateItems } from '../../../../DataBase/migrations/scripts/006_create_items';
import { Config } from '../../../../shared/config/ServerConfig';
import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../../../shared/config/ConfigDefinitions';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { PetManager } from '../../Pet/PetManager';
import { ItemManager } from '../../Item/ItemManager';
import { BattleManager } from '../BattleManager';
import { PvpBattleManager } from '../PvpBattleManager';
import { PacketBuilder } from '../../../../shared/protocol/PacketBuilder';
import { HeadInfo } from '../../../../shared/protocol/HeadInfo';
import { CatchMonsterHandler } from '../../../Server/Packet/Recv/Battle/CatchMonsterHandler';
import { FightNpcMonsterHandler } from '../../../Server/Packet/Recv/Battle/FightNpcMonsterHandler';
import { ChangePetHandler } from '../../../Server/Packet/Recv/Battle/ChangePetHandler';
import { UseSkillHandler } from '../../../Server/Packet/Recv/Battle/UseSkillHandler';
import { EscapeFightHandler } from '../../../Server/Packet/Recv/Battle/EscapeFightHandler';
import { EnterMapHandler } from '../../../Server/Packet/Recv/Map/EnterMapHandler';
import { LeaveMapHandler } from '../../../Server/Packet/Recv/Map/LeaveMapHandler';
import { MapManager } from '../../Map/MapManager';
import { MapSpawnManager } from '../../Map/MapSpawnManager';
import { MapVisibilityService } from '../../Map/MapVisibilityService';
import { OnlineTracker } from '../../Player/OnlineTracker';
import { createDefaultPlayerInfo } from '../../../../shared/models/PlayerModel';
import { IClientSession } from '../../../Server/Packet/IHandler';
import { createDefaultPetInfo, IPetInfo } from '../../../../shared/models/PetModel';
import { BattleType } from '../../../../shared/models/BattleModel';
import { BattleEventType } from '../../Event/EventTypes';
import { GameConfig } from '../../../../shared/config/game/GameConfig';

describe('capture handler through real GivePet and temporary SQLite', () => {
  const uid = 190101, db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
  let directory: string, oldDb: typeof Config.Config.database, oldProtocol: typeof Config.Game.clientProtocol;
  let player: PlayerInstance;
  const intervals: ReturnType<typeof setInterval>[] = [];
  const packets: Buffer[] = [], events: any[] = [];
  const settle = () => new Promise(resolve => setTimeout(resolve, 160));
  const session = () => ({Player: player} as IClientSession);
  const catchPackets = () => packets.filter(p => p.readUInt32BE(5) === 2409);
  function pause() {
    let enter!: () => void, release!: () => void;
    const entered = new Promise<void>(resolve => {enter = resolve;});
    const released = new Promise<void>(resolve => {release = resolve;});
    return {entered, release, wait: async () => {enter(); await released;}};
  }
  async function action(handler: {Handle: (s: IClientSession, h: HeadInfo, b: Buffer) => Promise<void>}, value = 0) {
    const body = Buffer.alloc(4); body.writeUInt32BE(value);
    await handler.Handle(session(), new HeadInfo(), body);
  }
  async function request(id: number, body?: Buffer) {
    const data = body ?? Buffer.alloc(4);
    if (!body) data.writeUInt32BE(id);
    await new CatchMonsterHandler().Handle(session(), new HeadInfo(), data);
  }
  function makeNextEnemyCounterLethal() {
    const turnService = (player.BattleManager as any)._turnService;
    const executeEnemyTurn = turnService.ExecuteEnemyTurn.bind(turnService);
    jest.spyOn(turnService, 'ExecuteEnemyTurn').mockImplementationOnce((battle: any) => {
      const result = executeEnemyTurn(battle);
      battle.player.hp = 0;
      result.defenderRemainHp = 0;
      return result;
    });
  }
  async function stored() {
    const pets = await db.Query<{pet_list: string}>('SELECT pet_list FROM player_pets WHERE owner_id = ?', [uid]);
    const items = await db.Query<{item_list: string}>('SELECT item_list FROM player_items WHERE owner_id = ?', [uid]);
    return {pets: JSON.parse(pets[0].pet_list) as IPetInfo[], items: JSON.parse(items[0].item_list)};
  }
  async function seed(count = 1, capsule = 300005, quantity = 2) {
    player.PetManager.PetData.PetList = Array.from({length: count}, (_, i) =>
      Object.assign(createDefaultPetInfo(uid, 7), {catchTime: 1700000000 + i, hp: 500, maxHp: 500,
        level: 50, atk: 500, def: 500, speed: 500, isDefault: i === 0, skillArray: [10001]}));
    player.ItemManager.ItemData.ItemList = [{itemId: capsule, count: quantity, expireTime: 0}];
    await helper.SavePetData(player.PetManager.PetData);
    await helper.SaveItemData(player.ItemManager.ItemData);
    await settle();
    await player.BattleManager.HandleFightNpcMonster(0);
    await player.BattleManager.HandleReadyToFight();
    const battle = player.BattleManager.GetCurrentBattle()!;
    expect(battle).not.toBeNull();
    battle.enemy.hp = 1; // Controlled eligible target; keep the real catch probability engine.
    battle.player.hp = 321;
    packets.length = 0; events.length = 0;
    return battle;
  }
  async function reload() {
    await settle(); helper.RemoveCache(uid); await db.Shutdown(); await db.Initialize();
    player.PetManager = new PetManager(player); player.ItemManager = new ItemManager(player);
    await player.PetManager.Initialize(); await player.ItemManager.Initialize();
  }
  beforeAll(async () => {
    const interval = global.setInterval;
    const timerSpy = jest.spyOn(global, 'setInterval').mockImplementation(((...args: Parameters<typeof setInterval>) => {
      const timer = interval(...args); intervals.push(timer); return timer;
    }) as typeof setInterval);
    void PvpBattleManager.Instance;
    timerSpy.mockRestore();
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xin-capture-'));
    oldDb = Config.Config.database; oldProtocol = Config.Game.clientProtocol;
    Config.Config.database = {type: 'sqlite', path: path.join(directory, 'capture.sqlite')};
    Config.Game.clientProtocol = 'xin-20261013';
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
    await ConfigRegistry.Instance.Initialize();
    await db.Initialize();
    await db.Execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY)');
    await db.Execute('INSERT INTO players (user_id) VALUES (?)', [uid]);
    await db.Execute(new Migration012FixAllTables().upSQLite().find(s => s.startsWith('CREATE TABLE IF NOT EXISTS player_pets'))!);
    await db.Execute(new Migration006CreateItems().upSQLite()[0]);
    player = Object.create(PlayerInstance.prototype);
    Object.defineProperty(player, 'Uid', {value: uid});
    Object.assign(player, {Data: {nick: 'CaptureTest', mapID: 301},
      _session: {Socket: {write: (b: Buffer) => packets.push(Buffer.from(b))}}, _packetBuilder: new PacketBuilder(),
      EventBus: {Emit: async (event: any) => {events.push(event);}},
      MapSpawnManager: {GetMapOgres: () => [{petId: 8, originalPetId: 8, shiny: 0}], OnBattleEnd: () => {}},
    });
    player.PetManager = new PetManager(player); player.ItemManager = new ItemManager(player);
    player.BattleManager = new BattleManager(player);
    await player.PetManager.Initialize(); await player.ItemManager.Initialize();
  });
  beforeEach(() => {
    player.Data.mapID = 301;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(GameConfig, 'GetMapConfigById').mockReturnValue({ogres: [{petId: 8, slot: 0, level: 5}]} as any);
    jest.spyOn(GameConfig, 'GetMapOgreConfig').mockReturnValue({maps: {'301': {ogres: [{petId: 8, slot: 0, catchable: true}]}}} as any);
  });
  afterEach(async () => {await settle(); jest.restoreAllMocks();});
  afterAll(async () => {
    intervals.forEach(clearInterval);
    await settle(); helper.RemoveCache(uid); await db.Shutdown();
    Config.Config.database = oldDb; Config.Game.clientProtocol = oldProtocol;
    fs.rmSync(directory, {recursive: true, force: true});
  });

  test.each([1, 6])('successful capture with %i carried pets persists capsule, HP and unique response identity on reload', async count => {
    await seed(count);
    await Promise.all([request(300005), request(300005)]);
    const success = catchPackets().find(p => p.readInt32BE(13) === 0)!;
    expect(success.length).toBe(25);
    const catchTime = success.readUInt32BE(17), petId = success.readUInt32BE(21);
    expect(catchTime).toBeGreaterThan(1700000000); expect(petId).toBe(8);
    expect(catchPackets().filter(p => p.readInt32BE(13) !== 0)).toHaveLength(1);
    const over = packets.find(p => p.readUInt32BE(5) === 2506)!;
    expect(over.length).toBe(45); expect(over.readUInt32BE(17)).toBe(6); expect(over.readUInt32BE(21)).toBe(uid);
    const saved = await stored();
    expect(saved.items[0].count).toBe(1);
    expect(saved.pets).toHaveLength(count + 1);
    expect(saved.pets.find(p => p.catchTime === catchTime)).toMatchObject({petId: 8, level: 5, isInBag: count < 6});
    expect(saved.pets[0].hp).toBe(321);
    expect(events.filter(e => e.type === BattleEventType.CATCH_RESULT)).toMatchObject([{success: true}]);
    await request(300005); expect((await stored()).pets).toHaveLength(count + 1);
    await reload();
    expect(player.PetManager.GetPetByCatchTime(catchTime)).toMatchObject({petId, isInBag: count < 6});
    expect(player.ItemManager.GetItemCount(300005)).toBe(1);
  });

  test('failed roll consumes one capsule, counterattacks, and creates no pet', async () => {
    const battle = await seed(1, 300001);
    jest.spyOn(Math, 'random').mockReturnValue(0.99);
    await request(300001);
    expect(catchPackets()[0].subarray(17)).toEqual(Buffer.from('0000000000000008', 'hex'));
    expect(packets.some(p => p.readUInt32BE(5) === 2505)).toBe(true);
    expect(battle.isOver).toBe(false);
    await reload();
    expect(player.PetManager.PetData.PetList).toHaveLength(1);
    expect(player.ItemManager.GetItemCount(300001)).toBe(1);
  });

  test('failed catch lethal counter keeps battle open for a healthy replacement', async () => {
    const protocol = Config.Game.clientProtocol;
    Config.Game.clientProtocol = 'kose';
    try {
      const battle = await seed(2, 300001);
      const replacement = player.PetManager.GetPetsInBag().find(p => p.catchTime !== battle.player.catchTime)!;
      jest.spyOn(Math, 'random').mockReturnValue(0.99);
      makeNextEnemyCounterLethal();

      await request(300001);

      expect(packets.filter(p => [2409, 2505, 2506].includes(p.readUInt32BE(5))).map(p => p.readUInt32BE(5)))
        .toEqual([2409, 2505]);
      expect(catchPackets()[0].readInt32BE(13)).toBe(0);
      expect(battle.isOver).toBe(false);
      expect(player.BattleManager.GetCurrentBattle()).toBe(battle);
      expect(battle.player.hp).toBe(0);
      expect(player.PetManager.GetPetByCatchTime(replacement.catchTime)?.hp).toBeGreaterThan(0);
      expect(player.ItemManager.GetItemCount(300001)).toBe(1);
      expect((await stored()).items[0].count).toBe(1);

      await action(new ChangePetHandler(), replacement.catchTime);
      expect(packets.filter(p => [2409, 2505, 2407].includes(p.readUInt32BE(5))).map(p => p.readUInt32BE(5)))
        .toEqual([2409, 2505, 2407, 2505]);
      expect(battle.player.catchTime).toBe(replacement.catchTime);
      expect(packets.some(p => p.readUInt32BE(5) === 2506)).toBe(false);
    } finally {Config.Game.clientProtocol = protocol;}
  });

  test('failed catch lethal counter ends battle when no healthy replacement remains', async () => {
    const protocol = Config.Game.clientProtocol;
    Config.Game.clientProtocol = 'kose';
    try {
      const battle = await seed(1, 300001);
      jest.spyOn(Math, 'random').mockReturnValue(0.99);
      makeNextEnemyCounterLethal();

      await request(300001);

      expect(packets.filter(p => [2409, 2505, 2506].includes(p.readUInt32BE(5))).map(p => p.readUInt32BE(5)))
        .toEqual([2409, 2505, 2506]);
      expect(battle.isOver).toBe(true);
      expect(player.BattleManager.GetCurrentBattle()).toBeNull();
      expect(player.ItemManager.GetItemCount(300001)).toBe(1);
      expect((await stored()).items[0].count).toBe(1);
    } finally {Config.Game.clientProtocol = protocol;}
  });

  test('no capsule, unknown item and malformed requests do not mutate SQLite', async () => {
    await seed(1, 999999);
    const before = await stored();
    await request(300001); await request(999999); await request(0, Buffer.alloc(0)); await request(0);
    expect(catchPackets()).toHaveLength(4);
    expect(catchPackets().every(p => p.readInt32BE(13) === 5001)).toBe(true);
    expect(await stored()).toEqual(before); expect(events).toHaveLength(0);
  });

  test('PVP and map-disallowed catches reject before consuming capsule', async () => {
    const battle = await seed(); const before = await stored();
    battle.isPvp = true; await request(300005); battle.isPvp = false;
    battle.battleType = BattleType.BOSS; await request(300005); battle.battleType = BattleType.PVE;
    jest.mocked(GameConfig.GetMapOgreConfig).mockReturnValue({maps: {'301': {ogres: [{petId: 8, slot: 0, catchable: false}]}}} as any);
    await request(300005);
    expect(catchPackets().every(p => p.readInt32BE(13) === 5001)).toBe(true);
    expect(await stored()).toEqual(before);
  });

  test('GivePet failure cannot emit capture success or leave the battle marked over', async () => {
    const battle = await seed();
    jest.spyOn(player.PetManager, 'GivePet').mockResolvedValueOnce(false);
    await request(300005);
    expect(catchPackets()[0].readInt32BE(13)).toBe(5003);
    expect(battle.isOver).toBe(false);
    expect(packets.some(p => p.readUInt32BE(5) === 2506)).toBe(false);
    expect(events.filter(e => e.type === BattleEventType.CATCH_RESULT)).toMatchObject([{success: false}]);
    expect((await stored()).pets).toHaveLength(1);
  });

  test('capture awaiting item save excludes real new-battle, switch, skill and escape routes', async () => {
    const battle = await seed(2), gate = pause();
    const save = helper.SaveItemData.bind(helper);
    jest.spyOn(helper, 'SaveItemData').mockImplementationOnce(async data => {await save(data); await gate.wait();});
    const pending = request(300005);
    try {
      await gate.entered;
      await action(new FightNpcMonsterHandler());
      await action(new ChangePetHandler(), 1700000001);
      await action(new UseSkillHandler(), 10001);
      await action(new EscapeFightHandler());
      expect(player.BattleManager.GetCurrentBattle()).toBe(battle);
      expect(battle.player.catchTime).toBe(1700000000);
      expect(battle.player.hp).toBe(321);
      expect([2408, 2407, 2405, 2410].map(cmd => packets.find(p => p.readUInt32BE(5) === cmd)?.readInt32BE(13)))
        .toEqual([5001, 5001, 5001, 5001]);
    } finally {gate.release(); await pending;}
    expect((await stored()).pets).toHaveLength(3);
    expect((await stored()).items[0].count).toBe(1);
  });

  test.each(['SaveItemData', 'SyncBattlePetHP', 'GivePet', 'Emit'] as const)(
    'logout during %s stops stale continuation without null dereference', async stage => {
      await seed(); const gate = pause();
      if (stage === 'SaveItemData') {
        const original = helper.SaveItemData.bind(helper);
        jest.spyOn(helper, 'SaveItemData').mockImplementationOnce(async data => {await original(data); await gate.wait();});
      } else if (stage === 'SyncBattlePetHP') {
        const manager = player.BattleManager as any, original = manager.SyncBattlePetHP.bind(manager);
        jest.spyOn(manager, 'SyncBattlePetHP').mockImplementationOnce(async () => {await original(); await gate.wait();});
      } else if (stage === 'GivePet') {
        const original = player.PetManager.GivePet.bind(player.PetManager);
        jest.spyOn(player.PetManager, 'GivePet').mockImplementationOnce(async (...args) => {const result = await original(...args); await gate.wait(); return result;});
      } else {
        const original = player.EventBus.Emit.bind(player.EventBus);
        jest.spyOn(player.EventBus, 'Emit').mockImplementation(async event => {await original(event); if (event.type === BattleEventType.CATCH_RESULT) await gate.wait();});
      }
      const pending = request(300005);
      try {await gate.entered; await player.BattleManager.OnLogout();}
      finally {gate.release(); await pending;}
      expect(player.BattleManager.GetCurrentBattle()).toBeNull();
      expect(catchPackets()).toHaveLength(0);
      expect(packets.some(p => p.readUInt32BE(5) === 2506)).toBe(false);
      expect((await stored()).pets).toHaveLength(stage === 'GivePet' || stage === 'Emit' ? 2 : 1);
      expect((await stored()).items[0].count).toBe(1);
    });

  test('real GivePet rejects a second same-second capture without success or duplicate identity', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1800000000000);
    await seed(); await request(300005);
    await player.BattleManager.HandleFightNpcMonster(0);
    await player.BattleManager.HandleReadyToFight();
    const battle = player.BattleManager.GetCurrentBattle()!; battle.enemy.hp = 1;
    packets.length = 0; events.length = 0;
    await request(300005);
    expect(catchPackets()[0].readInt32BE(13)).toBe(5003);
    expect(battle.isOver).toBe(false);
    expect(events.filter(e => e.type === BattleEventType.CATCH_RESULT)).toMatchObject([{success: false}]);
    expect(packets.some(p => p.readUInt32BE(5) === 2506)).toBe(false);
    await reload();
    expect(player.PetManager.PetData.PetList.filter(p => p.catchTime === 1800000000)).toHaveLength(1);
    expect(player.PetManager.PetData.PetList).toHaveLength(2);
    expect(player.ItemManager.GetItemCount(300005)).toBe(0);
  });

  test('a skill already awaiting its acknowledgement excludes capture before consuming inventory', async () => {
    const battle = await seed(); battle.enemy.hp = battle.enemy.maxHp = 10000;
    const gate = pause(), send = player.SendPacket.bind(player);
    jest.spyOn(player, 'SendPacket').mockImplementationOnce(async packet => {await send(packet); await gate.wait();});
    const pending = action(new UseSkillHandler(), 10001);
    try {
      await gate.entered; await request(300005);
      expect(catchPackets()[0].readInt32BE(13)).toBe(5001);
      expect((await stored()).items[0].count).toBe(2);
    } finally {gate.release(); await pending;}
    expect(player.BattleManager.GetCurrentBattle()).toBe(battle);
  });

  test.each(['SaveItemData', 'GivePet', 'Emit', '2409', '2506', 'map update'] as const)(
    'replacement through the PVP initialization bridge during %s is never captured or cleaned by the old continuation', async stage => {
      const old = await seed(), gate = pause();
      const successor = {...old, player: {...old.player}, enemy: {...old.enemy, id: 9, petId: 9}, isOver: false};
      const cleanup = jest.spyOn(player.MapSpawnManager, 'OnBattleEnd');
      if (stage === 'SaveItemData') {
        const original = helper.SaveItemData.bind(helper);
        jest.spyOn(helper, 'SaveItemData').mockImplementationOnce(async data => {await original(data); await gate.wait();});
      } else if (stage === 'GivePet') {
        const original = player.PetManager.GivePet.bind(player.PetManager);
        jest.spyOn(player.PetManager, 'GivePet').mockImplementationOnce(async (...args) => {const result = await original(...args); await gate.wait(); return result;});
      } else if (stage === 'Emit') {
        const original = player.EventBus.Emit.bind(player.EventBus);
        jest.spyOn(player.EventBus, 'Emit').mockImplementation(async event => {await original(event); if (event.type === BattleEventType.CATCH_RESULT) await gate.wait();});
      } else if (stage === 'map update') {
        const manager = player.BattleManager as any, original = manager.SendOgreListUpdate.bind(manager);
        jest.spyOn(manager, 'SendOgreListUpdate').mockImplementationOnce(async () => {await original(); await gate.wait();});
      } else {
        const send = player.SendPacket.bind(player);
        jest.spyOn(player, 'SendPacket').mockImplementation(async packet => {
          await send(packet);
          if (packets[packets.length - 1].readUInt32BE(5) === Number(stage)) await gate.wait();
        });
      }
      const pending = request(300005);
      let packetCount = 0, cleanupCount = 0;
      try {
        await gate.entered;
        packetCount = packets.length; cleanupCount = cleanup.mock.calls.length;
        // Same callback used by BattlePvpService for the other participant, bypassing its public command gate.
        (player.BattleManager as any)._pvpService._initializeBattle(successor);
      } finally {gate.release(); await pending;}
      expect(player.BattleManager.GetCurrentBattle()).toBe(successor);
      expect(successor.isOver).toBe(false);
      expect(packets).toHaveLength(packetCount);
      expect(cleanup).toHaveBeenCalledTimes(cleanupCount);
      await reload();
      expect(player.PetManager.PetData.PetList.filter(p => p.petId === 9)).toHaveLength(0);
      expect(player.PetManager.PetData.PetList.filter(p => p.petId === 8)).toHaveLength(stage === 'SaveItemData' ? 0 : 1);
      expect(player.ItemManager.GetItemCount(300005)).toBe(1);
    });

  test.each(['different map', 'same-map transition hook'] as const)('%s invalidates pending capture before GivePet', async transition => {
    await seed(); const gate = pause(), save = helper.SaveItemData.bind(helper);
    jest.spyOn(helper, 'SaveItemData').mockImplementationOnce(async data => {await save(data); await gate.wait();});
    const pending = request(300005);
    try {
      await gate.entered;
      if (transition === 'different map') player.Data.mapID = 302;
      else player.BattleManager.InvalidatePendingCapture();
    } finally {gate.release(); await pending;}
    expect(catchPackets()).toHaveLength(0);
    expect((await stored()).pets).toHaveLength(1);
    expect((await stored()).items[0].count).toBe(1);
  });

  test('failed catch interrupted in its result event cannot counterattack a successor', async () => {
    const old = await seed(1, 300001), gate = pause();
    jest.spyOn(Math, 'random').mockReturnValue(0.99);
    const original = player.EventBus.Emit.bind(player.EventBus);
    jest.spyOn(player.EventBus, 'Emit').mockImplementation(async event => {await original(event); if (event.type === BattleEventType.CATCH_RESULT) await gate.wait();});
    const successor = {...old, player: {...old.player}, enemy: {...old.enemy}, isOver: false};
    const pending = request(300001);
    try {await gate.entered; (player.BattleManager as any)._pvpService._initializeBattle(successor);}
    finally {gate.release(); await pending;}
    expect(player.BattleManager.GetCurrentBattle()).toBe(successor);
    expect(successor.player.hp).toBe(321);
    expect(catchPackets()).toHaveLength(0);
    expect(packets.some(p => p.readUInt32BE(5) === 2505)).toBe(false);
  });

  test.each([
    ['SaveItemData', 'same-map reentry'], ['SaveItemData', 'leave and return'],
    ['GivePet', 'same-map reentry'], ['GivePet', 'leave and return'],
  ])('real map routes during %s: %s invalidates capture without clearing the new scene', async (stage, transition) => {
    const previousSpawn = player.MapSpawnManager, tracker = OnlineTracker.Instance;
    const order: string[] = [];
    // Only player-position persistence and other-player broadcasts are substitutes.
    // Pet/item persistence, handlers, MapManager, OnlineTracker and MapSpawnManager remain real.
    jest.spyOn(helper, 'SavePlayerData').mockImplementation(async () => {order.push('save position');});
    jest.spyOn(MapVisibilityService.prototype, 'BroadcastToMap').mockImplementation(async () => {order.push('broadcast'); return 0;});
    jest.spyOn(MapVisibilityService.prototype, 'RefreshMapPlayerLists').mockResolvedValue(0);
    const invalidate = player.BattleManager.InvalidatePendingCapture.bind(player.BattleManager);
    const invalidations = jest.spyOn(player.BattleManager, 'InvalidatePendingCapture').mockImplementation(() => {
      order.push('invalidate'); invalidate();
    });
    jest.mocked(GameConfig.GetMapConfigById).mockReturnValue({spawnCount: 1, randomCount: false,
      ogres: [{petId: 8, slot: 0, level: 5, shiny: 0, refreshConfig: {enabled: true}}]} as any);
    jest.spyOn(Math, 'random').mockReturnValue(0.05);
    Object.assign(player.Data, createDefaultPlayerInfo(uid, 'CaptureTest'), {mapID: 301});
    player.MapManager = new MapManager(player);
    player.MapSpawnManager = new MapSpawnManager(player);
    tracker.PlayerLogin(uid, session()); tracker.UpdatePlayerMap(uid, 301);
    try {
      const battle = await seed(), gate = pause();
      const cleanup = jest.spyOn(player.MapSpawnManager, 'OnBattleEnd');
      if (stage === 'SaveItemData') {
        const original = helper.SaveItemData.bind(helper);
        jest.spyOn(helper, 'SaveItemData').mockImplementationOnce(async data => {await original(data); await gate.wait();});
      } else {
        const original = player.PetManager.GivePet.bind(player.PetManager);
        jest.spyOn(player.PetManager, 'GivePet').mockImplementationOnce(async (...args) => {
          await gate.wait(); return original(...args);
        });
      }
      const pending = request(300005);
      let scene: unknown, snapshot: unknown;
      try {
        await gate.entered;
        if (transition === 'leave and return') {
          await new LeaveMapHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
          expect(invalidations).toHaveBeenCalledTimes(1);
          expect(order.slice(0, 2)).toEqual(['invalidate', 'broadcast']);
          expect(tracker.GetPlayerMap(uid)).toBe(0);
          expect(player.Data.mapID).toBe(301); // Existing leave behavior intentionally unchanged.
          expect((player.MapSpawnManager as any)._ogres).toEqual([]);
          order.length = 0;
        }
        const body = Buffer.alloc(16);
        body.writeUInt32BE(301, 4); body.writeUInt32BE(500, 8); body.writeUInt32BE(300, 12);
        await new EnterMapHandler().Handle(session(), new HeadInfo(), body);
        expect(order.slice(0, 2)).toEqual(['invalidate', 'save position']);
        expect(invalidations).toHaveBeenCalledTimes(transition === 'leave and return' ? 2 : 1);
        expect(tracker.GetPlayerMap(uid)).toBe(301);
        expect(player.Data.mapID).toBe(301);
        // Inspect the stored scene directly: GetMapOgres is not a passive getter.
        scene = (player.MapSpawnManager as any)._ogres;
        snapshot = JSON.parse(JSON.stringify(scene));
        expect(scene).toEqual([expect.objectContaining({petId: 8, slot: 0})]);
      } finally {gate.release(); await pending;}
      expect((player.MapSpawnManager as any)._ogres).toBe(scene);
      expect(scene).toEqual(snapshot);
      expect(cleanup).not.toHaveBeenCalled();
      expect(player.BattleManager.GetCurrentBattle()).toBe(battle);
      expect(battle.isOver).toBe(false);
      expect(catchPackets()).toHaveLength(0);
      expect(packets.some(p => p.readUInt32BE(5) === 2506)).toBe(false);
      expect(events.filter(e => e.type === BattleEventType.CATCH_RESULT)).toHaveLength(0);
      await reload();
      expect(player.PetManager.PetData.PetList).toHaveLength(stage === 'GivePet' ? 2 : 1);
      expect(player.ItemManager.GetItemCount(300005)).toBe(1);
    } finally {tracker.PlayerLogout(uid); player.MapSpawnManager = previousSpawn;}
  });
});
