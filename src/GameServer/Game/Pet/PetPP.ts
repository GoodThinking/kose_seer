import { IPetInfo } from '../../../shared/models/PetModel';
import { GameConfig } from '../../../shared/config/game/GameConfig';

/** Stored by skill ID in player_pets.pet_list; only absent legacy/new-skill entries start full. */
export function GetPetSkillPP(pet: IPetInfo, skillId: number): number {
  const max = GetSkillMaxPP(skillId);
  if (pet.skillPP !== undefined && (!pet.skillPP || typeof pet.skillPP !== 'object' || Array.isArray(pet.skillPP))) {
    throw new Error('Invalid stored pet PP');
  }
  const value = pet.skillPP?.[skillId];
  if (value === undefined) return max;
  if (!Number.isInteger(value) || value < 0 || value > max) throw new Error('Stored skill PP out of range');
  return value;
}

export function GetSkillMaxPP(skillId: number): number {
  return GameConfig.GetSkillById(skillId)?.MaxPP || 20;
}

export function ReconcilePetPP(pet: IPetInfo, recover = false): Record<number, number> {
  const skills = pet.skillArray.filter(id => id > 0);
  return Object.fromEntries((skills.length ? skills : [10001]).map(id => {
    const current = GetPetSkillPP(pet, id);
    return [id, recover ? GetSkillMaxPP(id) : current];
  }));
}
