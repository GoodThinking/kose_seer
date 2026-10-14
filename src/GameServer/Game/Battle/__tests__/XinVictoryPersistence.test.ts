import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import '../../../../DataBase/loaders/DataLoader';
import { DatabaseManager } from '../../../../DataBase/DatabaseManager';
import { DatabaseHelper } from '../../../../DataBase/DatabaseHelper';
import { PlayerRepository } from '../../../../DataBase/repositories/Player/PlayerRepository';
import { Migration012FixAllTables } from '../../../../DataBase/migrations/scripts/012_fix_all_tables';
import { Migration006CreateItems } from '../../../../DataBase/migrations/scripts/006_create_items';
import { Config } from '../../../../shared/config/ServerConfig';
import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../../../shared/config/ConfigDefinitions';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { PlayerData } from '../../../../DataBase/models/PlayerData';
import { PetManager } from '../../Pet/PetManager';
import { PetCalculator } from '../../Pet/PetCalculator';
import { ItemManager } from '../../Item/ItemManager';
import { BattleManager } from '../BattleManager';
import { PvpBattleManager } from '../PvpBattleManager';
import { PacketBuilder } from '../../../../shared/protocol/PacketBuilder';
import { HeadInfo } from '../../../../shared/protocol/HeadInfo';
import { FightNpcMonsterHandler } from '../../../Server/Packet/Recv/Battle/FightNpcMonsterHandler';
import { ReadyToFightHandler } from '../../../Server/Packet/Recv/Battle/ReadyToFightHandler';
import { UseSkillHandler } from '../../../Server/Packet/Recv/Battle/UseSkillHandler';
import { EscapeFightHandler } from '../../../Server/Packet/Recv/Battle/EscapeFightHandler';
import { LeaveMapHandler } from '../../../Server/Packet/Recv/Map/LeaveMapHandler';
import { MapManager } from '../../Map/MapManager';
import { MapSpawnManager } from '../../Map/MapSpawnManager';
import { MapVisibilityService } from '../../Map/MapVisibilityService';
import { OnlineTracker } from '../../Player/OnlineTracker';
import { IClientSession } from '../../../Server/Packet/IHandler';
import { createDefaultPetInfo, IPetInfo } from '../../../../shared/models/PetModel';
import { createDefaultPlayerInfo } from '../../../../shared/models/PlayerModel';
import { BattleEventType, ItemEventType } from '../../Event/EventTypes';
import { GameEventBus } from '../../Event/GameEventBus';
import { GameConfig } from '../../../../shared/config/game/GameConfig';

