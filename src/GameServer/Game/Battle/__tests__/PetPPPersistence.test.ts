import { ChallengeBossHandler } from '../../../Server/Packet/Recv/Battle/ChallengeBossHandler';
import { PetEvolutionHandler } from '../../../Server/Packet/Recv/Pet/PetEvolutionHandler';
import { PetSetExpHandler } from '../../../Server/Packet/Recv/Pet/PetSetExpHandler';
import { PetSkillSwitchHandler } from '../../../Server/Packet/Recv/Pet/PetSkillSwitchHandler';
import { PetOneCureHandler } from '../../../Server/Packet/Recv/Pet/PetOneCureHandler';
import { PetCureHandler } from '../../../Server/Packet/Recv/Pet/PetCureHandler';
import { PetStudySkillHandler } from '../../../Server/Packet/Recv/Pet/PetStudySkillHandler';
import { SkillSortHandler } from '../../../Server/Packet/Recv/Pet/SkillSortHandler';
import { CatchMonsterHandler } from '../../../Server/Packet/Recv/Battle/CatchMonsterHandler';
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
import { EscapeFightHandler } from '../../../Server/Packet/Recv/Battle/EscapeFightHandler';
import { GetPetInfoHandler } from '../../../Server/Packet/Recv/Pet/GetPetInfoHandler';
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

