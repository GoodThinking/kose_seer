import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../../../shared/config/ConfigDefinitions';
import { GameConfig } from '../../../../shared/config/game/GameConfig';
import { createDefaultPetInfo } from '../../../../shared/models/PetModel';
import { PetCalculator } from '../PetCalculator';

describe('configured battle EV yields', () => {
  const values = (pet: ReturnType<typeof createDefaultPetInfo>) =>
    [pet.evHp, pet.evAtk, pet.evDef, pet.evSpAtk, pet.evSpDef, pet.evSpeed];
  beforeAll(async () => {
    ConfigRegistry.Instance.Register(ConfigKeys.PET_CONFIG, ConfigPaths[ConfigKeys.PET_CONFIG], ConfigType.XML);
    await ConfigRegistry.Instance.Initialize();
  });
  afterEach(() => jest.restoreAllMocks());
  test.each([
    [10, [0, 1, 0, 0, 0, 0]], [11, [0, 2, 0, 0, 0, 0]], [12, [0, 3, 0, 0, 0, 0]],
    [6, [0, 0, 0, 3, 0, 0]], [7, [0, 0, 0, 0, 0, 1]], [8, [0, 0, 0, 1, 0, 1]],
    [100001, [0, 1, 0, 0, 0, 0]], [100002, [0, 2, 0, 0, 0, 0]], [100003, [0, 3, 0, 0, 0, 0]],
    [100004, [0, 0, 0, 1, 0, 0]], [100005, [0, 0, 0, 2, 0, 0]], [100006, [0, 0, 0, 3, 0, 0]],
    [100007, [0, 1, 1, 0, 0, 0]], [100008, [0, 2, 2, 0, 0, 0]],
    [100009, [0, 0, 0, 1, 0, 0]], [100010, [0, 0, 0, 2, 0, 0]], [100011, [0, 0, 0, 3, 0, 0]],
    [110001, [0, 0, 0, 0, 0, 1]], [110002, [0, 0, 0, 1, 0, 1]], [110003, [0, 0, 0, 3, 0, 0]],
  ] as Array<[number, number[]]>)('enemy %i grants its configured attributes', (id, expected) => {
    const pet = createDefaultPetInfo(1, 4);
    expect(PetCalculator.ApplyBattleEV(pet, id)).toBe(true);
    expect(values(pet)).toEqual(expected);
  });
  test('single cap never spills points into another attribute', () => {
    const pet = createDefaultPetInfo(1, 4); pet.evAtk = 254;
    PetCalculator.ApplyBattleEV(pet, 100008);
    expect(values(pet)).toEqual([0, 255, 2, 0, 0, 0]);
  });
  test('total cap uses source order and never exceeds 510', () => {
    const pet = createDefaultPetInfo(1, 4); pet.evHp = 255; pet.evSpeed = 254;
    PetCalculator.ApplyBattleEV(pet, 100008);
    expect(values(pet)).toEqual([255, 1, 0, 0, 0, 254]);
    expect(PetCalculator.ApplyBattleEV(pet, 100008)).toBe(false);
  });
  test.each([undefined, '0 0 0 0 0 0'])('missing/zero legacy yield grants nothing (%s)', yieldEV => {
    jest.spyOn(GameConfig, 'GetPetById').mockReturnValue({YieldingEV: yieldEV} as any);
    const pet = createDefaultPetInfo(1, 4);
    expect(PetCalculator.ApplyBattleEV(pet, 1)).toBe(false);
    expect(values(pet)).toEqual([0, 0, 0, 0, 0, 0]);
  });
  test.each(['0 1', '0 -1 0 0 0 0', '0 1.5 0 0 0 0', '0 NaN 0 0 0 0'])('malformed yield fails before mutation: %s', yieldEV => {
    jest.spyOn(GameConfig, 'GetPetById').mockReturnValue({YieldingEV: yieldEV} as any);
    const pet = createDefaultPetInfo(1, 4);
    expect(() => PetCalculator.ApplyBattleEV(pet, 1)).toThrow('Invalid YieldingEV');
    expect(values(pet)).toEqual([0, 0, 0, 0, 0, 0]);
  });
  test('invalid stored EV is not silently repaired or rewarded', () => {
    const pet = createDefaultPetInfo(1, 4); pet.evAtk = 256;
    expect(() => PetCalculator.ApplyBattleEV(pet, 10)).toThrow('Invalid pet EV state');
    expect(pet.evAtk).toBe(256);
  });
});