describe('ordinary PVE victory through real reward managers and temporary SQLite', () => {
  const uid = 190401, catchTime = 1700000401;
  const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
  let directory: string, oldDb: typeof Config.Config.database, oldProtocol: typeof Config.Game.clientProtocol;
  let player: PlayerInstance;
  const packets: Buffer[] = [], events: any[] = [], intervals: ReturnType<typeof setInterval>[] = [];
  const settle = (ms = 180) => new Promise(resolve => setTimeout(resolve, ms));
  const session = () => ({Player: player} as IClientSession);
  const commandPackets = (cmd: number) => packets.filter(p => p.readUInt32BE(5) === cmd);
  async function skill() {
    const body = Buffer.alloc(4); body.writeUInt32BE(10001);
    await new UseSkillHandler().Handle(session(), new HeadInfo(), body);
  }
  async function stored() {
    const [p] = await db.Query<{pet_list: string}>('SELECT pet_list FROM player_pets WHERE owner_id = ?', [uid]);
    const [i] = await db.Query<{item_list: string}>('SELECT item_list FROM player_items WHERE owner_id = ?', [uid]);
    const [money] = await db.Query<{coins: number}>('SELECT coins FROM players WHERE user_id = ?', [uid]);
    return {pets: JSON.parse(p.pet_list) as IPetInfo[], items: JSON.parse(i.item_list), coins: money.coins};
  }
  async function seed(levelUp = false) {
    player.BattleManager = new BattleManager(player);
    player.Data.coins = 100;
    await db.Execute('UPDATE players SET coins = 100 WHERE user_id = ?', [uid]);
    const exp = levelUp ? PetCalculator.CalculateExpForLevel(6, 7) - 20 : 0;
    player.PetManager.PetData.PetList = [Object.assign(createDefaultPetInfo(uid, 7), {
      catchTime, level: 5, exp, hp: 500, maxHp: 500, atk: 500, def: 500, speed: 500,
      isDefault: true, skillArray: [10001],
    })];
    player.ItemManager.ItemData.ItemList = [];
    await helper.SavePetData(player.PetManager.PetData); await helper.SaveItemData(player.ItemManager.ItemData);
    await settle();
    await new FightNpcMonsterHandler().Handle(session(), new HeadInfo(), Buffer.alloc(4));
    await new ReadyToFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
    const battle = player.BattleManager.GetCurrentBattle()!;
    battle.enemy.hp = 1; battle.player.hp = 321;
    packets.length = 0; events.length = 0;
    return battle;
  }
  async function reload() {
    await settle(); helper.RemoveCache(uid); await db.Shutdown(); await db.Initialize();
    player.PetManager = new PetManager(player); player.ItemManager = new ItemManager(player);
    await player.PetManager.Initialize(); await player.ItemManager.Initialize();
    // Currency's source of truth is the players row updated by the actual PlayerRepository.
    player.Data.coins = (await stored()).coins;
  }
  beforeAll(async () => {
    const interval = global.setInterval;
    const spy = jest.spyOn(global, 'setInterval').mockImplementation(((...args: Parameters<typeof setInterval>) => {
      const timer = interval(...args); intervals.push(timer); return timer;
    }) as typeof setInterval);
    void PvpBattleManager.Instance; spy.mockRestore();
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xin-victory-'));
    oldDb = Config.Config.database; oldProtocol = Config.Game.clientProtocol;
    Config.Config.database = {type: 'sqlite', path: path.join(directory, 'victory.sqlite')};
    Config.Game.clientProtocol = 'xin-20261013';
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG, ConfigKeys.ITEM_CONFIG]) {
      ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
    }
    ConfigRegistry.Instance.Register(ConfigKeys.NATURES_CONFIG, ConfigPaths[ConfigKeys.NATURES_CONFIG], ConfigType.JSON);
    await ConfigRegistry.Instance.Initialize(); await db.Initialize();
    // Minimal real currency columns; pets/items use the repository's full SQLite DDL.
    await db.Execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY, coins INTEGER NOT NULL, energy INTEGER NOT NULL)');
    await db.Execute('INSERT INTO players VALUES (?, 100, 0)', [uid]);
    await db.Execute(new Migration012FixAllTables().upSQLite().find(s => s.startsWith('CREATE TABLE IF NOT EXISTS player_pets'))!);
    await db.Execute(new Migration006CreateItems().upSQLite()[0]);
    player = Object.create(PlayerInstance.prototype);
    Object.defineProperty(player, 'Uid', {value: uid});
    Object.assign(player, {Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'VictoryTest'), {mapID: 301, coins: 100})),
      _playerRepo: new PlayerRepository(), EventBus: new GameEventBus(),
      _session: {Socket: {write: (b: Buffer) => packets.push(Buffer.from(b))}}, _packetBuilder: new PacketBuilder(),
      MapSpawnManager: {GetMapOgres: () => [{petId: 8, originalPetId: 8, shiny: 0}], OnBattleEnd: () => {}},
    });
    for (const type of [...Object.values(BattleEventType), ItemEventType.ITEM_GAINED]) {
      player.EventBus.On(type, async event => {events.push(event);});
    }
    player.PetManager = new PetManager(player); player.ItemManager = new ItemManager(player);
    await player.PetManager.Initialize(); await player.ItemManager.Initialize();
  });
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const ogre = {petId: 8, slot: 0, level: 5, expReward: 50, expMultiplier: 1, refreshConfig: {enabled: true},
      dropItems: [{itemId: 300001, dropRate: 1, minCount: 2, maxCount: 2}]};
    jest.spyOn(GameConfig, 'GetMapConfigById').mockReturnValue({ogres: [ogre]} as any);
    jest.spyOn(GameConfig, 'GetMapOgreConfig').mockReturnValue({maps: {'301': {ogres: [ogre]}}} as any);
  });
  afterEach(async () => {await settle(1300); jest.restoreAllMocks();});
  afterAll(async () => {
    player.Data.cleanup();
    intervals.forEach(clearInterval); await settle(); helper.RemoveCache(uid); await db.Shutdown();
    Config.Config.database = oldDb; Config.Game.clientProtocol = oldProtocol;
    fs.rmSync(directory, {recursive: true, force: true});
  });

  test.each(['kose', 'xin-20261013'] as const)('R8 normal %s escape preserves packets, HP persistence and no rewards', async protocol => {
    Config.Game.clientProtocol = protocol; player.Data.mapID = 301;
    try {
      await seed(); await new EscapeFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
      expect(packets.map(p => p.readUInt32BE(5))).toEqual([2410, 2506]);
      expect(commandPackets(2410)[0].subarray(17).toString('hex')).toBe('00000001');
      expect(commandPackets(2506)[0].subarray(17).toString('hex')).toBe('00000001000000000000000000000000000000000000000000000000');
      expect(events.filter(e => e.type === BattleEventType.ESCAPE_RESULT)).toMatchObject([{success: true, reason: 'player_escape'}]);
      expect(events.filter(e => e.type === BattleEventType.BATTLE_END)).toHaveLength(0);
      expect(player.BattleManager.GetCurrentBattle()).toBeNull();
      await reload();
      expect((await stored()).pets[0]).toMatchObject({hp: 321, exp: 0, level: 5, evSpAtk: 0, evSpeed: 0});
      expect((await stored()).coins).toBe(100); expect((await stored()).items).toEqual([]);
      await settle(1250); expect(commandPackets(2202)).toHaveLength(0);
    } finally {Config.Game.clientProtocol = 'xin-20261013';}
  });

  test.each(
    ['HP sync', 'escape packet', 'escape event', 'fight-over packet'].flatMap(stage =>
      ['leave', 'logout', 'new battle'].map(transition => [stage, transition]))
  )('R8 escape at %s stops its continuation after %s', async (stage, transition) => {
    player.Data.mapID = 301;
    const old = await seed(), originalSpawn = player.MapSpawnManager;
    let entered!: () => void, release!: () => void;
    const ready = new Promise<void>(r => {entered = r;}), gate = new Promise<void>(r => {release = r;});
    const stop = async () => {entered(); await gate;};
    if (stage === 'HP sync') {
      const sync = (player.BattleManager as any).SyncBattlePetHP.bind(player.BattleManager);
      jest.spyOn(player.BattleManager as any, 'SyncBattlePetHP').mockImplementation(async () => {await sync(); await stop();});
    } else if (stage === 'escape event') {
      // Actual registered callback: exercise EventBus.Dispatch's real asynchronous wait.
      player.EventBus.Once(BattleEventType.ESCAPE_RESULT, stop);
    } else {
      const send = player.SendPacket.bind(player), cmd = stage === 'escape packet' ? 2410 : 2506;
      jest.spyOn(player, 'SendPacket').mockImplementation(async packet => {
        await send(packet); if (packets[packets.length - 1].readUInt32BE(5) === cmd) await stop();
      });
    }
    const pending = new EscapeFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
    let successor: ReturnType<BattleManager['GetCurrentBattle']> = null, snapshot = '';
    try {
      await ready;
      if (transition === 'leave') {
        player.MapManager = new MapManager(player); player.MapSpawnManager = new MapSpawnManager(player);
        OnlineTracker.Instance.PlayerLogin(uid, session()); OnlineTracker.Instance.UpdatePlayerMap(uid, 301);
        jest.spyOn(MapVisibilityService.prototype, 'BroadcastToMap').mockResolvedValue(0);
        jest.spyOn(MapVisibilityService.prototype, 'RefreshMapPlayerLists').mockResolvedValue(0);
        await new LeaveMapHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
        expect(OnlineTracker.Instance.GetPlayerMap(uid)).toBe(0);
      } else if (transition === 'logout') {
        await player.BattleManager.OnLogout();
      } else {
        await new FightNpcMonsterHandler().Handle(session(), new HeadInfo(), Buffer.alloc(4));
        await new ReadyToFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
        successor = player.BattleManager.GetCurrentBattle()!;
        expect(successor).not.toBe(old); snapshot = JSON.stringify(successor);
      }
      const currentAfterTransition = player.BattleManager.GetCurrentBattle();
      const hpRecords = Array.from((player.BattleManager as any)._battlePetHPMap.entries());
      const count2410 = commandPackets(2410).length, count2506 = commandPackets(2506).length;
      const escapeEvents = events.filter(e => e.type === BattleEventType.ESCAPE_RESULT).length;
      release(); await pending;
      expect(player.BattleManager.GetCurrentBattle()).toBe(currentAfterTransition);
      if (successor) expect(JSON.stringify(successor)).toBe(snapshot);
      expect(Array.from((player.BattleManager as any)._battlePetHPMap.entries())).toEqual(hpRecords);
      expect(commandPackets(2410)).toHaveLength(count2410); expect(commandPackets(2506)).toHaveLength(count2506);
      expect(events.filter(e => e.type === BattleEventType.ESCAPE_RESULT)).toHaveLength(escapeEvents);
      expect(events.filter(e => e.type === BattleEventType.BATTLE_END)).toHaveLength(0);
      await settle(1250);
      expect(commandPackets(2202)).toHaveLength(0);
      expect((await stored()).pets[0]).toMatchObject({hp: 321, exp: 0});
      expect((await stored()).coins).toBe(100); expect((await stored()).items).toEqual([]);
    } finally {
      release(); await pending; OnlineTracker.Instance.PlayerLogout(uid);
      player.MapSpawnManager = originalSpawn; player.Data.mapID = 301;
    }
  });

  test.each([
    ...(['kose', 'xin-20261013'] as const).flatMap(protocol =>
      ['escape packet', 'escape event', 'fight-over packet'].map(stage => ({protocol, stage, transition: 'none'}))),
    ...['leave', 'logout', 'new battle'].map(transition => ({protocol: 'xin-20261013' as const, stage: 'escape event', transition})),
  ])('R9 duplicate escape $protocol at $stage then $transition', async ({protocol, stage, transition}) => {
    Config.Game.clientProtocol = protocol; player.Data.mapID = 301;
    const old = await seed(), originalSpawn = player.MapSpawnManager;
    const cleaned: unknown[] = [], cleanup = (player.BattleManager as any).CleanupBattle.bind(player.BattleManager);
    jest.spyOn(player.BattleManager as any, 'CleanupBattle').mockImplementation(() => {
      cleaned.push(player.BattleManager.GetCurrentBattle()); cleanup();
    });
    let entered!: () => void, release!: () => void;
    const ready = new Promise<void>(r => {entered = r;}), gate = new Promise<void>(r => {release = r;});
    const stop = async () => {entered(); await gate;};
    if (stage === 'escape event') player.EventBus.Once(BattleEventType.ESCAPE_RESULT, stop);
    else {
      const send = player.SendPacket.bind(player), cmd = stage === 'escape packet' ? 2410 : 2506;
      let paused = false;
      jest.spyOn(player, 'SendPacket').mockImplementation(async packet => {
        await send(packet);
        if (!paused && packets[packets.length - 1].readUInt32BE(5) === cmd) {paused = true; await stop();}
      });
    }
    const escape = () => new EscapeFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
    const first = escape();
    try {
      await ready; await escape(); // Same real Handler while the original escape still owns its battle.
      if (transition === 'leave') {
        player.MapManager = new MapManager(player); player.MapSpawnManager = new MapSpawnManager(player);
        OnlineTracker.Instance.PlayerLogin(uid, session()); OnlineTracker.Instance.UpdatePlayerMap(uid, 301);
        jest.spyOn(MapVisibilityService.prototype, 'BroadcastToMap').mockResolvedValue(0);
        jest.spyOn(MapVisibilityService.prototype, 'RefreshMapPlayerLists').mockResolvedValue(0);
        await new LeaveMapHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
      } else if (transition === 'logout') await player.BattleManager.OnLogout();
      else if (transition === 'new battle') {
        await new FightNpcMonsterHandler().Handle(session(), new HeadInfo(), Buffer.alloc(4));
        await new ReadyToFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
        const successor = player.BattleManager.GetCurrentBattle()!;
        expect(successor).not.toBe(old);
        await escape(); // Must finish before old request's gate is released: no session-wide escape lock.
        expect(player.BattleManager.GetCurrentBattle()).toBeNull();
        expect(cleaned[cleaned.length - 1]).toBe(successor);
      }
      const count2506 = commandPackets(2506).length, cleanupCount = cleaned.length;
      const currentAfterTransition = player.BattleManager.GetCurrentBattle();
      release(); await first;
      if (transition === 'none') {
        expect({
          success2410: commandPackets(2410).filter(p => p.readInt32BE(13) === 0).length,
          rejected2410: commandPackets(2410).filter(p => p.readInt32BE(13) === 5001).length,
          fightOver2506: commandPackets(2506).length,
          escapeEvents: events.filter(e => e.type === BattleEventType.ESCAPE_RESULT).length,
          cleanups: cleaned.length,
        }).toEqual({success2410: 1, rejected2410: 1, fightOver2506: 1, escapeEvents: 1, cleanups: 1});
      }
      expect(commandPackets(2410).filter(p => p.readInt32BE(13) === 0)).toHaveLength(transition === 'new battle' ? 2 : 1);
      expect(commandPackets(2410).filter(p => p.readInt32BE(13) === 5001)).toHaveLength(1);
      if (transition === 'none') {
        expect(commandPackets(2506)).toHaveLength(1);
        expect(events.filter(e => e.type === BattleEventType.ESCAPE_RESULT)).toHaveLength(1);
        expect(cleaned).toEqual([old]); expect(player.BattleManager.GetCurrentBattle()).toBeNull();
      } else {
        expect(commandPackets(2506)).toHaveLength(count2506); expect(cleaned).toHaveLength(cleanupCount);
        expect(player.BattleManager.GetCurrentBattle()).toBe(currentAfterTransition);
        expect(events.filter(e => e.type === BattleEventType.ESCAPE_RESULT)).toHaveLength(transition === 'new battle' ? 2 : 1);
      }
      expect((player.BattleManager as any)._battleActionsInProgress).toBe(0);
      await settle(1250); expect(commandPackets(2202)).toHaveLength(0);
      expect(events.filter(e => e.type === BattleEventType.BATTLE_END)).toHaveLength(0);
      expect((await stored()).pets[0]).toMatchObject({hp: 321, exp: 0});
      expect((await stored()).coins).toBe(100); expect((await stored()).items).toEqual([]);
    } finally {
      release(); await first; Config.Game.clientProtocol = 'xin-20261013';
      OnlineTracker.Instance.PlayerLogout(uid); player.MapSpawnManager = originalSpawn; player.Data.mapID = 301;
    }
  });

  test.each([false, true])('victory persists exp/level/HP, coins and configured drop (levelUp=%s)', async levelUp => {
    await seed(levelUp); await skill();
    const pet = player.PetManager.GetPetByCatchTime(catchTime)!;
    expect(pet).toMatchObject({petId: 7, level: levelUp ? 6 : 5, exp: levelUp ? 30 : 50});
    // EV 会在未升级时同样重算属性，将这个测试注入的超上限 HP 收敛到真实上限。
    expect(pet.hp).toBe(Math.min(321, pet.maxHp));
    expect(pet).toMatchObject({evSpAtk: 1, evSpeed: 1});
    // Completion must not rely on a later autosave tick to persist its pet reward.
    expect((await stored()).pets[0]).toMatchObject({exp: pet.exp, level: pet.level, hp: pet.hp, maxHp: pet.maxHp});
    expect((await stored()).coins).toBe(125); expect(player.Data.coins).toBe(125);
    expect(player.ItemManager.GetItemCount(300001)).toBe(2);
    expect(commandPackets(2506)).toHaveLength(1);
    expect(events.filter(e => e.type === BattleEventType.BATTLE_END)).toHaveLength(1);
    expect(player.BattleManager.GetCurrentBattle()).toBeNull();
    await settle(1250);
    const reward = commandPackets(2202)[0].subarray(17);
    expect(Array.from({length: reward.length / 4}, (_, n) => reward.readUInt32BE(n * 4)))
      .toEqual([0, 0, 0, 2, 1, 25, 300001, 2]);
    const expected = await stored();
    await skill(); // Replayed real 2405 after battle cleanup cannot pay again.
    await reload();
    expect(await stored()).toEqual(expected);
    expect(player.PetManager.GetPetByCatchTime(catchTime)).toMatchObject({exp: pet.exp, level: pet.level, hp: pet.hp, evSpAtk: 1, evSpeed: 1});
    expect(player.ItemManager.GetItemCount(300001)).toBe(2); expect(player.Data.coins).toBe(125);
    player.BattleManager = new BattleManager(player);
    await skill();
    expect(await stored()).toEqual(expected); // A fresh session has no completed battle to replay.
  });

  test('two real skill requests admitted before the same winning turn cannot reward twice', async () => {
    await seed();
    let release!: () => void, entered!: () => void;
    const gate = new Promise<void>(r => {release = r;});
    const ready = new Promise<void>(r => {entered = r;});
    let starts = 0;
    const emit = player.EventBus.Emit.bind(player.EventBus);
    jest.spyOn(player.EventBus, 'Emit').mockImplementation(async event => {
      if (event.type === BattleEventType.ROUND_START) {if (++starts === 2) entered(); await gate;}
      await emit(event);
    });
    const requests = [skill(), skill()];
    await ready; release();
    await Promise.all(requests);
    await reload();
    expect((await stored()).coins).toBe(125);
    expect(player.PetManager.GetPetByCatchTime(catchTime)!.exp).toBe(50);
    expect(player.PetManager.GetPetByCatchTime(catchTime)).toMatchObject({evSpAtk: 1, evSpeed: 1});
    expect(player.ItemManager.GetItemCount(300001)).toBe(2);
    expect(commandPackets(2506)).toHaveLength(1);
  });

  test('duplicate internal finish while reward is awaiting currency is admitted only once', async () => {
    await seed();
    let release!: () => void, entered!: () => void;
    const gate = new Promise<void>(r => {release = r;});
    const ready = new Promise<void>(r => {entered = r;});
    const add = player.AddCurrency.bind(player);
    jest.spyOn(player, 'AddCurrency').mockImplementationOnce(async (...args) => {entered(); await gate; return add(...args);});
    const pending = skill();
    try {await ready; await (player.BattleManager as any).HandleFightOver(uid, 0);}
    finally {release(); await pending;}
    await reload();
    expect((await stored()).coins).toBe(125);
    expect(player.PetManager.GetPetByCatchTime(catchTime)!.exp).toBe(50);
    expect(player.PetManager.GetPetByCatchTime(catchTime)).toMatchObject({evSpAtk: 1, evSpeed: 1});
    expect(player.ItemManager.GetItemCount(300001)).toBe(2);
  });

  test('rejected pet reward keeps committed state and reports failed settlement without later rewards', async () => {
    await seed(); const before = await stored();
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    await db.Execute("CREATE TRIGGER deny_pet_reward BEFORE UPDATE ON player_pets BEGIN SELECT RAISE(FAIL, 'controlled pet write failure'); END");
    try {
      await skill(); await settle();
      expect(player.PetManager.GetPetByCatchTime(catchTime)!.exp).toBe(0);
      expect((await stored()).pets).toEqual(before.pets);
      expect((await stored()).coins).toBe(100);
      expect(player.ItemManager.GetItemCount(300001)).toBe(0);
      expect(commandPackets(2506)).toHaveLength(1);
      expect(events.find(e => e.type === BattleEventType.BATTLE_END)?.extra)
        .toMatchObject({rewardStatus: 'failed', rewardFailedStage: 'experience', dropItems: []});
      expect(error.mock.calls.some(args => args.some(arg => String(arg).includes('controlled pet write failure')))).toBe(true);
    } finally {await db.Execute('DROP TRIGGER deny_pet_reward');}
  });

  test('a later distinct battle in the same manager still earns its own reward once', async () => {
    const first = await seed(); await skill();
    await new FightNpcMonsterHandler().Handle(session(), new HeadInfo(), Buffer.alloc(4));
    await new ReadyToFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
    const second = player.BattleManager.GetCurrentBattle()!;
    expect(second).not.toBe(first); second.enemy.hp = 1;
    await skill(); await reload();
    expect((await stored()).coins).toBe(150);
    expect(player.PetManager.GetPetByCatchTime(catchTime)!.exp).toBe(100);
    expect(player.PetManager.GetPetByCatchTime(catchTime)).toMatchObject({evSpAtk: 2, evSpeed: 2});
    expect(player.ItemManager.GetItemCount(300001)).toBe(4);
    expect(commandPackets(2506)).toHaveLength(2);
  });

  test('defeat finishes without awarding EV', async () => {
    await seed();
    await (player.BattleManager as any).HandleFightOver(0, 0);
    await reload();
    expect(player.PetManager.GetPetByCatchTime(catchTime)).toMatchObject({exp: 0, evSpAtk: 0, evSpeed: 0});
    expect((await stored()).coins).toBe(100);
  });

  test.each([
    ['ack', 'new battle'], ['round start', 'new battle'], ['skill packet', 'new battle'],
    ['attack event', 'new battle'], ['status helper', 'new battle'], ['death event', 'new battle'],
    ['round end', 'new battle'], ['round start', 'leave'], ['attack event', 'leave'],
    ['round end', 'leave'], ['round start', 'logout'], ['attack event', 'logout'],
  ])('old 2405 paused at %s cannot cross %s', async (stage, transition) => {
    const old = await seed(), before = await stored();
    if (stage === 'attack event') old.enemy.hp = old.enemy.maxHp = 10000; // Both attacks execute: exercise nested awaits.
    let release!: () => void, entered!: () => void, armed = true;
    const gate = new Promise<void>(r => {release = r;});
    const ready = new Promise<void>(r => {entered = r;});
    const stop = async () => {if (armed) {armed = false; entered(); await gate;}};
    if (stage === 'ack' || stage === 'skill packet') {
      const send = player.SendPacket.bind(player);
      jest.spyOn(player, 'SendPacket').mockImplementation(async packet => {
        await send(packet);
        if (packet.getCmdId() === (stage === 'ack' ? 2405 : 2505)) await stop();
      });
    } else if (stage === 'status helper') {
      const manager = player.BattleManager as any, emit = manager.EmitStatusChangeEvents.bind(manager);
      jest.spyOn(manager, 'EmitStatusChangeEvents').mockImplementation(async (...args) => {await emit(...args); await stop();});
    } else {
      const type = {'round start': BattleEventType.ROUND_START, 'attack event': BattleEventType.ATTACK_RESULT,
        'death event': BattleEventType.PET_DEAD, 'round end': BattleEventType.ROUND_END}[stage];
      const emit = player.EventBus.Emit.bind(player.EventBus);
      jest.spyOn(player.EventBus, 'Emit').mockImplementation(async event => {await emit(event); if (event.type === type) await stop();});
    }
    const originalSpawn = player.MapSpawnManager;
    const pending = skill();
    let successor: ReturnType<BattleManager['GetCurrentBattle']> = null;
    let snapshot: unknown;
    try {
      await ready;
      if (transition === 'leave') {
        // Real leave handler/manager/tracker/spawn; only other-player broadcasts are irrelevant here.
        player.MapManager = new MapManager(player); player.MapSpawnManager = new MapSpawnManager(player);
        OnlineTracker.Instance.PlayerLogin(uid, session()); OnlineTracker.Instance.UpdatePlayerMap(uid, 301);
        jest.spyOn(MapVisibilityService.prototype, 'BroadcastToMap').mockResolvedValue(0);
        jest.spyOn(MapVisibilityService.prototype, 'RefreshMapPlayerLists').mockResolvedValue(0);
        await new LeaveMapHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
        expect(OnlineTracker.Instance.GetPlayerMap(uid)).toBe(0);
        expect((player.MapSpawnManager as any)._ogres).toEqual([]);
      } else if (transition === 'logout') {
        await player.BattleManager.OnLogout();
      } else {
        await new FightNpcMonsterHandler().Handle(session(), new HeadInfo(), Buffer.alloc(4));
        await new ReadyToFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
        successor = player.BattleManager.GetCurrentBattle()!;
        expect(successor).not.toBe(old);
        snapshot = JSON.parse(JSON.stringify(successor));
      }
      packets.length = 0; events.length = 0;
    } finally {release();}
    try {
      await pending;
      expect(packets).toHaveLength(0);
      expect(events).toHaveLength(0);
      expect(await stored()).toEqual(before);
      if (successor) {
        expect(player.BattleManager.GetCurrentBattle()).toBe(successor);
        expect(successor).toEqual(snapshot);
        successor.enemy.hp = 1;
        await skill(); await reload();
        expect((await stored()).coins).toBe(125);
        expect(player.PetManager.GetPetByCatchTime(catchTime)!.exp).toBe(50);
        expect(player.ItemManager.GetItemCount(300001)).toBe(2);
        expect(commandPackets(2506)).toHaveLength(1);
      } else if (transition === 'logout') {
        expect(player.BattleManager.GetCurrentBattle()).toBeNull();
      } else {
        expect((player.MapSpawnManager as any)._ogres).toEqual([]);
      }
    } finally {OnlineTracker.Instance.PlayerLogout(uid); player.MapSpawnManager = originalSpawn;}
  });

  test('status helper stops between removal/addition and between fighters after battle replacement', async () => {
    await seed();
    const manager = player.BattleManager as any, emitStatus = manager.EmitStatusChangeEvents.bind(manager);
    // Controlled status transition at the event boundary; do not replace damage/skill algorithms.
    jest.spyOn(manager, 'EmitStatusChangeEvents').mockImplementationOnce(async (before: any, current: any) => {
      player.BattleManager.GetCurrentBattle()!.player.status = 1;
      before.player.status = 2; before.enemy.status = 2;
      await emitStatus(before, current);
    });
    let release!: () => void, entered!: () => void;
    const gate = new Promise<void>(r => {release = r;});
    const ready = new Promise<void>(r => {entered = r;});
    const emit = player.EventBus.Emit.bind(player.EventBus);
    jest.spyOn(player.EventBus, 'Emit').mockImplementation(async event => {
      await emit(event);
      if (event.type === BattleEventType.STATUS_CHANGE) {entered(); await gate;}
    });
    const pending = skill();
    try {
      await ready;
      await new FightNpcMonsterHandler().Handle(session(), new HeadInfo(), Buffer.alloc(4));
      await new ReadyToFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
      events.length = 0; packets.length = 0;
    } finally {release();}
    await pending;
    expect(events).toHaveLength(0); expect(packets).toHaveLength(0);
    expect((await stored()).coins).toBe(100);
    expect(player.BattleManager.GetCurrentBattle()!.isOver).toBe(false);
  });

  test.each(['new battle', 'leave'])('delayed old reward display does not cross %s', async transition => {
    await seed(); await skill();
    expect((await stored()).coins).toBe(125); // Already-earned rewards are retained.
    const originalSpawn = player.MapSpawnManager;
    try {
      if (transition === 'new battle') {
        await new FightNpcMonsterHandler().Handle(session(), new HeadInfo(), Buffer.alloc(4));
        await new ReadyToFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
      } else {
        player.MapManager = new MapManager(player); player.MapSpawnManager = new MapSpawnManager(player);
        OnlineTracker.Instance.PlayerLogin(uid, session()); OnlineTracker.Instance.UpdatePlayerMap(uid, 301);
        jest.spyOn(MapVisibilityService.prototype, 'BroadcastToMap').mockResolvedValue(0);
        jest.spyOn(MapVisibilityService.prototype, 'RefreshMapPlayerLists').mockResolvedValue(0);
        await new LeaveMapHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
      }
      packets.length = 0;
      await settle(1250);
      expect(commandPackets(2202)).toHaveLength(0);
      expect((await stored()).coins).toBe(125);
      if (transition === 'new battle') {
        player.BattleManager.GetCurrentBattle()!.enemy.hp = 1;
        await skill(); await settle(1250);
        expect(commandPackets(2202)).toHaveLength(1);
        expect((await stored()).coins).toBe(150);
      }
    } finally {OnlineTracker.Instance.PlayerLogout(uid); player.MapSpawnManager = originalSpawn;}
  });
});
