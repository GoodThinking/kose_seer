import { SptSystem } from '../../Pet/SptSystem';
import { BattleInitService } from '../services/BattleInitService';
import { ElementSystem } from '../ElementSystem';
import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../../../shared/config/ConfigDefinitions';
import { GameConfig } from '../../../../shared/config/game/GameConfig';
import { createDefaultPetInfo } from '../../../../shared/models/PetModel';
import { BattleType } from '../../../../shared/models/BattleModel';

beforeAll(async () => {
  for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SPT_CONFIG, ConfigKeys.SKILL_CONFIG]) {
    ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
  }
  for (const key of [ConfigKeys.ELEMENTS_CONFIG, ConfigKeys.NATURES_CONFIG]) {
    ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.JSON);
  }
  await ConfigRegistry.Instance.Initialize();
});

test.each([[1, 7], [4, 1], [7, 4]])('starter %i encounters the configured counter-element pet %i', async (petId, enemyId) => {
  const pet = Object.assign(createDefaultPetInfo(51001, petId), {level: 5, hp: 20, maxHp: 20, skillArray: SptSystem.GetDefaultSkills(petId, 5).map(skill => skill.id), isDefault: true});
  const service = new BattleInitService({Uid: 51001, PetManager: {GetPetsInBag: () => [pet]}} as any);
  const battle = await service.CreateBossBattle(515, 0);
  expect(battle).not.toBeNull();
  expect(battle!.battleType).toBe(BattleType.FRESH);
  expect(battle!.enemy.petId).toBe(enemyId);
  expect(battle!.enemy.level).toBe(3);
  expect(ElementSystem.GetEffectiveness(GameConfig.GetPetById(enemyId)!.Type, GameConfig.GetPetById(petId)!.Type)).toBe(2);
  expect(battle!.enemy.skills.every(id => !!GameConfig.GetSkillById(id))).toBe(true);
});

test('starter encounter does not fabricate a healthy pet', async () => {
  const service = new BattleInitService({Uid: 51001, PetManager: {GetPetsInBag: () => []}} as any);
  expect(await service.CreateBossBattle(515, 0)).toBeNull();
});
