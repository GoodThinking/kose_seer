import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import '../../../../DataBase/loaders/DataLoader';
import { DatabaseManager } from '../../../../DataBase/DatabaseManager';
import { DatabaseHelper } from '../../../../DataBase/DatabaseHelper';
import { Migration012FixAllTables } from '../../../../DataBase/migrations/scripts/012_fix_all_tables';
import { Migration006CreateItems } from '../../../../DataBase/migrations/scripts/006_create_items';
import { Migration022CreateRewardBoosts } from '../../../../DataBase/migrations/scripts/022_create_reward_boosts';
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
import { UsePetItemHandler } from '../../../Server/Packet/Recv/Battle/UsePetItemHandler';
import { LeaveMapHandler } from '../../../Server/Packet/Recv/Map/LeaveMapHandler';
import { MapManager } from '../../Map/MapManager';
import { MapSpawnManager } from '../../Map/MapSpawnManager';
import { MapVisibilityService } from '../../Map/MapVisibilityService';
import { OnlineTracker } from '../../Player/OnlineTracker';
import { IClientSession } from '../../../Server/Packet/IHandler';
import { createDefaultPetInfo } from '../../../../shared/models/PetModel';
import { createDefaultPlayerInfo } from '../../../../shared/models/PlayerModel';
import { GameEventBus } from '../../Event/GameEventBus';
import { GameConfig } from '../../../../shared/config/game/GameConfig';
import { ItemSystem } from '../../Item/ItemSystem';

