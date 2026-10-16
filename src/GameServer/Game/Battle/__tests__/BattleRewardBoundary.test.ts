import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import '../../../../DataBase/loaders/DataLoader';
import { DatabaseManager } from '../../../../DataBase/DatabaseManager';
import { DatabaseHelper } from '../../../../DataBase/DatabaseHelper';
import { PlayerRepository } from '../../../../DataBase/repositories/Player/PlayerRepository';
import { Migration012FixAllTables } from '../../../../DataBase/migrations/scripts/012_fix_all_tables';
import { Migration006CreateItems } from '../../../../DataBase/migrations/scripts/006_create_items';
import { Migration022CreateRewardBoosts } from '../../../../DataBase/migrations/scripts/022_create_reward_boosts';
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
import { GetPetExperienceFields } from '../../Pet/PetExperienceProjection';
import { PetGetExpHandler } from '../../../Server/Packet/Recv/Pet/PetGetExpHandler';
import { GetPetInfoHandler } from '../../../Server/Packet/Recv/Pet/GetPetInfoHandler';
import { UseStudyItemHandler } from '../../../Server/Packet/Recv/Item/UseStudyItemHandler';
import { PlayerInfoToLoginProto } from '../../../../shared/models/PlayerConverter';

describe('reward boundaries through real battle handlers and SQLite', () => {
  const uid = 690001, catchTime = 1700090001;
  const observations: any[] = [];
  const baseline = process.env.BATTLE_BOUNDARY_BASELINE === '1';
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
    const [money] = await db.Query<{coins: number; allocatable_exp: number; learn_times: number}>(
      'SELECT coins, allocatable_exp, learn_times FROM players WHERE user_id = ?', [uid]);
    return {pets: JSON.parse(p.pet_list) as IPetInfo[], items: JSON.parse(i.item_list), coins: money.coins,
      pool: money.allocatable_exp, learnTimes: money.learn_times};
  }
  async function seed(exp = 0, coins = 100) {
    player.BattleManager = new BattleManager(player);
    player.Data.coins = coins;
    player.Data.PublishLearnTimes(0);
    await db.Execute('UPDATE players SET coins = ?, learn_times = 0 WHERE user_id = ?', [coins, uid]);
    player.PetManager.PetData.PetList = [Object.assign(createDefaultPetInfo(uid, 7), {
      catchTime, level: 100, exp, hp: 500, maxHp: 500, atk: 500, def: 500, speed: 500,
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
    player.Data.PublishLearnTimes((await stored()).learnTimes);
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
    Config.Game.clientProtocol = 'kose'; Config.Game.cumulativePetExperience = true;
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG, ConfigKeys.ITEM_CONFIG]) {
      ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
    }
    ConfigRegistry.Instance.Register(ConfigKeys.NATURES_CONFIG, ConfigPaths[ConfigKeys.NATURES_CONFIG], ConfigType.JSON);
    await ConfigRegistry.Instance.Initialize(); await db.Initialize();
    // Minimal real currency columns; pets/items use the repository's full SQLite DDL.
    await db.Execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY, coins INTEGER NOT NULL, energy INTEGER NOT NULL, allocatable_exp INTEGER NOT NULL, learn_times INTEGER NOT NULL DEFAULT 0)');
    await db.Execute('INSERT INTO players VALUES (?, 100, 0, 2147483647, 0)', [uid]);
    await db.Execute(new Migration012FixAllTables().upSQLite().find(s => s.startsWith('CREATE TABLE IF NOT EXISTS player_pets'))!);
    await db.Execute(new Migration006CreateItems().upSQLite()[0]);
    await db.Execute(new Migration022CreateRewardBoosts().upSQLite()[0]);
    player = Object.create(PlayerInstance.prototype);
    Object.defineProperty(player, 'Uid', {value: uid});
    Object.assign(player, {Data: new PlayerData(Object.assign(createDefaultPlayerInfo(uid, 'VictoryTest'), {mapID: 301, coins: 100, allocatableExp: 2147483647})),
      _playerRepo: new PlayerRepository(), EventBus: new GameEventBus(),
      _session: {Socket: {write: (b: Buffer) => packets.push(Buffer.from(b))}, Player: player}, _packetBuilder: new PacketBuilder(),
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
    if (process.env.BATTLE_BOUNDARY_RESULT_PATH) {
      fs.writeFileSync(process.env.BATTLE_BOUNDARY_RESULT_PATH, JSON.stringify({baseline, database: directory, observations}, null, 2) + '\n');
    }
    fs.rmSync(directory, {recursive: true, force: true});
  });

  const currentBase = () => GetPetExperienceFields({petId: 7, level: 100, exp: 0}, 'kose').currentLvExp;
  async function replay() {
    // A declined reward does not supply the strict pet save; settle the existing HP debounce first.
    await settle();
    const before = await stored(); await skill(); await reload();
    player.BattleManager = new BattleManager(player); await skill();
    expect(await stored()).toEqual(before); return before;
  }
  async function detail() {
    const body = Buffer.alloc(4); body.writeUInt32BE(catchTime);
    await new GetPetInfoHandler().Handle(session(), new HeadInfo(), body);
    expect(commandPackets(2301).at(-1)!.readInt32BE(13)).toBe(0);
  }
  const settlement = () => events.find(e => e.type === BattleEventType.BATTLE_END)?.extra;
  test('healthy level100 victory with full pool persists once and reloads', async () => {
    await seed(); await skill(); const after = await replay();
    expect(after.pets[0]).toMatchObject({level: 100, exp: 50, evSpAtk: 1, evSpeed: 1});
    expect(after.coins).toBe(125); expect(after.pool).toBe(2147483647);
    await new PetGetExpHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
    expect(commandPackets(2319).at(-1)!.readUInt32BE(17)).toBe(2147483647);
    expect(after.items).toMatchObject([{itemId: 300001, count: 2}]);
    expect(settlement().rewardStatus).toBe('complete');
    observations.push({case: 'healthy-lv100-full-pool', exp: after.pets[0].exp, coins: after.coins, pool: after.pool, replayAndReload: 'unchanged'});
  });
  test('configured study item commits inventory and effect before doubling one victory yield', async () => {
    await seed();
    player.ItemManager.ItemData.ItemList = [{itemId: 300035, count: 2, expireTime: 0}];
    await helper.SaveItemData(player.ItemManager.ItemData, true);
    const use = Buffer.alloc(4); use.writeUInt32BE(300035);
    await new UseStudyItemHandler().Handle(session(), new HeadInfo(), use);
    expect(commandPackets(2332).at(-1)!.readInt32BE(13)).toBe(0);
    expect(player.ItemManager.GetItemCount(300035)).toBe(1);
    expect(player.Data.learnTimes).toBe(30);
    expect((await stored())).toMatchObject({items: [{itemId: 300035, count: 1}], learnTimes: 30});

    await skill();
    const after = await stored();
    expect(after.pets[0]).toMatchObject({evSpAtk: 2, evSpeed: 2});
    expect(after.learnTimes).toBe(29);
    expect(player.Data.learnTimes).toBe(29);
  });

  test('failed study item persistence leaves inventory and effect unchanged', async () => {
    await seed();
    player.ItemManager.ItemData.ItemList = [{itemId: 300110, count: 1, expireTime: 0}];
    await helper.SaveItemData(player.ItemManager.ItemData, true);
    await db.Execute("CREATE TRIGGER deny_study_item BEFORE UPDATE ON players BEGIN SELECT RAISE(ABORT, 'study rejected'); END");
    try {
      const use = Buffer.alloc(4); use.writeUInt32BE(300110);
      await new UseStudyItemHandler().Handle(session(), new HeadInfo(), use);
      expect(commandPackets(2332).at(-1)!.readInt32BE(13)).toBe(5000);
      expect(player.ItemManager.GetItemCount(300110)).toBe(1);
      expect(player.Data.learnTimes).toBe(0);
      expect(await stored()).toMatchObject({items: [{itemId: 300110, count: 1}], learnTimes: 0});
    } finally {
      await db.Execute('DROP TRIGGER deny_study_item');
    }
  });
  test('healthy exact cumulative experience uint32 boundary serializes after reload', async () => {
    const initial = 0xffffffff - currentBase() - 50;
    await seed(initial); await skill(); const after = await replay();
    expect(GetPetExperienceFields(after.pets[0], 'kose').exp).toBe(0xffffffff); await detail();
    observations.push({case: 'healthy-exact-exp-uint32', initial, persisted: after.pets[0].exp, projected: 0xffffffff, coins: after.coins});
  });
  test('healthy crossing experience uint32 does not commit unreadable state', async () => {
    const initial = 0xffffffff - currentBase() - 25;
    await seed(initial); await skill(); const after = await replay();
    expect(settlement()).toMatchObject({rewardStatus: 'failed', rewardFailedStage: 'experience'});
    expect(after.coins).toBe(100); expect(after.items).toEqual([]); expect(after.pool).toBe(2147483647);
    if (baseline) {
      expect(after.pets[0].exp).toBe(initial + 50);
      await expect(detail()).rejects.toThrow('exceeds uint32');
    } else {expect(after.pets[0].exp).toBe(initial); await detail();}
    observations.push({case: 'healthy-exp-overflow', initial, persisted: after.pets[0].exp, settlement: settlement(), reloadedDetail: baseline ? 'throws projection error' : 'success'});
  });
  test('healthy exact coins uint32 boundary survives login serialization', async () => {
    await seed(0, 0xffffffff - 25); await skill(); const after = await replay();
    expect(after.coins).toBe(0xffffffff); expect(() => PlayerInfoToLoginProto(player.Data).serialize('kose')).not.toThrow();
    observations.push({case: 'healthy-exact-coins-uint32', coins: after.coins, exp: after.pets[0].exp, loginSerialize: 'success'});
  });
  test('healthy crossing coins uint32 does not persist an unencodable wallet', async () => {
    const initial = 0xffffffff - 10;
    await seed(0, initial); await skill(); const after = await replay(); expect(after.pets[0].exp).toBe(50);
    if (baseline) {
      expect(after.coins).toBe(initial + 25); expect(settlement().rewardStatus).toBe('complete');
      expect(() => PlayerInfoToLoginProto(player.Data).serialize('kose')).toThrow('out of range');
    } else {
      expect(after.coins).toBe(initial); expect(settlement()).toMatchObject({rewardStatus: 'partial', rewardFailedStage: 'coins'});
      expect(after.items).toEqual([]); expect(() => PlayerInfoToLoginProto(player.Data).serialize('kose')).not.toThrow();
    }
    observations.push({case: 'healthy-coins-overflow', initial, coins: after.coins, exp: after.pets[0].exp, settlement: settlement(), loginSerialize: baseline ? 'throws RangeError' : 'success'});
  });
  test('legacy raw kose experience is validated before commit too', async () => {
    Config.Game.cumulativePetExperience = false;
    try {
      await seed(0xffffffff - 25); await skill(); const after = await replay();
      expect(after.pets[0].exp).toBe(0xffffffff - 25);
      expect(after.coins).toBe(100); expect(settlement()).toMatchObject({rewardStatus: 'failed', rewardFailedStage: 'experience'});
      await detail();
      observations.push({case: 'healthy-raw-kose-exp-overflow', exp: after.pets[0].exp, coins: after.coins, reloadedDetail: 'success'});
    } finally {Config.Game.cumulativePetExperience = true;}
  });
  test('already corrupted stored pet experience is explicitly rejected without zero/reset', async () => {
    const initial = 0xffffffff - currentBase() + 1;
    await seed(initial); await skill(); const after = await replay();
    expect(after.pets[0].exp).toBe(initial); expect(after.coins).toBe(100);
    expect(settlement()).toMatchObject({rewardStatus: 'failed', rewardFailedStage: 'experience'});
    await expect(detail()).rejects.toThrow('exceeds uint32');
    observations.push({case: 'preexisting-corrupt-pet', exp: after.pets[0].exp, unchanged: true, explicitDetailError: true, settlement: settlement()});
  });
  test('already corrupted stored coins are rejected without clipping or silent repair', async () => {
    const initial = 0x100000000;
    await seed(0, initial); await skill(); const after = await replay();
    expect(after.coins).toBe(initial); expect(after.pets[0].exp).toBe(50);
    expect(settlement()).toMatchObject({rewardStatus: 'partial', rewardFailedStage: 'coins'});
    expect(() => PlayerInfoToLoginProto(player.Data).serialize('kose')).toThrow('out of range');
    observations.push({case: 'preexisting-corrupt-coins', coins: after.coins, unchanged: true, explicitLoginError: true, settlement: settlement()});
  });
  test('actual repository atomic predicate admits only one concurrent near-boundary increment', async () => {
    await seed(0, 0xffffffff - 30);
    const results = await Promise.all([new PlayerRepository().AddCurrency(uid, undefined, 25), new PlayerRepository().AddCurrency(uid, undefined, 25)]);
    expect(results.filter(Boolean)).toHaveLength(1); expect((await stored()).coins).toBe(0xffffffff - 5);
    observations.push({case: 'atomic-concurrent-coin-boundary', results, coins: (await stored()).coins});
    await db.Execute('UPDATE players SET coins=0 WHERE user_id=?',[uid]);
    expect(await new PlayerRepository().AddCurrency(uid,undefined,-1)).toBe(false);
    expect(await new PlayerRepository().AddCurrency(uid,undefined,1.5)).toBe(false);
    expect((await stored()).coins).toBe(0);
  });
  test('injected SQLite write failure remains separate and cannot replay rewards', async () => {
    await seed(); await db.Execute("CREATE TRIGGER reject_reward_save BEFORE UPDATE OF pet_list ON player_pets WHEN json_extract(NEW.pet_list, '$[0].exp') != json_extract(OLD.pet_list, '$[0].exp') BEGIN SELECT RAISE(ABORT, 'controlled sqlite reward error'); END");
    try {
      await skill(); const after = await replay(); expect(after.pets[0].exp).toBe(0); expect(after.coins).toBe(100); expect(after.items).toEqual([]);
      expect(settlement()).toMatchObject({rewardStatus: 'failed', rewardFailedStage: 'experience'});
      observations.push({case: 'injected-sqlite-failure', exp: after.pets[0].exp, coins: after.coins, settlement: settlement()});
    } finally {await db.Execute('DROP TRIGGER reject_reward_save');}
  });
});
