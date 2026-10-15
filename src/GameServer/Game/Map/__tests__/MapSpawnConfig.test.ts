import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../../../shared/config/ConfigDefinitions';
import { GameConfig } from '../../../../shared/config/game/GameConfig';
import { MapSpawnManager } from '../MapSpawnManager';
import { IMapOgreSlot } from '../../../../shared/config/game/interfaces/IMapOgreConfig';

describe('UAT-007 ordinary map spawns and custom evolution mixing', () => {
  let playerMock: any;

  beforeAll(async () => {
    ConfigRegistry.Instance.Register(ConfigKeys.PET_CONFIG, ConfigPaths[ConfigKeys.PET_CONFIG], ConfigType.XML);
    ConfigRegistry.Instance.Register(ConfigKeys.MAP_OGRES, ConfigPaths[ConfigKeys.MAP_OGRES], ConfigType.JSON);
    await ConfigRegistry.Instance.Initialize();

    playerMock = {
      Uid: 100000003,
      UserID: 100000003,
      Data: { mapID: 20 },
      ClientProtocol: 'xin-20261013'
    };
  });

  test('122 map keys retain only the six existing empty maps, with valid pet IDs, slots, levels and no bosses', () => {
    const mapConfig = GameConfig.GetMapOgreConfig();
    expect(mapConfig).not.toBeNull();
    const mapKeys = Object.keys(mapConfig!.maps);
    expect(mapKeys).toHaveLength(122);
    // Existing content gaps are explicit; a new empty map must fail this guard.
    expect(mapKeys.filter(id => mapConfig!.maps[id].ogres.length === 0).map(Number).sort((a, b) => a - b))
      .toEqual([71, 80, 81, 86, 91, 817]);
    for (const [mapId, map] of Object.entries(mapConfig!.maps)) {
      expect(Number.isInteger(Number(mapId)) && Number(mapId) > 0).toBe(true);
      expect(new Set(map.ogres.map(o => o.slot)).size).toBe(map.ogres.length);
      expect(Number.isInteger(map.minCount) && map.minCount >= 1).toBe(true);
      expect(Number.isInteger(map.maxCount) && map.maxCount >= map.minCount && map.maxCount <= 9).toBe(true);
      for (const ogre of map.ogres) {
        expect(GameConfig.GetPetById(ogre.petId)).not.toBeNull();
        expect(Number.isInteger(ogre.slot) && ogre.slot >= 0 && ogre.slot <= 8).toBe(true);
        expect(ogre.isBoss).not.toBe(true);
        expect(Number.isFinite(ogre.weight) && ogre.weight > 0).toBe(true);
        expect(Number.isInteger(ogre.minLevel) && ogre.minLevel! >= 1).toBe(true);
        expect(Number.isInteger(ogre.maxLevel) && ogre.maxLevel! >= ogre.minLevel! && ogre.maxLevel! <= 100).toBe(true);
        if (ogre.level != null) {
          expect(Number.isInteger(ogre.level) && ogre.level >= ogre.minLevel! && ogre.level <= ogre.maxLevel!).toBe(true);
        }
        if (ogre.refreshConfig.shinyPetId > 0) {
          expect(GameConfig.GetPetById(ogre.refreshConfig.shinyPetId)).not.toBeNull();
        }
      }
    }
  });

  test('Map 20 (海洋星浅水区) only spawns water/flying pets (贝尔, 阿布, 毛毛) and never electric pets', () => {
    expect(GameConfig.GetMapConfigById(20).ogres.map((o: IMapOgreSlot) => o.petId)).toEqual([30, 31, 22]);
    const spawnMgr = new MapSpawnManager(playerMock);
    spawnMgr.OnEnterMap(20);
    const ogres = spawnMgr.GetMapOgres(20).filter(o => o.petId > 0);
    expect(ogres.length).toBeGreaterThan(0);
    for (const o of ogres) {
      expect([30, 31, 22]).toContain(o.originalPetId);
      expect(o.originalPetId).not.toBe(13); // 比比鼠 (电系) must NOT appear on Ocean Star
    }
  });

  test('removed boss additions never enter ordinary ogre or boss spawn lists', () => {
    const removedBosses = [[12, 47], [17, 42], [22, 34], [27, 46], [32, 70],
      [40, 50], [49, 108], [52, 160], [106, 94], [314, 132]];
    const random = jest.spyOn(Math, 'random').mockReturnValue(0);
    try {
      for (const [mapId, bossId] of removedBosses) {
        const spawnMgr = new MapSpawnManager(playerMock);
        spawnMgr.OnEnterMap(mapId);
        expect(GameConfig.GetMapConfigById(mapId).ogres.map((o: IMapOgreSlot) => o.petId)).not.toContain(bossId);
        expect(spawnMgr.GetMapBosses(mapId)).toEqual([]);
        const activeOgres = spawnMgr.GetMapOgres(mapId).filter(o => o.petId > 0);
        expect(activeOgres.length).toBeGreaterThan(0);
        expect(activeOgres.map(o => o.originalPetId)).not.toContain(bossId);
      }
    } finally {
      random.mockRestore();
    }
  });

  test('Map 57 (尼古尔星) mixes 1st and 2nd evolution forms (米隆 235 & 米洛尼 236)', () => {
    const spawnMgr = new MapSpawnManager(playerMock);
    spawnMgr.OnEnterMap(57);
    const mapConf = GameConfig.GetMapConfigById(57);
    expect(mapConf).not.toBeNull();
    const petIds = mapConf.ogres.map((o: any) => o.petId);
    expect(petIds).toEqual([235, 236]);
    const firstForm = GameConfig.GetPetById(235)!;
    expect(Number(firstForm.EvolvesTo)).toBe(236);
    expect(mapConf.ogres.find((o: IMapOgreSlot) => o.petId === 236)!.minLevel).toBeGreaterThanOrEqual(Number(firstForm.EvolvingLv));
  });

  test('Map 30 (赫尔卡星表面) spawns electric pets (比比鼠 13, 闪电鼠 14, 闪光电击兔 286)', () => {
    const spawnMgr = new MapSpawnManager(playerMock);
    spawnMgr.OnEnterMap(30);
    const mapConf = GameConfig.GetMapConfigById(30);
    const petIds = mapConf.ogres.map((o: any) => o.petId);
    expect(petIds).toContain(13); // 比比鼠
    expect(petIds).toContain(14); // 闪电鼠
    expect(petIds).toContain(286); // 闪光电击兔
    expect(petIds).not.toContain(30); // 贝尔 (水系) must NOT appear on Helka
  });
});
