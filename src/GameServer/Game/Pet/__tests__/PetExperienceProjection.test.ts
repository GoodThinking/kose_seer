import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../../../shared/config/ConfigDefinitions';
import { GameConfig } from '../../../../shared/config/game/GameConfig';
import { GetPetExperienceFields } from '../PetExperienceProjection';
import { Config } from '../../../../shared/config/ServerConfig';

describe('XIN cumulative experience output projection', () => {
  let oldOption: boolean | undefined;
  beforeAll(async () => {
    ConfigRegistry.Instance.Register(ConfigKeys.PET_CONFIG, ConfigPaths[ConfigKeys.PET_CONFIG], ConfigType.XML);
    await ConfigRegistry.Instance.Initialize();
    oldOption = Config.Game.cumulativePetExperience;
  });
  beforeEach(() => { delete Config.Game.cumulativePetExperience; });
  afterEach(() => {
    if (oldOption === undefined) delete Config.Game.cumulativePetExperience;
    else Config.Game.cumulativePetExperience = oldOption;
    jest.restoreAllMocks();
  });
  test('level boundary preserves the exact increase and remaining cost', () => {
    const old = GetPetExperienceFields({petId: 4, level: 5, exp: 262}, 'xin-20261013');
    const next = GetPetExperienceFields({petId: 4, level: 6, exp: 0}, 'xin-20261013');
    expect(old).toEqual({exp: 597, currentLvExp: 335, nextLvExp: 659});
    expect(next).toEqual({exp: 659, currentLvExp: 659, nextLvExp: 1173});
    expect(next.exp - old.exp).toBe(62);
    expect(next.nextLvExp - next.exp).toBe(514);
  });
  test('KOSE retains level-local fields', () => {
    expect(GetPetExperienceFields({petId: 4, level: 5, exp: 262}, 'kose'))
      .toEqual({exp: 262, currentLvExp: 0, nextLvExp: 324});
  });
  test('explicit false retains KOSE level-local fields', () => {
    Config.Game.cumulativePetExperience = false;
    expect(GetPetExperienceFields({petId: 4, level: 5, exp: 262}, 'kose'))
      .toEqual({exp: 262, currentLvExp: 0, nextLvExp: 324});
  });
  test('fixed Nieo opt-in enables the same cumulative fields without changing profile', () => {
    Config.Game.cumulativePetExperience = true;
    const old = GetPetExperienceFields({petId: 4, level: 5, exp: 262}, 'kose');
    const next = GetPetExperienceFields({petId: 4, level: 6, exp: 0}, 'kose');
    expect(old).toEqual({exp: 597, currentLvExp: 335, nextLvExp: 659});
    expect(next).toEqual({exp: 659, currentLvExp: 659, nextLvExp: 1173});
    expect(next.exp - old.exp).toBe(62);
  });
  test('XIN remains automatically cumulative with explicit false', () => {
    Config.Game.cumulativePetExperience = false;
    expect(GetPetExperienceFields({petId: 4, level: 5, exp: 262}, 'xin-20261013'))
      .toEqual({exp: 597, currentLvExp: 335, nextLvExp: 659});
  });
  test.each([[4, 435], [7, 435], [8, 435], [100001, 324], [100002, 324]])('projection uses the species cost without mutating persisted state (%i)', (petId, expected) => {
    const pet = Object.freeze({petId, level: 5, exp: 100});
    expect(GetPetExperienceFields(pet, 'xin-20261013').exp).toBe(expected);
    expect(pet.exp).toBe(100);
  });
  test.each([
    [{ID: 4, GrowthType: 3, EvolvesTo: 5}, {ID: 5, GrowthType: 2}],
    [{ID: 4, GrowthType: 3}, {ID: 5, GrowthType: 2, EvolvesTo: 4}],
  ])('rejects unsupported forward and incoming cross-growth edges', (first, second) => {
    jest.spyOn(GameConfig, 'GetAllPets').mockReturnValue([first, second] as any);
    expect(() => GetPetExperienceFields({petId: 4, level: 5, exp: 0}, 'xin-20261013'))
      .toThrow('Unsupported cross-GrowthType');
  });
  test.each([
    {petId: 4, level: 0, exp: 0}, {petId: 4, level: 101, exp: 0},
    {petId: 4, level: 5, exp: -1}, {petId: 4, level: 5, exp: 1.5},
  ])('rejects invalid experience state', pet => {
    expect(() => GetPetExperienceFields(pet, 'xin-20261013')).toThrow('Invalid pet experience state');
  });
  test('unknown species has no invented cumulative offset', () => {
    expect(() => GetPetExperienceFields({petId: 999999, level: 5, exp: 0}, 'xin-20261013'))
      .toThrow('Missing experience config');
  });
});
