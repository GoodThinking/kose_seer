import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../../../shared/config/ConfigDefinitions';
import { GameConfig } from '../../../../shared/config/game/GameConfig';
import { BaseProto } from '../../../../shared/proto/base/BaseProto';
import { createDefaultPetInfo, IPetInfo } from '../../../../shared/models/PetModel';
import { PetManager } from '../PetManager';
import { SptSystem } from '../SptSystem';
import { PlayerInstance } from '../../Player/PlayerInstance';

const originalLearnsets: Record<number, number[][]> = {"124": [[10361, 1], [20156, 7], [10363, 12], [10362, 17], [10364, 21], [10366, 26], [20157, 32], [10356, 38], [20158, 43], [10370, 48], [10367, 53], [20159, 58], [10371, 63], [10368, 68], [20160, 73], [10372, 78], [10369, 85]], "300": [[10993, 1], [20498, 5], [10996, 10], [11261, 15], [11274, 20], [10997, 25], [20606, 30], [10994, 35], [20607, 40], [20499, 45], [10998, 50], [20608, 55], [20605, 60], [10995, 70], [10999, 80], [20500, 90], [11000, 100]], "504": [[10079, 1], [20679, 5], [10262, 9], [21084, 13], [12089, 17], [20955, 25], [11882, 29], [21076, 33], [12092, 37], [21077, 41], [12090, 45], [12093, 49], [21078, 53], [12091, 57], [12094, 61], [12095, 65]]};

function petHarness(petId: number, level: number) {
  const pet = createDefaultPetInfo(900000001, petId);
  pet.level = level;
  pet.skillArray = [10001];
  const packets: BaseProto[] = [];
  const commit = jest.fn(async (current: IPetInfo, candidate: IPetInfo) => Object.assign(current, candidate));
  const release = jest.fn();
  // This fixture supplies only the session-free surface used by PetManager.
  const player = {
    Uid: pet.userId,
    ItemManager: { ItemData: { AcquireReward: async () => () => {} } },
    SendPacket: async (packet: BaseProto) => { packets.push(packet); }
  } as unknown as PlayerInstance;
  const manager = new PetManager(player);
  manager.PetData = {
    GetPetByCatchTime: () => pet,
    AcquireMutation: async () => release,
    CommitPetUpdate: commit
  } as any;
  return { manager, pet, packets, commit, release };
}

function skillList(packet: BaseProto): number[] {
  const body = packet.serialize();
  const count = body.readUInt32BE(0);
  return Array.from({ length: count }, (_, i) => body.readUInt32BE(4 + i * 4));
}

describe('Pet learning configuration consistency', () => {
  beforeAll(async () => {
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SPT_CONFIG, ConfigKeys.SKILL_CONFIG]) {
      ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
    }
    await ConfigRegistry.Instance.Initialize();
  });

  test('every learning table contains unique skill IDs', () => {
    for (const config of [GameConfig.GetPetConfig()!, GameConfig.GetSptConfig()!]) {
      const monsters = config.Monsters.Monster!;
      const pets = Array.isArray(monsters) ? monsters : [monsters];
      for (const pet of pets) {
        const value = pet.LearnableMoves?.Move;
        const moves = value ? (Array.isArray(value) ? value : [value]) : [];
        expect({ petId: pet.ID, count: moves.length }).toEqual({ petId: pet.ID, count: new Set(moves.map(m => m.ID)).size });
      }
    }
  });

  test.each([124, 300, 504])('pet %i retains its complete original core learnset', petId => {
    expect(SptSystem.GetLearnableMoves(petId).map(m => [m.id, m.level])).toEqual(originalLearnsets[petId]);
  });

  test('124 never exposes the four client-undefined additions', async () => {
    const unknown = [26026, 31836, 26027, 31837];
    expect(SptSystem.GetDefaultSkills(124, 100).map(m => m.id)).toEqual([10368, 20160, 10372, 10369]);
    const h = petHarness(124, 100);
    await h.manager.HandleGetPetSkill(h.pet.catchTime);
    expect(skillList(h.packets[0]).filter(id => unknown.includes(id))).toEqual([]);
    for (const id of unknown) {
      await h.manager.HandleSkillSwitch(h.pet.catchTime, 0, 0, 10001, id);
      expect(h.packets[h.packets.length - 1].getResult()).toBe(5001);
    }
    expect(h.commit).not.toHaveBeenCalled();
  });

  test.each([[367, 10353, 15], [367, 20405, 22], [367, 10047, 15], [368, 10047, 15], [272, 10527, 37], [272, 10743, 53]])(
    'pet %i skill %i uses minimum level %i for SptSystem, list and replacement', async (petId, skillId, minLevel) => {
      expect(SptSystem.GetLearnableMoves(petId).filter(m => m.id === skillId)).toEqual([{ id: skillId, level: minLevel }]);
      for (const level of [minLevel - 1, minLevel]) {
        const allowed = level >= minLevel;
        expect(SptSystem.GetLearnableMovesByLevel(petId, level).some(m => m.id === skillId)).toBe(allowed);
        const h = petHarness(petId, level);
        await h.manager.HandleGetPetSkill(h.pet.catchTime);
        expect(skillList(h.packets[0]).includes(skillId)).toBe(allowed);
        expect(skillList(h.packets[0])).not.toContain(10001);
        await h.manager.HandleSkillSwitch(h.pet.catchTime, 0, 0, 10001, skillId);
        expect(h.packets[h.packets.length - 1].getResult()).toBe(allowed ? 0 : 5001);
        expect(h.commit).toHaveBeenCalledTimes(allowed ? 1 : 0);
        expect(h.release).toHaveBeenCalledTimes(1);
      }
    }
  );

  test.each([
    [93, 16, [10001, 10129, 20004, 10284]], [94, 16, [10001, 10129, 20004, 10284]],
    [270, 29, [20324, 10477, 10742, 20325]], [271, 29, [20324, 10477, 10742, 20325]],
    [272, 29, [20324, 10477, 10742, 20325]], [367, 29, [20045, 10353, 10047, 20405]],
    [368, 29, [20045, 10047, 10353, 20405]], [369, 29, [20045, 10047, 10353, 20405]],
    [375, 100, [20429, 10928, 10931, 10935]]
  ] as Array<[number, number, number[]]>)('pet %i default skills at level %i remain four distinct learned skills', (petId, level, expected) => {
    expect(SptSystem.GetDefaultSkills(petId, level).map(m => m.id)).toEqual(expected);
  });
});
