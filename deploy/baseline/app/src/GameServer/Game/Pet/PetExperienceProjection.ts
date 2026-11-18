import { GameConfig } from '../../../shared/config/game/GameConfig';
import { Config } from '../../../shared/config/ServerConfig';
import type { IPetInfo } from '../../../shared/models/PetModel';
import { PetCalculator } from './PetCalculator';

/** Store level-local experience; project cumulative fields only for clients that require them. */
export function GetPetExperienceFields(
  pet: Pick<IPetInfo, 'petId' | 'level' | 'exp'>,
  protocol: string
): { exp: number; currentLvExp: number; nextLvExp: number } {
  if (protocol !== 'xin-20261013' &&
      (Config.Game as typeof Config.Game & { cumulativePetExperience?: boolean }).cumulativePetExperience !== true) {
    return { exp: pet.exp, currentLvExp: 0,
      nextLvExp: pet.level === 100 ? pet.exp : Math.max(0,
        PetCalculator.CalculateExpForLevel(pet.level + 1, pet.petId) - PetCalculator.CalculateExpForLevel(pet.level, pet.petId)) };
  }
  if (!Number.isInteger(pet.level) || pet.level < 1 || pet.level > 100 ||
      !Number.isSafeInteger(pet.exp) || pet.exp < 0) {
    throw new Error('Invalid pet experience state');
  }
  const configs = GameConfig.GetAllPets();
  const config = configs.find(item => item.ID === pet.petId);
  if (!config) throw new Error(`Missing experience config: ${pet.petId}`);
  // Follow executable evolution edges in both directions; reject incompatible growth curves.
  const pending = [pet.petId], visited = new Set<number>();
  while (pending.length) {
    const id = pending.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const current = configs.find(item => item.ID === id)!;
    if ((current.GrowthType ?? 1) !== (config.GrowthType ?? 1)) {
      throw new Error(`Unsupported cross-GrowthType experience projection: ${pet.petId}`);
    }
    for (const other of configs) {
      if (other.ID === current.EvolvesTo || other.EvolvesTo === id) {
        if (!visited.has(other.ID)) pending.push(other.ID);
      }
    }
  }
  const base = Math.max(0, PetCalculator.CalculateExpForLevel(pet.level, pet.petId)
    - PetCalculator.CalculateExpForLevel(1, pet.petId));
  const exp = base + pet.exp;
  // At the cap there is no next level. Preserve saved overflow, but display zero remaining.
  const nextLvExp = pet.level === 100 ? exp : base + Math.max(0,
    PetCalculator.CalculateExpForLevel(pet.level + 1, pet.petId) - PetCalculator.CalculateExpForLevel(pet.level, pet.petId));
  if (![base, exp, nextLvExp].every(value => Number.isSafeInteger(value) && value <= 0xffffffff)) {
    throw new Error('Pet experience projection exceeds uint32');
  }
  return { exp, currentLvExp: base, nextLvExp };
}