describe('UAT-004 persistent PVE skill PP through real handlers and temporary SQLite', () => {
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
    player.Data.mapID = 301; player.Data.coins = 100; player.Data.vip = 0;
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
    await db.Execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY, coins INTEGER NOT NULL, energy INTEGER NOT NULL, gold INTEGER NOT NULL DEFAULT 0, allocatable_exp INTEGER NOT NULL DEFAULT 0)');
    await db.Execute('INSERT INTO players (user_id,coins,energy) VALUES (?, 100, 0)', [uid]);
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


  test.each(['kose', 'xin-20261013'] as const)('%s 35 → 33 survives escape, real pet query and a new battle/reload', async protocol => {
    Config.Game.clientProtocol = protocol;
    const battle = await seed();
    await skill(); await skill();
    expect(battle.player.skillPP).toEqual([33]);
    await new EscapeFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
    await reload();
    const body = Buffer.alloc(4); body.writeUInt32BE(catchTime);
    await new GetPetInfoHandler().Handle(session(), new HeadInfo(), body);
    expect(commandPackets(2301).slice(-1)[0].readInt32BE(13)).toBe(0);
    expect(commandPackets(2301).slice(-1)[0].readUInt32BE(protocol === 'kose' ? 121 : 153)).toBe(33);
    await new FightNpcMonsterHandler().Handle(session(), new HeadInfo(), Buffer.alloc(4));
    await new ReadyToFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
    expect(player.BattleManager.GetCurrentBattle()!.player.skillPP).toEqual([33]);
    expect((await stored()).pets.find(p => p.catchTime === catchTime)).toMatchObject({skillPP: {'10004': 33}});
  });

  test('victory and disconnect preserve 33 and same-battle switching preserves each skill identity', async () => {
    const b = await seed(1, true);
    await skill(); await skill(); await change(catchTime + 1); await skill(10001);
    await change(catchTime); expect(b.player.skillPP).toEqual([33]);
    b.enemy.hp = 1; await skill();
    expect(player.BattleManager.GetCurrentBattle()).toBeNull();
    await reload();
    expect((await stored()).pets.find(p => p.catchTime === catchTime)!.skillPP![10004]).toBe(32);
    expect((await stored()).pets.find(p => p.catchTime === catchTime + 1)!.skillPP![10001]).toBe(34);
    await new FightNpcMonsterHandler().Handle(session(), new HeadInfo(), Buffer.alloc(4));
    await new ReadyToFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
    expect(player.BattleManager.GetCurrentBattle()!.player.skillPP).toEqual([32]);
    await player.BattleManager.OnLogout(); await helper.SavePetData(player.PetManager.PetData, true);
    await reload(); expect(player.PetManager.GetPetByCatchTime(catchTime)!.skillPP![10004]).toBe(32);
  });

  test('legacy missing PP starts full, persisted zero cannot execute or send success', async () => {
    const b = await seed(); expect(b.player.skillPP).toEqual([35]);
    const pet = player.PetManager.GetPetByCatchTime(catchTime)!;
    pet.skillPP = {10004: 0}; await helper.SavePetData(player.PetManager.PetData, true);
    b.player.skillPP = [0]; const before = await stored(), turn = b.turn;
    await skill();
    expect(commandPackets(2405).slice(-1)[0].readInt32BE(13)).toBe(5001);
    expect(commandPackets(2505)).toHaveLength(0); expect(b.turn).toBe(turn);
    expect(await stored()).toEqual(before);
    await player.BattleManager.OnLogout(); await reload();
    await new FightNpcMonsterHandler().Handle(session(), new HeadInfo(), Buffer.alloc(4));
    await new ReadyToFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
    expect(player.BattleManager.GetCurrentBattle()!.player.skillPP).toEqual([0]);
  });

  test('actual SQLite PP debit failure publishes no success and no attack or stored/cache change', async () => {
    const b = await seed(), before = await stored();
    await db.Execute("CREATE TRIGGER deny_pp BEFORE UPDATE ON player_pets BEGIN SELECT RAISE(ABORT, 'PP write rejected'); END");
    try {
      await skill(); expect(commandPackets(2405).slice(-1)[0].readInt32BE(13)).toBe(5000);
      expect(commandPackets(2505)).toHaveLength(0); expect(b.player.skillPP).toEqual([35]);
      await settle(); expect(await stored()).toEqual(before);
      expect(player.PetManager.GetPetByCatchTime(catchTime)!.skillPP).toBeUndefined();
    } finally {await db.Execute('DROP TRIGGER deny_pp');}
  });

  test.each(['kose', 'xin-20261013'] as const)('%s PP medicine saves restored PP and exactly one inventory unit together', async protocol => {
    Config.Game.clientProtocol = protocol; const b = await seed(1);
    await skill(); await skill(); const hp = player.PetManager.GetPetByCatchTime(catchTime)!.hp;
    await ppItem(); expect(b.player.skillPP).toEqual([35]);
    expect(commandPackets(2406).slice(-1)[0].readInt32BE(13)).toBe(0);
    expect(player.PetManager.GetPetByCatchTime(catchTime)!.hp).toBe(hp);
    expect((await stored()).pets[0].skillPP![10004]).toBe(35);
    expect(((await stored()).items.find((i: any) => i.itemId === 300016)?.count ?? 0)).toBe(0);
    await player.BattleManager.OnLogout(); await reload();
    expect(player.PetManager.GetPetByCatchTime(catchTime)!.skillPP![10004]).toBe(35);
    expect(player.ItemManager.GetItemCount(300016)).toBe(0);
  });

  test.each(['player_items', 'player_pets'])('PP medicine %s SQLite rejection rolls back both resources', async table => {
    const b = await seed(2); await skill(); await skill(); const before = await stored();
    await db.Execute(`CREATE TRIGGER deny_pp_medicine BEFORE UPDATE ON ${table} BEGIN SELECT RAISE(ABORT, 'PP medicine rejected'); END`);
    try {
      await ppItem(); expect(commandPackets(2406).slice(-1)[0].readInt32BE(13)).toBe(5001);
      expect(b.player.skillPP).toEqual([33]); expect(player.ItemManager.GetItemCount(300016)).toBe(2);
      await settle(); expect(await stored()).toEqual(before);
    } finally {await db.Execute('DROP TRIGGER deny_pp_medicine');}
  });

  test.each([false, true])('single recovery restores HP and PP atomically VIP=%s with original fee', async vip => {
    const b = await seed(); await skill(); const pet = player.PetManager.GetPetByCatchTime(catchTime)!;
    await new EscapeFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
    pet.hp = pet.maxHp - 5; await helper.SavePetData(player.PetManager.PetData, true);
    player.Data.vip = vip ? 1 : 0;
    const body = Buffer.alloc(8); body.writeUInt32BE(catchTime);
    await new PetOneCureHandler().Handle(session(), new HeadInfo(), body);
    expect(commandPackets(2310).slice(-1)[0].readInt32BE(13)).toBe(0);
    expect((await stored()).coins).toBe(vip ? 100 : 80);
    expect((await stored()).pets[0]).toMatchObject({hp: pet.maxHp, skillPP: {'10004': 35}});
    expect(b.player.skillPP).toEqual([34]); expect(player.BattleManager.GetCurrentBattle()).toBeNull();
    await player.BattleManager.OnLogout(); await reload();
    expect(player.PetManager.GetPetByCatchTime(catchTime)!.skillPP![10004]).toBe(35);
  });

  test('single recovery SQLite pet failure charges nothing and leaves HP/PP unchanged', async () => {
    await seed(); await skill();
    await new EscapeFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
    const before = await stored();
    await db.Execute("CREATE TRIGGER deny_cure BEFORE UPDATE ON player_pets BEGIN SELECT RAISE(ABORT, 'Cure rejected'); END");
    const body = Buffer.alloc(8); body.writeUInt32BE(catchTime);
    try {
      await new PetOneCureHandler().Handle(session(), new HeadInfo(), body);
      expect(commandPackets(2310).slice(-1)[0].readInt32BE(13)).toBe(5000);
      expect(player.Data.coins).toBe(100); await settle(); expect(await stored()).toEqual(before);
    } finally {await db.Execute('DROP TRIGGER deny_cure');}
  });

  test('all-bag recovery updates both pets in one save and preserves zero until explicit cure', async () => {
    await seed(); await skill(); await change(catchTime + 1); await skill(10001);
    await new EscapeFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
    await new PetCureHandler().Handle(session(), new HeadInfo(), Buffer.alloc(4));
    expect(commandPackets(2306).slice(-1)[0].readInt32BE(13)).toBe(0);
    expect((await stored()).pets.map(p => p.skillPP)).toEqual([{'10004': 35}, {'10001': 35}]);
    expect((await stored()).coins).toBe(100);
  });

  test('study/sort retain PP by skill ID, new skill starts full, failed study publishes neither slot nor PP', async () => {
    Config.Game.clientProtocol = 'kose'; await seed();
    const pet = player.PetManager.GetPetByCatchTime(catchTime)!;
    const raw = GameConfig.GetPetById(pet.petId)!.LearnableMoves!.Move;
    const moves = Array.isArray(raw) ? raw : raw ? [raw] : []; const learned = moves.find(v => v.ID !== 10004 && v.LearningLv <= pet.level)!;
    expect(learned).toBeTruthy(); pet.skillArray = [10004, learned.ID]; pet.skillPP = {10004: 0, [learned.ID]: 2};
    await helper.SavePetData(player.PetManager.PetData, true);
    const sorted = Buffer.alloc(20); [catchTime, learned.ID, 10004, 0, 0].forEach((v,i) => sorted.writeUInt32BE(v,i*4));
    await new SkillSortHandler().Handle(session(), new HeadInfo(), sorted);
    expect(commandPackets(2328).slice(-1)[0].readInt32BE(13)).toBe(0);
    expect((await stored()).pets[0].skillPP).toEqual({10004: 0, [learned.ID]: 2});
    const another = moves.find(v => !pet.skillArray.includes(v.ID) && v.LearningLv <= pet.level)!; expect(another).toBeTruthy();
    const body = Buffer.alloc(20); [catchTime, 1, 1, 10004, another.ID].forEach((v,i) => body.writeUInt32BE(v,i*4));
    const before = await stored(); await db.Execute("CREATE TRIGGER deny_study BEFORE UPDATE ON player_pets BEGIN SELECT RAISE(ABORT, 'Study rejected'); END");
    try {await new PetStudySkillHandler().Handle(session(), new HeadInfo(), body); expect(await stored()).toEqual(before); expect(pet.skillPP).toEqual(before.pets[0].skillPP);}
    finally {await db.Execute('DROP TRIGGER deny_study');}
    await new PetStudySkillHandler().Handle(session(), new HeadInfo(), body);
    expect(pet.skillPP).toEqual({[learned.ID]: 2, [another.ID]: GameConfig.GetSkillById(another.ID)!.MaxPP});
  });

  test.each([false, true])('actual capture outcome success=%s preserves the prior PP debit after reload', async success => {
    const b = await seed(); await skill(); await skill();
    player.ItemManager.ItemData.ItemList.push({itemId:300001,count:2,expireTime:0});
    await helper.SaveItemData(player.ItemManager.ItemData, true);
    b.enemy.hp = 1; jest.spyOn(Math, 'random').mockReturnValue(success ? 0.001 : 0.999999);
    const body = Buffer.alloc(4); body.writeUInt32BE(300001);
    await new CatchMonsterHandler().Handle(session(), new HeadInfo(), body);
    expect(commandPackets(2409).slice(-1)[0].readInt32BE(13)).toBe(0);
    expect(commandPackets(2409).slice(-1)[0].readUInt32BE(17) > 0).toBe(success);
    if (!success) await new EscapeFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
    await reload(); expect(player.PetManager.GetPetByCatchTime(catchTime)!.skillPP![10004]).toBe(33);
    expect(player.ItemManager.GetItemCount(300001)).toBe(1);
  });

  test('pending committed PP debit crossing actual logout keeps cost but emits no stale turn', async () => {
    const b = await seed(); let entered!: () => void, release!: () => void;
    const ready = new Promise<void>(r => entered=r), gate = new Promise<void>(r => release=r);
    const save = helper.SavePetData.bind(helper);
    jest.spyOn(helper, 'SavePetData').mockImplementationOnce(async(data, strict) => {await save(data,strict); entered(); await gate;});
    const pending = skill(); await ready;
    const logout = player.BattleManager.OnLogout();
    try {release(); await Promise.all([pending,logout]);}
    finally {release(); await pending;}
    expect(commandPackets(2405)).toHaveLength(0); expect(commandPackets(2505)).toHaveLength(0);
    await helper.SavePetData(player.PetManager.PetData, true); await reload();
    expect(player.PetManager.GetPetByCatchTime(catchTime)!.skillPP![10004]).toBe(34);
  });

  test('manual and allocation evolution preserve old skill zero and only initialize new skill IDs', async () => {
    Config.Game.clientProtocol='xin-20261013'; await seed();
    let pet = player.PetManager.GetPetByCatchTime(catchTime)!;
    pet.level=15; pet.exp=PetCalculator.CalculateExpForLevel(16,4)-1; pet.skillPP={10004:0};
    await helper.SavePetData(player.PetManager.PetData,true);
    player.Data.allocatableExp=100; await db.Execute('UPDATE players SET allocatable_exp=100 WHERE user_id=?',[uid]);
    const exp=Buffer.alloc(8); exp.writeUInt32BE(catchTime);exp.writeUInt32BE(2,4);
    await new PetSetExpHandler().Handle(session(),new HeadInfo(),exp);
    expect(commandPackets(2318).slice(-1)[0].readInt32BE(13)).toBe(0);
    expect(pet.level).toBe(16);expect(pet.petId).toBe(5);expect(pet.skillPP![10004]).toBe(0);
    for(const id of pet.skillArray.filter(id=>id!==10004))expect(pet.skillPP![id]).toBe(GameConfig.GetSkillById(id)!.MaxPP);
    await reload();expect(player.PetManager.GetPetByCatchTime(catchTime)!.skillPP![10004]).toBe(0);
    await seed();pet=player.PetManager.GetPetByCatchTime(catchTime)!;pet.level=16;pet.skillPP={10004:0};await helper.SavePetData(player.PetManager.PetData,true);
    const body=Buffer.alloc(8);body.writeUInt32BE(catchTime);body.writeUInt32BE(1,4);const before=await stored();
    await db.Execute("CREATE TRIGGER deny_evolve BEFORE UPDATE ON player_pets BEGIN SELECT RAISE(ABORT, 'Evolution rejected'); END");
    try {await new PetEvolutionHandler().Handle(session(),new HeadInfo(),body);expect(commandPackets(2314).slice(-1)[0].readInt32BE(13)).toBe(5000);expect(await stored()).toEqual(before);expect(pet.petId).toBe(4);expect(pet.skillPP![10004]).toBe(0);}
    finally {await db.Execute('DROP TRIGGER deny_evolve');}
    await new PetEvolutionHandler().Handle(session(),new HeadInfo(),body);
    expect(pet.petId).toBe(5);expect(pet.skillPP![10004]).toBe(0);
  });

  test('relearning a configured replacement starts it full and retains the other equipped skill PP', async () => {
    await seed();const pet=player.PetManager.GetPetByCatchTime(catchTime)!;const raw=GameConfig.GetPetById(pet.petId)!.LearnableMoves!.Move;
    const moves=Array.isArray(raw)?raw:raw?[raw]:[];const learned=moves.find(v=>v.ID!==10004&&v.LearningLv<=pet.level)!;
    pet.skillArray=[10004];pet.skillPP={10004:0};await helper.SavePetData(player.PetManager.PetData,true);
    const body=Buffer.alloc(20);[catchTime,0,0,10004,learned.ID].forEach((v,i)=>body.writeUInt32BE(v,i*4));
    await new PetSkillSwitchHandler().Handle(session(),new HeadInfo(),body);
    expect(commandPackets(2312).slice(-1)[0].readInt32BE(13)).toBe(0);
    expect(pet.skillPP).toEqual({[learned.ID]:GameConfig.GetSkillById(learned.ID)!.MaxPP});
  });

  test('persisted zero restores only configured PP medicine amount at full HP; explicit cure then restores the rest', async () => {
    const b=await seed(2),pet=player.PetManager.GetPetByCatchTime(catchTime)!;
    pet.skillPP={10004:0};b.player.skillPP=[0];await helper.SavePetData(player.PetManager.PetData,true);
    await ppItem();expect(b.player.skillPP).toEqual([5]);expect((await stored()).pets[0].skillPP![10004]).toBe(5);
    expect(player.ItemManager.GetItemCount(300016)).toBe(1);
    await new EscapeFightHandler().Handle(session(),new HeadInfo(),Buffer.alloc(0));
    const cure=Buffer.alloc(8);cure.writeUInt32BE(catchTime);
    await new PetOneCureHandler().Handle(session(),new HeadInfo(),cure);
    expect(commandPackets(2310).slice(-1)[0].readInt32BE(13)).toBe(0);
    expect((await stored()).coins).toBe(80);expect(pet.skillPP![10004]).toBe(35);
  });

  test('PP medicine waiting for an ordinary inventory mutation is invalidated by logout before consumption', async () => {
    await seed();await skill();const before=await stored();const release=player.ItemManager.ItemData.BeginMutation()!;
    const medicine=ppItem();const logout=player.BattleManager.OnLogout();
    release();await Promise.all([medicine,logout]);
    expect(commandPackets(2406)).toHaveLength(0);expect(await stored()).toEqual(before);
    expect(player.BattleManager.GetCurrentBattle()).toBeNull();
  });

  test('actual SQLite medicine readback corruption rolls back PP and inventory without false success', async () => {
    const b=await seed();await skill();const before=await stored();
    await db.Execute("CREATE TRIGGER corrupt_pp AFTER UPDATE ON player_pets BEGIN UPDATE player_pets SET pet_list=OLD.pet_list WHERE owner_id=NEW.owner_id; END");
    try {await ppItem();expect(commandPackets(2406).slice(-1)[0].readInt32BE(13)).toBe(5001);expect(b.player.skillPP).toEqual([34]);expect(await stored()).toEqual(before);}
    finally {await db.Execute('DROP TRIGGER corrupt_pp');}
  });

  test('the real fresh-boss PVE handler also starts with stored PP instead of max', async () => {
    await seed();await skill();await skill();
    await new EscapeFightHandler().Handle(session(),new HeadInfo(),Buffer.alloc(0));
    player.Data.mapID=515;const body=Buffer.alloc(4);
    await new ChallengeBossHandler().Handle(session(),new HeadInfo(),body);
    expect(commandPackets(2411).slice(-1)[0]?.readInt32BE(13)).toBe(0);
    expect(player.BattleManager.GetCurrentBattle()!.player.skillPP).toEqual([33]);
  });

  test('a real skill replacement rejects the stale battle skill and medicine without resurrecting forgotten PP', async () => {
    await seed();await skill();const pet=player.PetManager.GetPetByCatchTime(catchTime)!;
    const raw=GameConfig.GetPetById(pet.petId)!.LearnableMoves!.Move;
    const moves=Array.isArray(raw)?raw:raw?[raw]:[];
    const learned=moves.find(v=>v.ID!==10004&&v.LearningLv<=pet.level)!;
    const body=Buffer.alloc(20);[catchTime,0,0,10004,learned.ID].forEach((v,i)=>body.writeUInt32BE(v,i*4));
    await new PetSkillSwitchHandler().Handle(session(),new HeadInfo(),body);
    expect(commandPackets(2312).slice(-1)[0].readInt32BE(13)).toBe(0);
    const before=await stored(),turn=player.BattleManager.GetCurrentBattle()!.turn;
    await skill();await ppItem();
    expect(commandPackets(2405).slice(-1)[0].readInt32BE(13)).toBe(5001);
    expect(commandPackets(2406).slice(-1)[0].readInt32BE(13)).toBe(5001);
    expect(player.BattleManager.GetCurrentBattle()!.turn).toBe(turn);
    expect(await stored()).toEqual(before);expect(pet.skillPP![10004]).toBeUndefined();
  });

  test('exactly 35 to 33 survives actual victory settlement and a reopened SQLite battle', async () => {
    const battle=await seed(1,true);await skill();battle.enemy.hp=1;await skill();
    expect(player.BattleManager.GetCurrentBattle()).toBeNull();await reload();
    expect(player.PetManager.GetPetByCatchTime(catchTime)!.skillPP![10004]).toBe(33);
    const body=Buffer.alloc(4);body.writeUInt32BE(catchTime);
    await new GetPetInfoHandler().Handle(session(),new HeadInfo(),body);
    expect(commandPackets(2301).slice(-1)[0].readUInt32BE(153)).toBe(33);
    await new FightNpcMonsterHandler().Handle(session(),new HeadInfo(),Buffer.alloc(4));
    await new ReadyToFightHandler().Handle(session(),new HeadInfo(),Buffer.alloc(0));
    expect(player.BattleManager.GetCurrentBattle()!.player.skillPP).toEqual([33]);
  });

  test.each([2306, 2310])('%i outside-battle cure must not heal active PVE with no turn', async command => {
    const battle = await seed();
    const pet = player.PetManager.GetPetByCatchTime(catchTime)!;
    pet.hp = 321; (pet as any).skillPP = {10004: 0};
    await helper.SavePetData(player.PetManager.PetData, true);
    battle.player.hp = 321; battle.player.skillPP = [0];
    const before = await stored(), turn = battle.turn, stock = player.ItemManager.GetItemCount(300016), coins = player.Data.coins;
    const body = Buffer.alloc(command === 2306 ? 4 : 8); if (command === 2310) body.writeUInt32BE(catchTime);
    await (command === 2306 ? new PetCureHandler() : new PetOneCureHandler()).Handle(session(), new HeadInfo(), body);
    expect(commandPackets(command).slice(-1)[0].readInt32BE(13)).toBe(5001);
    expect(commandPackets(2505)).toHaveLength(0);
    expect(battle.player.hp).toBe(321);
    expect(battle.player.skillPP).toEqual([0]);
    expect(battle.turn).toBe(turn);
    expect(player.ItemManager.GetItemCount(300016)).toBe(stock);
    expect(player.Data.coins).toBe(coins);
    expect(await stored()).toEqual(before);
  });

  test.each(['currency', 'experience'] as const)('single recovery waiting for %s is cancelled by logout before charging or healing', async waitingFor => {
    await seed(); await skill();
    await new EscapeFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
    const pet = player.PetManager.GetPetByCatchTime(catchTime)!;
    pet.hp = 321; pet.skillPP = {10004: 0};
    await helper.SavePetData(player.PetManager.PetData, true);
    const before = await stored();
    packets.length = 0;

    const release = waitingFor === 'currency'
      ? player.Data.BeginCurrencyOperation()!
      : player.Data.BeginExpAllocation().release;
    const waitMethod = waitingFor === 'currency' ? 'WaitForCurrencyOperations' : 'WaitForExpAllocation';
    const wait = player.Data[waitMethod].bind(player.Data);
    let entered!: () => void;
    const ready = new Promise<void>(resolve => { entered = resolve; });
    jest.spyOn(player.Data, waitMethod).mockImplementationOnce(async () => {
      entered();
      await wait();
    });
    const body = Buffer.alloc(8); body.writeUInt32BE(catchTime);
    const pending = new PetOneCureHandler().Handle(session(), new HeadInfo(), body);
    await ready;
    const logout = player.BattleManager.OnLogout();
    release();
    await Promise.all([pending, logout]);

    expect(player.Data.coins).toBe(before.coins);
    expect(pet).toMatchObject({hp: 321, skillPP: {'10004': 0}});
    expect(await stored()).toEqual(before);
    expect(commandPackets(2310)).toHaveLength(0);
    expect(player.Data.HasExpAllocation()).toBe(false);
    const nextCurrencyOperation = player.Data.BeginCurrencyOperation();
    expect(nextCurrencyOperation).not.toBeNull();
    nextCurrencyOperation?.();
    const nextRecovery = player.BattleManager.BeginOutOfBattleRecovery();
    expect(nextRecovery).not.toBeNull();
    nextRecovery?.release();
  });

  test('out-of-battle recovery excludes concurrent battle entry, PVP room, map change and stale ack on logout', async () => {
    await seed(); await skill();
    await new EscapeFightHandler().Handle(session(), new HeadInfo(), Buffer.alloc(0));
    const pet = player.PetManager.GetPetByCatchTime(catchTime)!;
    pet.hp = 321; await helper.SavePetData(player.PetManager.PetData, true);
    const before = await stored();

    // 1. Pending PVP room rejects 2306/2310
    const roomKey = PvpBattleManager.Instance.CreateBattleRoom(uid, uid + 1);
    try {
      const oneBody = Buffer.alloc(8); oneBody.writeUInt32BE(catchTime);
      await new PetCureHandler().Handle(session(), new HeadInfo(), Buffer.alloc(4));
      await new PetOneCureHandler().Handle(session(), new HeadInfo(), oneBody);
      expect(commandPackets(2306).slice(-1)[0].readInt32BE(13)).toBe(5001);
      expect(commandPackets(2310).slice(-1)[0].readInt32BE(13)).toBe(5001);
      expect(await stored()).toEqual(before);
    } finally {
      PvpBattleManager.Instance.RemoveBattleRoom(roomKey);
    }
    packets.length = 0;

    // 2. Waiting on inventory lock when map changes invalidates recovery without DB write or ack
    const releaseInv = await player.ItemManager.ItemData.AcquireReward();
    const oneBody = Buffer.alloc(8); oneBody.writeUInt32BE(catchTime);
    const pendingMapCure = new PetOneCureHandler().Handle(session(), new HeadInfo(), oneBody);
    await new FightNpcMonsterHandler().Handle(session(), new HeadInfo(), Buffer.alloc(4));
    expect(commandPackets(2408).slice(-1)[0].readInt32BE(13)).toBe(5001);
    expect(player.BattleManager.GetCurrentBattle()).toBeNull();
    player.Data.mapID = 302;
    releaseInv();
    await pendingMapCure;
    expect(commandPackets(2310)).toHaveLength(0);
    expect(await stored()).toEqual(before);
    player.Data.mapID = 301;
    packets.length = 0;

    // 3. Recovery commit in progress rejects battle entry and OnLogout after commit waits without refund or stale ack
    const data = player.PetManager.PetData, commit = data.CommitPetUpdate.bind(data);
    let entered!: () => void, releaseCommit!: () => void;
    const ready = new Promise<void>(r => { entered = r; });
    const gate = new Promise<void>(r => { releaseCommit = r; });
    jest.spyOn(data, 'CommitPetUpdate').mockImplementationOnce((p, candidate, persist, onCommitted) =>
      commit(p, candidate, async staged => {
        await persist!(staged);
        entered();
        await gate;
      }, onCommitted));
    const pendingLogoutCure = new PetOneCureHandler().Handle(session(), new HeadInfo(), oneBody);
    await ready;
    await new FightNpcMonsterHandler().Handle(session(), new HeadInfo(), Buffer.alloc(4));
    expect(commandPackets(2408).slice(-1)[0].readInt32BE(13)).toBe(5001);
    expect(player.BattleManager.GetCurrentBattle()).toBeNull();
    const logoutPromise = player.BattleManager.OnLogout();
    releaseCommit();
    await Promise.all([pendingLogoutCure, logoutPromise]);
    expect(commandPackets(2310)).toHaveLength(0);
    const after = await stored();
    expect(after.coins).toBe(80);
    expect(after.pets[0]).toMatchObject({hp: pet.maxHp, skillPP: {'10004': 35}});
  });
});
