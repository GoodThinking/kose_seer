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
import { UsePetItemHandler } from '../../../Server/Packet/Recv/Battle/UsePetItemHandler';
import { ChangePetHandler } from '../../../Server/Packet/Recv/Battle/ChangePetHandler';
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

describe('R11 battle-local PP supply through real handlers and temporary SQLite', () => {
  const uid = 191101, catchTime = 1700001101;
  const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
  let directory: string, oldDb: typeof Config.Config.database, oldProtocol: typeof Config.Game.clientProtocol;
  let player: PlayerInstance;
  const packets: Buffer[] = [], events: any[] = [], intervals: ReturnType<typeof setInterval>[] = [];
  const settle = (ms = 180) => new Promise(resolve => setTimeout(resolve, ms));
  const session = () => ({Player: player} as IClientSession);
  const commandPackets = (cmd: number) => packets.filter(p => p.readUInt32BE(5) === cmd);
  async function skill(id = 10004) {
    const body = Buffer.alloc(4); body.writeUInt32BE(id);
    await new UseSkillHandler().Handle(session(), new HeadInfo(), body);
  }
  async function stored() {
    const [p] = await db.Query<{pet_list: string}>('SELECT pet_list FROM player_pets WHERE owner_id = ?', [uid]);
    const [i] = await db.Query<{item_list: string}>('SELECT item_list FROM player_items WHERE owner_id = ?', [uid]);
    const [money] = await db.Query<{coins: number}>('SELECT coins FROM players WHERE user_id = ?', [uid]);
    return {pets: JSON.parse(p.pet_list) as IPetInfo[], items: JSON.parse(i.item_list), coins: money.coins};
  }
  async function seed(count = 2, calculatedHp = false) {
    player.Data.mapID = 301; player.Data.coins = 100;
    player.BattleManager = new BattleManager(player);
    player.MapSpawnManager = {GetMapOgres: () => [{petId: 13, originalPetId: 13, shiny: 0}], OnBattleEnd: () => {}} as any;
    await db.Execute('UPDATE players SET coins = 100 WHERE user_id = ?', [uid]);
    player.PetManager.PetData.PetList = [4, 1].map((id, i) => Object.assign(createDefaultPetInfo(uid, id), {
      catchTime: catchTime + i, level: 50, exp: 0, hp: 500, maxHp: 500, atk: 500, def: 500, speed: 500,
      isDefault: i === 0, skillArray: [id === 4 ? 10004 : 10001],
    }));
    // Victory recalculates EV-dependent stats; use valid HP for persistence assertions.
    if (calculatedHp) {
      for (const pet of player.PetManager.PetData.PetList) {
        pet.hp = pet.maxHp = PetCalculator.CalculateStatsFromPet(pet).maxHp;
      }
    }
    player.ItemManager.ItemData.ItemList = count ? [{itemId: 300016, count, expireTime: 0}] : [];
    await helper.SavePetData(player.PetManager.PetData); await helper.SaveItemData(player.ItemManager.ItemData); await settle();
    await new FightNpcMonsterHandler().Handle(session(), new HeadInfo(), Buffer.alloc(4));
    await new ReadyToFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
    const battle = player.BattleManager.GetCurrentBattle()!;
    battle.enemy.hp = battle.enemy.maxHp = 1000000; battle.enemy.skills = [10001]; battle.enemy.skillPP = [35];
    packets.length = 0; events.length = 0;
    return battle;
  }
  const ppItem = (target = catchTime) => {
    const b = Buffer.alloc(player.ClientProtocol === 'kose' ? 4 : 12);
    if (b.length === 4) b.writeUInt32BE(300016);
    else {b.writeUInt32BE(target); b.writeUInt32BE(300016, 4);}
    return new UsePetItemHandler().Handle(session(), new HeadInfo(), b);
  };
  const change = (target: number) => {
    const b = Buffer.alloc(4); b.writeUInt32BE(target);
    return new ChangePetHandler().Handle(session(), new HeadInfo(), b);
  };
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
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xin-battle-pp-'));
    oldDb = Config.Config.database; oldProtocol = Config.Game.clientProtocol;
    Config.Config.database = {type: 'sqlite', path: path.join(directory, 'battle-pp.sqlite')};
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
    Object.assign(player, {Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'BattlePPTest'), {mapID: 301, coins: 100})),
      _playerRepo: new PlayerRepository(), EventBus: new GameEventBus(),
      _session: {Socket: {write: (b: Buffer) => packets.push(Buffer.from(b))}}, _packetBuilder: new PacketBuilder(),
      MapSpawnManager: {GetMapOgres: () => [{petId: 13, originalPetId: 13, shiny: 0}], OnBattleEnd: () => {}},
    });
    for (const type of [...Object.values(BattleEventType), ItemEventType.ITEM_GAINED]) {
      player.EventBus.On(type, async event => {events.push(event);});
    }
    player.PetManager = new PetManager(player); player.ItemManager = new ItemManager(player);
    await player.PetManager.Initialize(); await player.ItemManager.Initialize();
  });
  beforeEach(() => {
    Config.Game.clientProtocol = 'xin-20261013';
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const ogre = {petId: 13, slot: 0, level: 5, expReward: 50, expMultiplier: 1, refreshConfig: {enabled: true},
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


  test.each(['kose', 'xin-20261013'] as const)('%s real learned skill → PP medicine → switch back → victory persists without PP schema', async protocol => {
    Config.Game.clientProtocol = protocol;
    const battle = await seed(1, true);
    for (let i = 0; i < 6; i++) await skill();
    expect(battle.player.skillPP).toEqual([29]);
    const hp = battle.player.hp, petHp = player.PetManager.GetPetByCatchTime(catchTime)!.hp;
    const petSave = jest.spyOn(helper, 'SavePetData');
    await ppItem();
    expect(petSave).not.toHaveBeenCalled(); petSave.mockRestore();
    expect(battle.player.skillPP).toEqual([34]); expect(battle.player.hp).toBe(hp);
    expect(player.PetManager.GetPetByCatchTime(catchTime)!.hp).toBe(petHp);
    const reply = commandPackets(2406)[0];
    expect(reply.readInt32BE(13)).toBe(0); expect(reply.readUInt32BE(25)).toBe(hp); expect(reply.readInt32BE(29)).toBe(0);
    expect(player.ItemManager.GetItemCount(300016)).toBe(0);
    await change(catchTime + 1); await skill(10001);
    expect(battle.player.skillPP).toEqual([34]);
    await change(catchTime); expect(battle.player.skillPP).toEqual([34]);
    battle.enemy.hp = 1; await skill();
    expect(battle.player.skillPP).toEqual([33]); expect(player.BattleManager.GetCurrentBattle()).toBeNull();
    const attack = commandPackets(2505).slice(-1)[0];
    expect([17, 49, 53, 57].map(offset => attack.readUInt32BE(offset))).toEqual([uid, 1, 10004, 33]);
    const expected = await stored(); await reload(); expect(await stored()).toEqual(expected);
    expect(expected.pets.find(p => p.catchTime === catchTime)!.exp).toBe(50);
    expect(expected.pets.find(p => p.catchTime === catchTime)!.hp).toBe(battle.player.hp);
    expect(expected.pets.find(p => p.catchTime === catchTime)!.skillArray).toEqual([10004]);
    expect(expected.coins).toBe(125); expect(player.ItemManager.GetItemCount(300016)).toBe(0);
    expect(player.ItemManager.GetItemCount(300001)).toBe(2);
    expect(expected.pets.every(p => !('skillPP' in p))).toBe(true);
    await settle(1250); expect(commandPackets(2202)).toHaveLength(1);
    await new FightNpcMonsterHandler().Handle(session(), new HeadInfo(), Buffer.alloc(4));
    await new ReadyToFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
    expect(player.BattleManager.GetCurrentBattle()!.player.skillPP).toEqual([35]);
    expect(commandPackets(2506)).toHaveLength(1);
  });

  test('PP supply clamps at configured MaxPP and is allowed at full HP', async () => {
    const battle = await seed(); await skill();
    battle.player.hp = battle.player.maxHp;
    await ppItem(); expect(battle.player.skillPP).toEqual([35]); expect(battle.player.hp).toBe(500);
    expect(player.ItemManager.GetItemCount(300016)).toBe(1);
  });

  test('switching two actual learned skills retains each catchTime PP without medicine', async () => {
    const battle = await seed();
    await skill(); await skill(); expect(battle.player.skillPP).toEqual([33]);
    await change(catchTime + 1); await skill(10001); expect(battle.player.skillPP).toEqual([34]);
    await change(catchTime); expect(battle.player.skills).toEqual([10004]); expect(battle.player.skillPP).toEqual([33]);
    await change(catchTime + 1); expect(battle.player.skills).toEqual([10001]); expect(battle.player.skillPP).toEqual([34]);
  });

  test('full PP, wrong target and empty inventory reject without restoring PP or consuming', async () => {
    const battle = await seed(); const before = await stored();
    await ppItem(); expect(commandPackets(2406)[0].readInt32BE(13)).toBe(5001);
    await skill(); const pp = [...battle.player.skillPP!];
    await ppItem(catchTime + 1);
    expect(battle.player.skillPP).toEqual(pp); expect((await stored()).items).toEqual(before.items);
    player.ItemManager.ItemData.ItemList = []; await helper.SaveItemData(player.ItemManager.ItemData);
    await ppItem(); expect(battle.player.skillPP).toEqual(pp);
    expect(commandPackets(2406).every(p => p.readInt32BE(13) !== 0)).toBe(true);
  });

  test.each([1, 2])('real SQLite inventory failure (count=%s) cannot grant PP after debounce/reload', async count => {
    const battle = await seed(count); await skill();
    const hp = battle.player.hp, pp = [...battle.player.skillPP!];
    await db.Execute("CREATE TRIGGER deny_pp_update BEFORE UPDATE ON player_items BEGIN SELECT RAISE(FAIL, 'controlled PP item failure'); END");
    try {
      await ppItem();
      expect(commandPackets(2406)[0].readInt32BE(13)).toBe(5001);
      expect(battle.player.skillPP).toEqual(pp); expect(battle.player.hp).toBe(hp);
      expect(player.ItemManager.GetItemCount(300016)).toBe(count);
      expect((await stored()).items[0].count).toBe(count);
      await db.Execute('DROP TRIGGER deny_pp_update'); await settle();
      expect((await stored()).items[0].count).toBe(count); expect(battle.player.skillPP).toEqual(pp);
      await reload(); expect(player.ItemManager.GetItemCount(300016)).toBe(count);
      await ppItem(); expect(battle.player.skillPP).toEqual(pp); // Uncertain session cannot repeat use.
    } finally {await db.Execute('DROP TRIGGER IF EXISTS deny_pp_update');}
  });

  test('PP supply rejects an overlapping attack and accepts the next attack after persistence', async () => {
    const battle = await seed();
    for (let i = 0; i < 6; i++) await skill();
    expect(battle.player.skillPP).toEqual([29]);
    const save = helper.SaveItemData.bind(helper);
    let entered!: () => void, release!: () => void;
    const ready = new Promise<void>(resolve => { entered = resolve; });
    const gate = new Promise<void>(resolve => { release = resolve; });
    jest.spyOn(helper, 'SaveItemData').mockImplementation(async (data, strict) => {
      await save(data, strict);
      if (strict) { entered(); await gate; }
    });
    const pending = ppItem();
    try {
      await ready;
      await skill();
      expect(battle.player.skillPP).toEqual([29]);
      expect(commandPackets(2405).at(-1)!.readInt32BE(13)).toBe(5001);
      release();
      await pending;
      expect(battle.player.skillPP).toEqual([34]);
      await skill();
      expect(battle.player.skillPP).toEqual([33]);
      expect(player.ItemManager.GetItemCount(300016)).toBe(1);
      expect(commandPackets(2406).at(-1)!.readInt32BE(13)).toBe(0);
    } finally { release(); await pending; }
  });

  test.each(['leave', 'logout', 'successor'])('pending PP save excludes duplicate and invalidates after %s', async transition => {
    const old = await seed(); await skill();
    const pp = [...old.player.skillPP!], hp = old.player.hp, save = helper.SaveItemData.bind(helper);
    let entered!: () => void, release!: () => void;
    const ready = new Promise<void>(r => {entered = r;}), gate = new Promise<void>(r => {release = r;});
    jest.spyOn(helper, 'SaveItemData').mockImplementation(async (data, strict) => {
      await save(data, strict); if (strict) {entered(); await gate;}
    });
    const pending = ppItem(); let successor: any, snapshot = '', logout: Promise<void> | undefined;
    try {
      await ready; await ppItem();
      if (transition === 'logout') {
        let completed = false;
        logout = player.BattleManager.OnLogout().then(() => { completed = true; });
        await new Promise<void>(resolve => setImmediate(resolve));
        expect(completed).toBe(false);
      }
      else {
        player.MapManager = new MapManager(player); player.MapSpawnManager = new MapSpawnManager(player);
        OnlineTracker.Instance.PlayerLogin(uid, session()); OnlineTracker.Instance.UpdatePlayerMap(uid, 301);
        jest.spyOn(MapVisibilityService.prototype, 'BroadcastToMap').mockResolvedValue(0);
        jest.spyOn(MapVisibilityService.prototype, 'RefreshMapPlayerLists').mockResolvedValue(0);
        await new LeaveMapHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
        if (transition === 'successor') {
          successor = JSON.parse(JSON.stringify(old)); successor.player.skillPP = [17];
          (player.BattleManager as any)._pvpService._initializeBattle(successor); snapshot = JSON.stringify(successor);
        }
      }
      release(); await pending;
      await logout;
      expect(old.player.skillPP).toEqual(pp); expect(old.player.hp).toBe(hp);
      if (successor) expect(JSON.stringify(successor)).toBe(snapshot);
      expect(commandPackets(2406).map(p => p.readInt32BE(13))).toEqual([5001]);
      expect(player.ItemManager.GetItemCount(300016)).toBe(1);
      expect((player.BattleManager as any)._petItemInProgress).toBe(false);
      await reload(); expect(player.ItemManager.GetItemCount(300016)).toBe(1);
    } finally {release(); await pending; await logout; OnlineTracker.Instance.PlayerLogout(uid);}
  });
});
