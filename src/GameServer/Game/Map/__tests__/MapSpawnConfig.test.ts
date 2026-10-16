import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../../../shared/config/ConfigDefinitions';
import { GameConfig } from '../../../../shared/config/game/GameConfig';
import { MapSpawnManager } from '../MapSpawnManager';
import { IMapOgreSlot } from '../../../../shared/config/game/interfaces/IMapOgreConfig';

describe('ordinary map spawns with initial evolution forms', () => {
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

  test('122 map keys retain only explicit empty ordinary pools, with valid pet IDs, slots, levels and no bosses', () => {
    const mapConfig = GameConfig.GetMapOgreConfig();
    expect(mapConfig).not.toBeNull();
    const mapKeys = Object.keys(mapConfig!.maps);
    expect(mapKeys).toHaveLength(122);
    // Activity, task and unsupported future maps intentionally have no ordinary encounter pool.
    expect(mapKeys.filter(id => mapConfig!.maps[id].ogres.length === 0).map(Number).sort((a, b) => a - b))
      .toEqual([12, 45, 71, 80, 81, 86, 91, 811, 817]);
    for (const [mapId, map] of Object.entries(mapConfig!.maps)) {
      expect(Number.isInteger(Number(mapId)) && Number(mapId) > 0).toBe(true);
      expect(new Set(map.ogres.map(o => o.slot)).size).toBe(map.ogres.length);
      expect(Number.isInteger(map.minCount) && map.minCount >= 1).toBe(true);
      expect(Number.isInteger(map.maxCount) && map.maxCount >= map.minCount && map.maxCount <= 9).toBe(true);
      for (const ogre of map.ogres) {
        expect(GameConfig.GetPetById(ogre.petId)).not.toBeNull();
        expect(Number(GameConfig.GetPetById(ogre.petId)!.EvolvesFrom || 0)).toBe(0);
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

  test('Ocean Star layers 20-22 keep their canonical encounter mapping', () => {
    const layers = [
      { mapId: 20, mapName: '海洋星浅水区', petIds: [30], petNames: ['贝尔'] },
      { mapId: 21, mapName: '海洋星深水区', petIds: [33], petNames: ['利牙鱼'] },
      { mapId: 22, mapName: '海洋星海底', petIds: [198], petNames: ['小鳍鱼'] },
    ];
    const random = jest.spyOn(Math, 'random');

    try {
      for (const { mapId, mapName, petIds, petNames } of layers) {
        const mapConfig = GameConfig.GetMapConfigById(mapId);
        expect(mapConfig.name).toBe(mapName);
        expect(mapConfig.ogres.map((ogre: IMapOgreSlot) => ogre.petId)).toEqual(petIds);
        expect(petIds.map(petId => GameConfig.GetPetById(petId)?.DefName)).toEqual(petNames);

        const spawnedIds = new Set<number>();
        for (const randomValue of [0, 0.99]) {
          random.mockReturnValue(randomValue);
          const spawnMgr = new MapSpawnManager(playerMock);
          spawnMgr.OnEnterMap(mapId);
          const activeOgres = spawnMgr.GetMapOgres(mapId).filter(ogre => ogre.petId > 0);
          expect(activeOgres.length).toBeGreaterThan(0);
          expect(activeOgres.every(ogre => petIds.includes(ogre.originalPetId))).toBe(true);
          activeOgres.forEach(ogre => spawnedIds.add(ogre.originalPetId));
        }
        expect([...spawnedIds].sort((a, b) => a - b)).toEqual([...petIds].sort((a, b) => a - b));
      }
    } finally {
      random.mockRestore();
    }
  });

  test('official boss, activity and task pets stay out of ordinary catchable pools', () => {
    const excluded = [
      { mapId: 12, petIds: [65, 68] },
      { mapId: 45, petIds: [1485] },
      { mapId: 51, petIds: [153] },
      { mapId: 105, petIds: [80] },
      { mapId: 811, petIds: [1491] },
    ];
    for (const { mapId, petIds } of excluded) {
      const configured = GameConfig.GetMapConfigById(mapId).ogres.map((ogre: IMapOgreSlot) => ogre.petId);
      petIds.forEach(petId => expect(configured).not.toContain(petId));
    }

    for (const [mapId, petId] of [[29, 872], [343, 397]]) {
      const ogre = GameConfig.GetMapConfigById(mapId).ogres.find((entry: IMapOgreSlot) => entry.petId === petId);
      expect(ogre).toEqual(expect.objectContaining({ catchable: false, catchRate: 0 }));
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
        expect(activeOgres.map(o => o.originalPetId)).not.toContain(bossId);
      }
    } finally {
      random.mockRestore();
    }
  });

});
