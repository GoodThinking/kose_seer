import { PlayerDisconnectHandler } from '../../../Server/Packet/Recv/System/PlayerDisconnectHandler';
import { PlayerManager } from '../../Player/PlayerManager';
import { GameEventBus } from '../../Event/GameEventBus';
import { GetPetInfoHandler } from '../../../Server/Packet/Recv/Pet/GetPetInfoHandler';
import { ReadyToFightHandler } from '../../../Server/Packet/Recv/Battle/ReadyToFightHandler';
import { UsePetItemHandler } from '../../../Server/Packet/Recv/Battle/UsePetItemHandler';
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
import { CatchMonsterHandler } from '../../../Server/Packet/Recv/Battle/CatchMonsterHandler';
import { FightNpcMonsterHandler } from '../../../Server/Packet/Recv/Battle/FightNpcMonsterHandler';
import { ChangePetHandler } from '../../../Server/Packet/Recv/Battle/ChangePetHandler';
import { MapManager } from '../../Map/MapManager';
import { IClientSession } from '../../../Server/Packet/IHandler';
import { createDefaultPetInfo, IPetInfo } from '../../../../shared/models/PetModel';
import { GameConfig } from '../../../../shared/config/game/GameConfig';

describe('PvE disconnect HP persistence through real handlers and temporary SQLite', () => {
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
  async function seed(count = 1, capsule = 300001, quantity = 2) {
    await reload();
    player.EventBus = new GameEventBus();
    player.BattleManager = new BattleManager(player);
    player.MapManager = new MapManager(player);
    player.MapSpawnManager = {GetMapOgres: () => [{petId: 8, originalPetId: 8, shiny: 0}], OnBattleEnd: () => {}, OnLeaveMap: () => {}} as any;
    player.MapManager.RegisterEvents(player.EventBus);
    player.BattleManager.RegisterEvents(player.EventBus);
    (player as any)._session.Player = player;
    (player as any)._session.UserID = uid;
    (PlayerManager.GetInstance(new PacketBuilder()) as any)._players.set(uid, player);
    player.PetManager.PetData.PetList = Array.from({length: count}, (_, i) =>
      Object.assign(createDefaultPetInfo(uid, 7), {catchTime: 1700000000 + i, hp: 500, maxHp: 500,
        level: 50, atk: 500, def: 500, speed: 500, isDefault: i === 0, skillArray: [10001]}));
    player.ItemManager.ItemData.ItemList = [{itemId: capsule, count: quantity, expireTime: 0}];
    await helper.SavePetData(player.PetManager.PetData);
    await helper.SaveItemData(player.ItemManager.ItemData);
    await settle();
    await action(new FightNpcMonsterHandler(), 0);
    await action(new ReadyToFightHandler(), 0);
    const battle = player.BattleManager.GetCurrentBattle()!;
    expect(battle).not.toBeNull();
    battle.enemy.hp = 1; // Controlled eligible target; keep the real catch probability engine.
    battle.player.hp = 500;
    const turnService = (player.BattleManager as any)._turnService;
    const realEnemyTurn = turnService.ExecuteEnemyTurn.bind(turnService);
    jest.spyOn(turnService, 'ExecuteEnemyTurn').mockImplementation((active: any) => {
      const rng = Math.random as jest.Mock;
      rng.mockReturnValue(0.1);
      try {return realEnemyTurn(active);} finally {rng.mockReturnValue(0.99);}
    });
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
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'battle-disconnect-'));
    oldDb = Config.Config.database; oldProtocol = Config.Game.clientProtocol;
    Config.Config.database = {type: 'sqlite', path: path.join(directory, 'capture.sqlite')};
    Config.Game.clientProtocol = 'kose';
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.ITEM_CONFIG]) ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
    await ConfigRegistry.Instance.Initialize();
    await db.Initialize();
    await db.Execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY)');
    await db.Execute('INSERT INTO players (user_id) VALUES (?)', [uid]);
    await db.Execute(new Migration012FixAllTables().upSQLite().find(s => s.startsWith('CREATE TABLE IF NOT EXISTS player_pets'))!);
    await db.Execute(new Migration006CreateItems().upSQLite()[0]);
    await db.Execute(new Migration022CreateRewardBoosts().upSQLite()[0]);
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

  async function disconnectAndReload() {
    const raw = new PacketBuilder().Build(10004, uid, 0, Buffer.alloc(0));
    await new PlayerDisconnectHandler().Handle(session(), HeadInfo.Parse(raw, '1')!, raw.subarray(17));
    expect(player.BattleManager.GetCurrentBattle()).toBeNull();
    expect(PlayerManager.GetInstance().GetPlayer(uid)).toBeUndefined();
    expect((player as any)._session.Player).toBeUndefined();
    await reload();return stored();
  }
  async function petInfoHP(catchTime: number) {
    packets.length=0;await action(new GetPetInfoHandler(),catchTime);
    const p=packets.find(p=>p.readUInt32BE(5)===2301)!;expect(p.readInt32BE(13)).toBe(0);return p.readUInt32BE(61);
  }

  test('injury from a failed catch survives disconnect, SQLite reload and GET_PET_INFO', async () => {
    const battle = await seed(1);
    jest.spyOn(Math, 'random').mockReturnValue(0.99);
    await request(300001);
    const hp = battle.player.hp;
    expect(hp).toBeGreaterThan(0);
    expect(hp).toBeLessThan(500);
    const saved = await disconnectAndReload();
    expect(saved.pets[0].hp).toBe(hp);
    expect(await petInfoHP(battle.player.catchTime)).toBe(hp);
    expect(saved.items[0].count).toBe(1);
  });

  test('a healthy replacement injured after failed capture retains HP while the dead pet stays at zero', async () => {
    const battle = await seed(2);
    const oldCatchTime = battle.player.catchTime;
    const replacement = player.PetManager.GetPetsInBag().find(p => p.catchTime !== oldCatchTime)!;
    jest.spyOn(Math, 'random').mockReturnValue(0.99);
    makeNextEnemyCounterLethal();
    await request(300001);
    expect(battle.player.hp).toBe(0);
    expect(player.BattleManager.GetCurrentBattle()).toBe(battle);
    await action(new ChangePetHandler(), replacement.catchTime);
    const hp = battle.player.hp;
    expect(hp).toBeGreaterThan(0);
    expect(hp).toBeLessThan(500);
    const saved = await disconnectAndReload();
    expect(saved.pets.find(p => p.catchTime === oldCatchTime)!.hp).toBe(0);
    expect(saved.pets.find(p => p.catchTime === replacement.catchTime)!.hp).toBe(hp);
    expect(await petInfoHP(replacement.catchTime)).toBe(hp);
  });

  test.each(['before-save', 'after-commit', 'sqlite-failure'] as const)(
    'medicine %s crossing disconnect preserves the storage outcome without refund', async phase => {
      const battle = await seed(1);
      jest.spyOn(Math, 'random').mockReturnValue(0.99);
      await request(300001);
      const injuredHP = battle.player.hp;
      player.ItemManager.ItemData.ItemList.push({itemId: 300011, count: 2, expireTime: 0});
      await helper.SaveItemData(player.ItemManager.ItemData);
      await settle();
      const gate = pause(), save = helper.SavePetData.bind(helper);
      if (phase === 'sqlite-failure') {
        await db.Execute("CREATE TRIGGER reject_medicine_pet BEFORE UPDATE ON player_pets BEGIN SELECT RAISE(ABORT, 'test strict medicine save fault'); END");
      }
      jest.spyOn(helper, 'SavePetData').mockImplementationOnce(async (data, strict) => {
        expect(strict).toBe(true);
        if (phase === 'after-commit') {
          await save(data, strict);
          await gate.wait();
          return;
        }
        await gate.wait();
        try { await save(data, strict); }
        finally { if (phase === 'sqlite-failure') await db.Execute('DROP TRIGGER reject_medicine_pet'); }
      });
      const body = Buffer.alloc(12);
      body.writeUInt32BE(battle.player.catchTime);
      body.writeUInt32BE(300011, 4);
      const medicine = new UsePetItemHandler().Handle(session(), new HeadInfo(), body);
      let logout: ReturnType<typeof disconnectAndReload> | undefined;
      try {
        await Promise.race([gate.entered, medicine.then(() => { throw new Error('Medicine returned before strict pet save'); })]);
        let finished = false;
        logout = disconnectAndReload().then(saved => { finished = true; return saved; });
        await new Promise<void>(resolve => setImmediate(resolve));
        expect(finished).toBe(false);
        gate.release();
        await medicine;
        const saved = await logout;
        const expectedHP = phase === 'sqlite-failure' ? injuredHP : 500;
        expect(saved.pets[0].hp).toBe(expectedHP);
        expect(packets.filter(p => p.readUInt32BE(5) === 2406)).toHaveLength(0);
        expect(await petInfoHP(battle.player.catchTime)).toBe(expectedHP);
        expect(saved.items.find((i: any) => i.itemId === 300011).count).toBe(1);
        expect(saved.items.find((i: any) => i.itemId === 300001).count).toBe(1);
      } finally {
        gate.release();
        await Promise.allSettled([medicine, logout]);
      }
    }
  );

  test('strict final logout save failure rejects, retains injury intent and succeeds on retry', async () => {
    const battle = await seed(1);
    jest.spyOn(Math, 'random').mockReturnValue(0.99);
    await request(300001);
    const hp = battle.player.hp;
    await db.Execute("CREATE TRIGGER reject_logout_pet BEFORE UPDATE ON player_pets BEGIN SELECT RAISE(ABORT, 'test strict logout save fault'); END");
    const raw = new PacketBuilder().Build(10004, uid, 0, Buffer.alloc(0));
    try {
      // The native SQLite binding can retain an Error prototype from an earlier Jest VM.
      await expect(new PlayerDisconnectHandler().Handle(session(), HeadInfo.Parse(raw, '1')!, Buffer.alloc(0))).rejects.toMatchObject({
        message: 'test strict logout save fault', code: 'SQLITE_CONSTRAINT_TRIGGER',
      });
      expect(PlayerManager.GetInstance().GetPlayer(uid)).toBe(player);
      expect((player as any)._session.Player).toBe(player);
      expect(player.PetManager.GetPetByCatchTime(battle.player.catchTime)!.hp).toBe(hp);
    } finally {
      await db.Execute('DROP TRIGGER reject_logout_pet');
    }
    const saved = await disconnectAndReload();
    expect(saved.pets[0].hp).toBe(hp);
    expect(await petInfoHP(battle.player.catchTime)).toBe(hp);
    expect(saved.items[0].count).toBe(1);
  });
});