describe('2406 medicine admission and real SQLite consumption', () => {
  const uid = 190601, caught = 1700000601, db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
  let directory: string, oldDb: typeof Config.Config.database, oldProtocol: typeof Config.Game.clientProtocol;
  let player: PlayerInstance;
  const packets: Buffer[] = [], intervals: ReturnType<typeof setInterval>[] = [];
  const settle = () => new Promise(resolve => setTimeout(resolve, 180));
  const session = () => ({Player: player} as IClientSession);
  function body(itemId = 300011, catchTime = caught, last = 0) {
    const b = Buffer.alloc(player.ClientProtocol === 'kose' ? 4 : 12);
    if (b.length === 4) b.writeUInt32BE(itemId);
    else {b.writeUInt32BE(catchTime); b.writeUInt32BE(itemId, 4); b.writeUInt32BE(last, 8);}
    return b;
  }
  function nieoBody(itemId: number, catchTime = caught) {
    const b = Buffer.alloc(12);
    b.writeUInt32BE(catchTime); b.writeUInt32BE(itemId, 4);
    return b;
  }
  const request = (b = body()) => new UsePetItemHandler().Handle(session(), new HeadInfo(), b);
  const replies = () => packets.filter(p => p.readUInt32BE(5) === 2406);
  function pause() {
    let entered!: () => void, release!: () => void;
    const ready = new Promise<void>(r => {entered = r;}), gate = new Promise<void>(r => {release = r;});
    return {ready, release, wait: async () => {entered(); await gate;}};
  }
  async function stored() {
    const [p] = await db.Query<{pet_list: string}>('SELECT pet_list FROM player_pets WHERE owner_id=?', [uid]);
    const [i] = await db.Query<{item_list: string}>('SELECT item_list FROM player_items WHERE owner_id=?', [uid]);
    return {pets: JSON.parse(p.pet_list), items: JSON.parse(i.item_list)};
  }
  async function seed(count = 2, hp = 321, itemId = 300011) {
    player.BattleManager = new BattleManager(player);
    player.MapSpawnManager = {GetMapOgres: () => [{petId: 8, originalPetId: 8, shiny: 0}], OnBattleEnd: () => {}} as any;
    player.PetManager.PetData.PetList = [Object.assign(createDefaultPetInfo(uid, 7), {
      catchTime: caught, hp: hp || 321, maxHp: 500, level: 50, atk: 500, speed: 500, isDefault: true, skillArray: [10001],
    })];
    player.ItemManager.ItemData.ItemList = count ? [{itemId, count, expireTime: 0}] : [];
    await helper.SavePetData(player.PetManager.PetData); await helper.SaveItemData(player.ItemManager.ItemData); await settle();
    await player.BattleManager.HandleFightNpcMonster(0); await player.BattleManager.HandleReadyToFight();
    const battle = player.BattleManager.GetCurrentBattle()!;
    battle.player.hp = hp;
    if (hp === 0) {player.PetManager.GetPetByCatchTime(caught)!.hp = 0; await helper.SavePetData(player.PetManager.PetData);}
    packets.length = 0;
    return battle;
  }
  async function reload() {
    await settle(); helper.RemoveCache(uid); await db.Shutdown(); await db.Initialize();
    player.PetManager = new PetManager(player); player.ItemManager = new ItemManager(player);
    await player.PetManager.Initialize(); await player.ItemManager.Initialize();
  }
  beforeAll(async () => {
    const interval = global.setInterval;
    const spy = jest.spyOn(global, 'setInterval').mockImplementation(((...args: Parameters<typeof setInterval>) => {
      const timer = interval(...args); intervals.push(timer); return timer;
    }) as typeof setInterval);
    void PvpBattleManager.Instance; spy.mockRestore();
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xin-medicine-'));
    oldDb = Config.Config.database; oldProtocol = Config.Game.clientProtocol;
    Config.Config.database = {type: 'sqlite', path: path.join(directory, 'medicine.sqlite')};
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.ITEM_CONFIG]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
    await ConfigRegistry.Instance.Initialize(); await db.Initialize();
    await db.Execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY)'); await db.Execute('INSERT INTO players VALUES (?)', [uid]);
    await db.Execute(new Migration012FixAllTables().upSQLite().find(s => s.startsWith('CREATE TABLE IF NOT EXISTS player_pets'))!);
    await db.Execute(new Migration006CreateItems().upSQLite()[0]);
    await db.Execute(new Migration022CreateRewardBoosts().upSQLite()[0]);
    player = Object.create(PlayerInstance.prototype); Object.defineProperty(player, 'Uid', {value: uid});
    Object.assign(player, {Data: Object.assign(createDefaultPlayerInfo(uid, 'MedicineTest'), {mapID: 301}),
      EventBus: new GameEventBus(), _packetBuilder: new PacketBuilder(),
      _session: {Socket: {write: (b: Buffer) => packets.push(Buffer.from(b))}},
    });
    player.PetManager = new PetManager(player); player.ItemManager = new ItemManager(player);
    await player.PetManager.Initialize(); await player.ItemManager.Initialize();
  });
  beforeEach(() => {
    Config.Game.clientProtocol = 'xin-20261013'; player.Data.mapID = 301;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(GameConfig, 'GetMapConfigById').mockReturnValue({ogres: [{petId: 8, slot: 0, level: 5}]} as any);
    jest.spyOn(GameConfig, 'GetMapOgreConfig').mockReturnValue({maps: {}} as any);
  });
  afterEach(async () => {await settle(); OnlineTracker.Instance.PlayerLogout(uid); jest.restoreAllMocks();});
  afterAll(async () => {
    intervals.forEach(clearInterval); await settle(); helper.RemoveCache(uid); await db.Shutdown();
    Config.Config.database = oldDb; Config.Game.clientProtocol = oldProtocol; fs.rmSync(directory, {recursive: true, force: true});
  });

  test.each(['kose', 'xin-20261013'] as const)('%s valid payload consumes one and persists configured 20 HP', async protocol => {
    Config.Game.clientProtocol = protocol;
    const battle = await seed(); await request();
    expect(battle.player.hp).toBe(341);
    expect(replies()).toHaveLength(1); expect(replies()[0].readInt32BE(13)).toBe(0);
    expect(replies()[0].length).toBe(33);
    expect([17, 21, 25].map(offset => replies()[0].readUInt32BE(offset))).toEqual([uid, 300011, 341]);
    expect(replies()[0].readInt32BE(29)).toBe(20);
    expect((await stored()).pets[0].hp).toBe(341); expect((await stored()).items[0].count).toBe(1);
    await reload(); expect(player.PetManager.GetPetByCatchTime(caught)!.hp).toBe(341);
    expect(player.ItemManager.GetItemCount(300011)).toBe(1);
  });
  test.each([300011, 300012, 300013, 300014, 300015].flatMap((itemId, index) =>
    [321, 490].map(hp => [itemId, [20, 50, 100, 150, 200][index], hp])))
  ('fixed Nieo HP medicine %i with configured HP %i at hp %i consumes once and queues a counterattack', async (itemId, configuredHP, hp) => {
    Config.Game.clientProtocol = 'kose';
    expect((ItemSystem.GetItem(itemId) as any).HP).toBe(configuredHP);
    expect((ItemSystem.GetItem(itemId) as any).ItemType).toBe(1);
    const battle = await seed(2, hp, itemId);
    const healed = Math.min(configuredHP, 500 - hp);
    await request(nieoBody(itemId));
    expect(packets.map(p => p.readUInt32BE(5))).toEqual([2406, 2505]);
    expect(replies()[0].readInt32BE(13)).toBe(0);
    expect(replies()[0].readUInt32BE(21)).toBe(itemId);
    expect(replies()[0].readUInt32BE(25)).toBe(hp + healed);
    expect(replies()[0].readInt32BE(29)).toBe(healed);
    // The emitted counterattack may miss or use a non-damaging skill.
    expect(battle.player.hp).toBeLessThanOrEqual(hp + healed);
    expect((await stored()).pets[0].hp).toBe(hp + healed);
    expect((await stored()).items.find((item: any) => item.itemId === itemId).count).toBe(1);
    await reload();
    expect(player.ItemManager.GetItemCount(itemId)).toBe(1);
    expect(player.PetManager.GetPetByCatchTime(caught)!.hp).toBe(hp + healed);
  });
  test.each([300011, 300012, 300013, 300014, 300015].flatMap(itemId =>
    [[itemId, 2, 500], [itemId, 0, 321]]))
  ('fixed Nieo HP medicine %i with stock %i and hp %i rejects without consumption', async (itemId, count, hp) => {
    Config.Game.clientProtocol = 'kose';
    const battle = await seed(count, hp, itemId), before = await stored();
    await request(nieoBody(itemId));
    expect(packets.map(p => p.readUInt32BE(5))).toEqual([2406]);
    expect(replies()[0].readInt32BE(13)).toBe(5001);
    expect(battle.player.hp).toBe(hp); expect(await stored()).toEqual(before);
  });
  test.each([300010, 300017, 300020, 300021, 300022, 999999])
  ('fixed Nieo unrelated medicine %i stays rejected even with stock', async itemId => {
    Config.Game.clientProtocol = 'kose';
    const battle = await seed(2, 321, itemId), before = await stored();
    await request(nieoBody(itemId));
    expect(replies()[0].readInt32BE(13)).toBe(5001);
    expect(battle.player.hp).toBe(321); expect(await stored()).toEqual(before);
  });
  test.each([false, true])('fixed Nieo basic PP medicine full=%s preserves its original behavior', async full => {
    Config.Game.clientProtocol = 'kose';
    const battle = await seed(2, 321, 300016);
    const max = battle.player.skills.map(id => GameConfig.GetSkillById(id)!.MaxPP);
    battle.player.skillPP = max.map(pp => full ? pp : pp - 3);
    const before = await stored();
    await request(nieoBody(300016));
    expect(replies()[0].readInt32BE(13)).toBe(full ? 5001 : 0);
    expect(battle.player.skillPP).toEqual(max);
    expect(packets.map(p => p.readUInt32BE(5))).toEqual(full ? [2406] : [2406, 2505]);
    if (full) expect(await stored()).toEqual(before);
    else {
      expect(replies()[0].readInt32BE(29)).toBe(0);
      expect((await stored()).items[0].count).toBe(1);
    }
  });

  test.each([['ItemType', 2], ['HP', 0], ['HP', 1.5]] as const)
  ('fixed Nieo supported HP medicine still rejects invalid %s=%s configuration', async (field, value) => {
    Config.Game.clientProtocol = 'kose';
    const battle = await seed(2, 321, 300014), before = await stored();
    const configured = ItemSystem.GetItem(300014)!;
    jest.spyOn(ItemSystem, 'GetItem').mockReturnValue({...configured, [field]: value} as any);
    await request(nieoBody(300014));
    expect(replies()[0].readInt32BE(13)).toBe(5001);
    expect(battle.player.hp).toBe(321); expect(await stored()).toEqual(before);
  });

  test('logout synchronization after an in-flight fixed HP save preserves the committed heal', async () => {
    Config.Game.clientProtocol = 'kose';
    const battle = await seed(2, 321, 300014), stop = pause(), save = helper.SavePetData.bind(helper);
    jest.spyOn(helper, 'SavePetData').mockImplementation(async (data, strict) => {
      await save(data, strict);
      if (strict) await stop.wait();
    });
    const medicine = request(nieoBody(300014));
    await stop.ready;
    expect((await stored()).pets[0].hp).toBe(471);
    // Reproduce the separately-owned logout synchronization contract without editing OnLogout.
    player.BattleManager.InvalidatePendingCapture();
    const logout = (async () => {
      const release = await player.ItemManager.ItemData.AcquireReward();
      try {
        await player.PetManager.PetData.WaitForStagedSave();
        await (player.BattleManager as any).SyncBattlePetHP();
        (player.BattleManager as any).CleanupBattle();
        await save(player.PetManager.PetData, true);
      } finally { release(); }
    })();
    try {
      stop.release(); await Promise.all([medicine, logout]);
      expect(packets).toHaveLength(0); // Invalidated medicine cannot notify or counterattack.
      expect((await stored()).pets[0].hp).toBe(471);
      expect((await stored()).items[0].count).toBe(1);
      expect(player.PetManager.GetPetByCatchTime(caught)!.hp).toBe(471);
    } finally {stop.release(); await medicine; await logout;}
  });

  test('no stock and wrong medicine types cannot heal for free', async () => {
    const battle = await seed(0), before = await stored();
    for (const id of [300011, 300001, 300016, 300021, 999999]) await request(body(id));
    expect(replies().every(p => p.readInt32BE(13) === 5001)).toBe(true);
    expect(battle.player.hp).toBe(321); expect(await stored()).toEqual(before);
  });
  test('fixed Nieo KOSE body heals, queues the enemy turn and persists stock', async () => {
    Config.Game.clientProtocol = 'kose';
    const battle = await seed();
    const nieo = Buffer.alloc(12);
    nieo.writeUInt32BE(caught);
    nieo.writeUInt32BE(300011, 4);
    await request(nieo);
    expect(battle.player.hp).toBeLessThan(341);
    expect(battle.player.hp).toBeGreaterThan(321);
    expect(packets.map(p => p.readUInt32BE(5))).toEqual([2406, 2505]);
    expect(replies()[0].readInt32BE(13)).toBe(0);
    expect(replies()[0].readUInt32BE(25)).toBe(341);
    expect((await stored()).items[0].count).toBe(1);
    await reload();
    expect(player.PetManager.GetPetByCatchTime(caught)!.hp).toBe(341);
    expect(player.ItemManager.GetItemCount(300011)).toBe(1);
  });
  test('strict profile length, reserved field and target identity reject before consumption', async () => {
    await seed(); const before = await stored();
    for (const b of [Buffer.alloc(0), Buffer.alloc(4), Buffer.alloc(8), Buffer.alloc(16), body(300011, caught, 1), body(300011, caught + 1), body(300011, 0)]) await request(b);
    const reserved = body(300011, caught, 1); Config.Game.clientProtocol = 'kose'; await request(reserved);
    expect(replies()).toHaveLength(8); expect(replies().every(p => p.readInt32BE(13) === 5001)).toBe(true);
    expect(await stored()).toEqual(before);
  });
  test.each([0, 500])('unsupported dead/full target hp=%s does not consume', async hp => {
    const battle = await seed(2, hp), before = await stored(); await request();
    expect(replies()[0].readInt32BE(13)).toBe(5001); expect(battle.player.hp).toBe(hp);
    expect(await stored()).toEqual(before);
  });
  test('healing clamps to maximum; sequential uses each cost one and exhausted replay fails', async () => {
    const battle = await seed(2, 470); await request(); await request(); await request();
    expect(battle.player.hp).toBe(500);
    expect(replies().map(p => p.readInt32BE(13))).toEqual([0, 0, 5001]);
    expect(replies().slice(0, 2).map(p => p.readInt32BE(29))).toEqual([20, 10]);
    await reload(); expect(player.ItemManager.GetItemCount(300011)).toBe(0);
    expect(player.PetManager.GetPetByCatchTime(caught)!.hp).toBe(500);
  });
  test('full-PP target, max-HP items and PVP reject without consumption', async () => {
    const battle = await seed();
    player.ItemManager.ItemData.ItemList.push(...[300016, 300021].map(itemId => ({itemId, count: 2, expireTime: 0})));
    await helper.SaveItemData(player.ItemManager.ItemData);
    const before = await stored();
    await request(body(300016)); await request(body(300021));
    battle.isPvp = true; await request();
    expect(replies().map(p => p.readInt32BE(13))).toEqual([5001, 5001, 5001]);
    expect(battle.player.hp).toBe(321); expect(await stored()).toEqual(before);
  });
  test('pending inventory save admits only one medicine and rejects overlapping skill', async () => {
    const battle = await seed(), stop = pause(), save = helper.SaveItemData.bind(helper);
    jest.spyOn(helper, 'SaveItemData').mockImplementation(async (data, strict) => {await save(data, strict); await stop.wait();});
    const pending = request();
    try {
      await stop.ready; await request(); await player.BattleManager.HandleUseSkill(10001);
      expect(battle.player.hp).toBe(321);
      expect(player.ItemManager.GetItemCount(300011)).toBe(1);
      expect(packets.some(p => p.readUInt32BE(5) === 2405 && p.readInt32BE(13) === 5001)).toBe(true);
    } finally {stop.release(); await pending;}
    expect(replies().map(p => p.readInt32BE(13))).toEqual([5001, 0]);
    expect(battle.player.hp).toBe(341); expect((await stored()).items[0].count).toBe(1);
  });
  test.each(['SaveItemData', 'SavePetData'] as const)('%s continuation cannot affect a successor after real map leave', async method => {
    const old = await seed(), stop = pause(), save = helper[method].bind(helper);
    jest.spyOn(helper, method).mockImplementation(async (data: any, strict?: boolean) => {await (save as (d: any, s?: boolean) => Promise<void>)(data, strict); await stop.wait();});
    const pending = request();
    let successor: any, snapshot: string = '';
    try {
      await stop.ready;
      player.MapManager = new MapManager(player); player.MapSpawnManager = new MapSpawnManager(player);
      OnlineTracker.Instance.PlayerLogin(uid, session()); OnlineTracker.Instance.UpdatePlayerMap(uid, 301);
      jest.spyOn(MapVisibilityService.prototype, 'BroadcastToMap').mockResolvedValue(0);
      jest.spyOn(MapVisibilityService.prototype, 'RefreshMapPlayerLists').mockResolvedValue(0);
      await new LeaveMapHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
      expect(OnlineTracker.Instance.GetPlayerMap(uid)).toBe(0);
      successor = JSON.parse(JSON.stringify(old)); successor.player.hp = 123;
      (player.BattleManager as any)._pvpService._initializeBattle(successor);
      snapshot = JSON.stringify(successor);
    } finally {stop.release(); await pending;}
    expect(player.BattleManager.GetCurrentBattle()).toBe(successor);
    expect(JSON.stringify(successor)).toBe(snapshot); expect(replies()).toHaveLength(0);
    expect((await stored()).items[0].count).toBe(1);
    expect((await stored()).pets[0].hp).toBe(method === 'SaveItemData' ? 321 : 341);
  });
  test('skill admitted first prevents medicine consumption while its acknowledgement is pending', async () => {
    const battle = await seed(), before = await stored(), stop = pause(), send = player.SendPacket.bind(player);
    jest.spyOn(player, 'SendPacket').mockImplementation(async packet => {
      await send(packet);
      if (packets[packets.length - 1].readUInt32BE(5) === 2405) await stop.wait();
    });
    const pending = player.BattleManager.HandleUseSkill(10001);
    try {
      await stop.ready; await request();
      expect(replies()[0].readInt32BE(13)).toBe(5001);
      // The accepted skill debit is durable before its success acknowledgement; medicine still changes nothing.
      before.pets[0].skillPP = {10001: 34};
      expect(battle.player.hp).toBe(321); expect(await stored()).toEqual(before);
      player.BattleManager.InvalidatePendingCapture();
    } finally {stop.release(); await pending;}
  });
  test('propagated save rejection returns failure, releases the lock and blocks uncertain subsequent medicine', async () => {
    const battle = await seed();
    jest.spyOn(helper, 'SaveItemData').mockRejectedValueOnce(new Error('controlled rejected promise'));
    await request();
    expect(battle.player.hp).toBe(321); expect(replies()[0].readInt32BE(13)).toBe(5001);
    expect(player.ItemManager.GetItemCount(300011)).toBe(2);
    expect((player.BattleManager as any)._petItemInProgress).toBe(false);
    expect((player.BattleManager as any)._battleActionsInProgress).toBe(0);
    await request(); expect(battle.player.hp).toBe(321);
    expect(replies().map(p => p.readInt32BE(13))).toEqual([5001, 5001]);
  });
  test.each([
    ['SaveItemData', 'player_items', 2, 'current'],
    ['SaveItemData', 'player_items', 1, 'current'],
    ['SavePetData', 'player_pets', 2, 'current'],
    ['SaveItemData', 'player_items', 2, 'stale'],
    ['SavePetData', 'player_pets', 2, 'stale'],
    ['SaveItemData', 'player_items', 2, 'concurrent'],
    ['SavePetData', 'player_pets', 2, 'concurrent'],
  ] as const)('real %s failure on %s, stock=%s context=%s does not heal after timer recovery/reload', async (method, table, count, context) => {
    const battle = await seed(count), stop = pause(), save = helper[method].bind(helper);
    const pet = player.PetManager.GetPetByCatchTime(caught)!;
    await db.Execute(`CREATE TRIGGER deny_medicine_update BEFORE UPDATE ON ${table} BEGIN SELECT RAISE(FAIL, 'controlled medicine write failure'); END`);
    const spy = jest.spyOn(helper, method).mockImplementation(async (data: any, strict?: boolean) => {
      try {await (save as (d: any, s?: boolean) => Promise<void>)(data, strict);}
      catch (error) {await stop.wait(); throw error;}
    });
    let pending: Promise<void> | undefined, successor: any, snapshot = '';
    try {
      pending = request(); await stop.ready;
      expect(spy).toHaveBeenCalledWith(method === 'SaveItemData' ? player.ItemManager.ItemData : player.PetManager.PetData, true);
      expect(battle.player.hp).toBe(321); // HP is not committed before strict persistence.
      if (context === 'concurrent') {
        player.ItemManager.ItemData.ItemList.push({itemId: 300016, count: 7, expireTime: 0});
        if (method === 'SaveItemData') player.ItemManager.ItemData.ItemList.find(i => i.itemId === 300011)!.count += 3;
        pet.nick = 'independent change';
      } else if (context === 'stale') {
        player.MapManager = new MapManager(player); player.MapSpawnManager = new MapSpawnManager(player);
        OnlineTracker.Instance.PlayerLogin(uid, session()); OnlineTracker.Instance.UpdatePlayerMap(uid, 301);
        jest.spyOn(MapVisibilityService.prototype, 'BroadcastToMap').mockResolvedValue(0);
        jest.spyOn(MapVisibilityService.prototype, 'RefreshMapPlayerLists').mockResolvedValue(0);
        await new LeaveMapHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
        successor = JSON.parse(JSON.stringify(battle)); successor.player.hp = 123;
        (player.BattleManager as any)._pvpService._initializeBattle(successor); snapshot = JSON.stringify(successor);
      }
      stop.release(); await pending;
      expect(battle.player.hp).toBe(321); expect(pet.hp).toBe(321);
      expect((player.BattleManager as any)._petItemInProgress).toBe(false);
      expect((player.BattleManager as any)._battleActionsInProgress).toBe(0);
      if (context === 'stale') {
        expect(replies()).toHaveLength(0); expect(JSON.stringify(successor)).toBe(snapshot);
      } else expect(replies().map(p => p.readInt32BE(13))).toEqual([5001]);
      const expectedCount = method === 'SaveItemData' ? count + (context === 'concurrent' ? 3 : 0) : count - 1;
      expect(player.ItemManager.GetItemCount(300011)).toBe(expectedCount);
      expect((await stored()).pets[0].hp).toBe(321);
      expect((await stored()).items.find((i: any) => i.itemId === 300011)?.count).toBe(method === 'SaveItemData' ? count : count - 1);
      // Recover storage before the 100ms Proxy timer fires; it must not reapply the rejected HP/consumption.
      await db.Execute('DROP TRIGGER deny_medicine_update'); await settle();
      expect((await stored()).pets[0].hp).toBe(321);
      expect((await stored()).items.find((i: any) => i.itemId === 300011)?.count).toBe(expectedCount);
      if (context === 'concurrent') {
        expect((await stored()).pets[0].nick).toBe('independent change');
        expect((await stored()).items.find((i: any) => i.itemId === 300016).count).toBe(7);
      }
      await reload();
      expect(player.ItemManager.GetItemCount(300011)).toBe(expectedCount);
      expect(player.PetManager.GetPetByCatchTime(caught)!.hp).toBe(321);
    } finally {stop.release(); if (pending) await pending; await db.Execute('DROP TRIGGER IF EXISTS deny_medicine_update');}
  });
});
